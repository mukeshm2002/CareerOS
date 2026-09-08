const prisma = require('../config/db');

class OnboardingService {
  async getOnboardingState(userId) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        onboardingCompleted: true,
        profile: true,
        goals: {
          select: {
            id: true,
            title: true,
            type: true,
            priority: true,
            targetDate: true,
            targetRole: true,
            targetSalary: true,
            salaryCurrency: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      onboardingCompleted: user.onboardingCompleted,
      currentStep: user.profile?.onboardingStep || 1,
      profile: user.profile,
      onboardingDraft: user.profile?.onboardingDraft || null,
      goals: user.goals,
    };
  }

  async updateDraftProfile(userId, data) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const updatePayload = { ...data };
    if (data.onboardingDraft !== undefined) {
      updatePayload.onboardingDraft = data.onboardingDraft;
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: updatePayload,
      create: {
        userId,
        ...updatePayload,
      },
    });

    return updatedProfile;
  }

  async updateProgressStep(userId, step) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const updatedProfile = await prisma.userProfile.upsert({
      where: { userId },
      update: { onboardingStep: step },
      create: {
        userId,
        onboardingStep: step,
      },
    });

    return { currentStep: updatedProfile.onboardingStep };
  }

  async completeOnboarding(userId, payload) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const {
      situation,
      currentRole,
      targetRole,
      targetSalary,
      experienceLevel,
      timezone,
      country,
      wakeTime,
      workStartTime,
      workEndTime,
      personalStartTime,
      personalEndTime,
      sleepTime,
      availableCareerMinutes,
      careerMission,
      goals,
      skills,
    } = payload;

    // Check if user exists and whether already onboarded to prevent duplicate goal creation
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });

    if (!currentUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    if (currentUser.onboardingCompleted) {
      const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, goals: true },
      });
      return {
        user: fullUser,
        goals: fullUser.goals,
      };
    }

    // Prepare goals in-memory prior to opening transaction
    const sanitizedGoals = [];
    if (Array.isArray(goals) && goals.length > 0) {
      for (const g of goals) {
        let parsedTargetDate = null;
        if (g.targetDate) {
          const d = new Date(g.targetDate);
          if (!isNaN(d.getTime())) {
            parsedTargetDate = d;
          }
        }

        sanitizedGoals.push({
          userId,
          title: g.title,
          description: g.description || null,
          type: g.type || 'JOB_SWITCH',
          priority: g.priority || 'HIGH',
          targetDate: parsedTargetDate,
          targetRole: g.targetRole || targetRole,
          targetSalary: g.targetSalary || targetSalary,
          salaryCurrency: g.salaryCurrency || 'USD',
          status: 'ACTIVE',
          progress: 0,
        });
      }
    }

    // Sanitize and deduplicate skills in-memory prior to opening transaction
    const sanitizedSkillsMap = new Map();
    if (Array.isArray(skills) && skills.length > 0) {
      for (const s of skills) {
        if (!s || !s.name || typeof s.name !== 'string') continue;
        const trimmedName = s.name.trim();
        if (!trimmedName) continue;
        const normalized = trimmedName.toLowerCase();
        if (!sanitizedSkillsMap.has(normalized)) {
          sanitizedSkillsMap.set(normalized, {
            name: trimmedName,
            normalizedName: normalized,
            category: s.category || 'TECHNICAL',
            selfRating: typeof s.selfRating === 'number' ? s.selfRating : 3,
          });
        }
      }
    }
    const sanitizedSkills = Array.from(sanitizedSkillsMap.values());
    const normalizedSkillNames = sanitizedSkills.map((s) => s.normalizedName);

    // Prefetch known catalog skills before opening transaction to minimize transaction lifetime
    let prefetchedSkills = [];
    if (normalizedSkillNames.length > 0) {
      prefetchedSkills = await prisma.skill.findMany({
        where: { normalizedName: { in: normalizedSkillNames } },
        select: { id: true, normalizedName: true },
      });
    }
    const skillIdMap = new Map(prefetchedSkills.map((sk) => [sk.normalizedName, sk.id]));

    // Atomic transaction for finalization with production latency configuration
    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Update Profile
        const profile = await tx.userProfile.upsert({
          where: { userId },
          update: {
            currentSituation: situation,
            currentRole,
            targetRole,
            targetSalary,
            experienceLevel,
            timezone: timezone || 'UTC',
            country: country || null,
            wakeTime,
            workStartTime,
            workEndTime,
            personalStartTime,
            personalEndTime,
            sleepTime,
            availableCareerMinutes: availableCareerMinutes || 140,
            careerMission: careerMission || `Achieve target role: ${targetRole || 'Software Professional'}`,
            onboardingStep: 7,
            onboardingDraft: null, // Clear draft after successful completion
          },
          create: {
            userId,
            currentSituation: situation,
            currentRole,
            targetRole,
            targetSalary,
            experienceLevel,
            timezone: timezone || 'UTC',
            country: country || null,
            wakeTime,
            workStartTime,
            workEndTime,
            personalStartTime,
            personalEndTime,
            sleepTime,
            availableCareerMinutes: availableCareerMinutes || 140,
            careerMission: careerMission || `Achieve target role: ${targetRole || 'Software Professional'}`,
            onboardingStep: 7,
            onboardingDraft: null,
          },
        });

        // 2. Create Goals (batch creation via createManyAndReturn strictly once)
        let createdGoals = [];
        if (sanitizedGoals.length > 0) {
          createdGoals = await tx.goal.createManyAndReturn({
            data: sanitizedGoals,
          });
        }

        // 3. Store Baseline Skills (labeled Self Assessment)
        if (sanitizedSkills.length > 0) {
          // Identify any missing global skills not found during prefetch
          const missingSkills = sanitizedSkills.filter((s) => !skillIdMap.has(s.normalizedName));

          if (missingSkills.length > 0) {
            await tx.skill.createMany({
              data: missingSkills.map((s) => ({
                name: s.name,
                normalizedName: s.normalizedName,
                category: s.category,
              })),
              skipDuplicates: true,
            });

            const newlyCreatedSkills = await tx.skill.findMany({
              where: { normalizedName: { in: missingSkills.map((s) => s.normalizedName) } },
              select: { id: true, normalizedName: true },
            });

            for (const ncs of newlyCreatedSkills) {
              skillIdMap.set(ncs.normalizedName, ncs.id);
            }
          }

          // Link skills to user (batch insert UserSkill with skipDuplicates)
          const allSkillIds = sanitizedSkills
            .map((s) => skillIdMap.get(s.normalizedName))
            .filter(Boolean);

          if (allSkillIds.length > 0) {
            const existingUserSkills = await tx.userSkill.findMany({
              where: {
                userId,
                skillId: { in: allSkillIds },
              },
              select: { skillId: true, currentLevel: true },
            });

            const existingUserSkillMap = new Map(
              existingUserSkills.map((us) => [us.skillId, us.currentLevel])
            );

            const toCreateUserSkills = [];
            const toUpdateUserSkills = [];

            for (const s of sanitizedSkills) {
              const skillId = skillIdMap.get(s.normalizedName);
              if (!skillId) continue;
              const rating = s.selfRating;

              if (!existingUserSkillMap.has(skillId)) {
                toCreateUserSkills.push({
                  userId,
                  skillId,
                  currentLevel: rating,
                  targetLevel: 4,
                  evidence: 'Onboarding Self Assessment Baseline',
                });
              } else if (existingUserSkillMap.get(skillId) !== rating) {
                toUpdateUserSkills.push({
                  skillId,
                  currentLevel: rating,
                });
              }
            }

            if (toCreateUserSkills.length > 0) {
              await tx.userSkill.createMany({
                data: toCreateUserSkills,
                skipDuplicates: true,
              });
            }

            for (const item of toUpdateUserSkills) {
              await tx.userSkill.update({
                where: {
                  userId_skillId: {
                    userId,
                    skillId: item.skillId,
                  },
                },
                data: {
                  currentLevel: item.currentLevel,
                },
              });
            }
          }
        }

        // 4. Update User.onboardingCompleted = true
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { onboardingCompleted: true },
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            onboardingCompleted: true,
            createdAt: true,
          },
        });

        return {
          user: {
            ...updatedUser,
            profile,
          },
          goals: createdGoals,
        };
      },
      {
        maxWait: 10000,
        timeout: 20000,
      }
    );

    return result;
  }
}

module.exports = new OnboardingService();
