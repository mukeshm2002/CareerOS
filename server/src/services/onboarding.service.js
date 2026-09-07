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

    // Check if user is already onboarded to prevent duplicate goal creation
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingCompleted: true },
    });

    if (currentUser?.onboardingCompleted) {
      const fullUser = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true, goals: true },
      });
      return {
        user: fullUser,
        goals: fullUser.goals,
      };
    }

    // Atomic transaction for finalization
    const result = await prisma.$transaction(async (tx) => {
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

      // 2. Create Goals (strictly once)
      const createdGoals = [];
      if (Array.isArray(goals) && goals.length > 0) {
        for (const g of goals) {
          let parsedTargetDate = null;
          if (g.targetDate) {
            const d = new Date(g.targetDate);
            if (!isNaN(d.getTime())) {
              parsedTargetDate = d;
            }
          }

          const createdGoal = await tx.goal.create({
            data: {
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
            },
          });
          createdGoals.push(createdGoal);
        }
      }

      // 3. Store Baseline Skills (labeled Self Assessment)
      if (Array.isArray(skills) && skills.length > 0) {
        for (const s of skills) {
          const normalized = (s.name || '').trim().toLowerCase();
          const skillRecord = await tx.skill.upsert({
            where: { normalizedName: normalized },
            update: {},
            create: {
              name: s.name.trim(),
              normalizedName: normalized,
              category: s.category || 'TECHNICAL',
            },
          });

          await tx.userSkill.upsert({
            where: {
              userId_skillId: {
                userId,
                skillId: skillRecord.id,
              },
            },
            update: {
              currentLevel: s.selfRating || 3,
            },
            create: {
              userId,
              skillId: skillRecord.id,
              currentLevel: s.selfRating || 3,
              targetLevel: 4,
              evidence: 'Onboarding Self Assessment Baseline',
            },
          });
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
    });

    return result;
  }
}

module.exports = new OnboardingService();
