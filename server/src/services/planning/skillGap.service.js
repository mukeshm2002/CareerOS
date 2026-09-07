const prisma = require('../../config/db');

class SkillGapService {
  /**
   * Normalize skill name: lowercase, trimmed, collapse internal spaces
   * Example: "  Spring   Boot " -> "spring boot"
   */
  normalizeSkillName(name) {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  /**
   * Find or create a global normalized skill
   */
  async getOrCreateGlobalSkill(name, category = 'TECHNICAL', description = null) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      const error = new Error('Skill name is required');
      error.statusCode = 400;
      throw error;
    }

    const trimmedName = name.trim();
    const normalized = this.normalizeSkillName(trimmedName);

    // Try finding by normalizedName
    let skill = await prisma.skill.findUnique({
      where: { normalizedName: normalized },
    });

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name: trimmedName,
          normalizedName: normalized,
          category: category || 'TECHNICAL',
          description: description || null,
        },
      });
    }

    return skill;
  }

  /**
   * Search / list global skills
   */
  async getGlobalSkills(search = '') {
    const where = {};
    if (search && search.trim()) {
      const normalizedSearch = this.normalizeSkillName(search);
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { normalizedName: { contains: normalizedSearch, mode: 'insensitive' } },
      ];
    }

    return prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 50,
    });
  }

  /**
   * Get all assessed skills for a user
   */
  async getUserSkills(userId) {
    const userSkills = await prisma.userSkill.findMany({
      where: { userId },
      include: {
        skill: true,
      },
      orderBy: [
        { skill: { category: 'asc' } },
        { skill: { name: 'asc' } },
      ],
    });

    return userSkills.map((us) => {
      const gap = Math.max(0, us.targetLevel - us.currentLevel);
      let gapPriority = 'READY';
      if (gap >= 3) gapPriority = 'CRITICAL';
      else if (gap === 2) gapPriority = 'HIGH';
      else if (gap === 1) gapPriority = 'MODERATE';

      return {
        ...us,
        gap,
        gapPriority,
      };
    });
  }

  /**
   * Add or upsert user skill assessment
   */
  async upsertUserSkill(userId, data) {
    const {
      skillId,
      skillName,
      category = 'TECHNICAL',
      currentLevel = 1,
      targetLevel = 4,
      assessmentType = 'SELF_ASSESSMENT',
      evidence = null,
      notes = null,
    } = data;

    // Validate levels (1 - 5)
    const cur = parseInt(currentLevel, 10);
    const tar = parseInt(targetLevel, 10);

    if (isNaN(cur) || cur < 1 || cur > 5) {
      const error = new Error('currentLevel must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    if (isNaN(tar) || tar < 1 || tar > 5) {
      const error = new Error('targetLevel must be an integer between 1 and 5');
      error.statusCode = 400;
      throw error;
    }

    let targetSkillId = skillId;
    if (!targetSkillId) {
      if (!skillName || !skillName.trim()) {
        const error = new Error('Either skillId or skillName is required');
        error.statusCode = 400;
        throw error;
      }
      const globalSkill = await this.getOrCreateGlobalSkill(skillName, category);
      targetSkillId = globalSkill.id;
    } else {
      // Verify skill exists
      const globalSkill = await prisma.skill.findUnique({
        where: { id: targetSkillId },
      });
      if (!globalSkill) {
        const error = new Error('Skill not found');
        error.statusCode = 404;
        throw error;
      }
    }

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId: targetSkillId,
        },
      },
      update: {
        currentLevel: cur,
        targetLevel: tar,
        assessmentType: assessmentType || 'SELF_ASSESSMENT',
        evidence: evidence !== undefined ? evidence : undefined,
        notes: notes !== undefined ? notes : undefined,
        lastPracticedAt: new Date(),
      },
      create: {
        userId,
        skillId: targetSkillId,
        currentLevel: cur,
        targetLevel: tar,
        assessmentType: assessmentType || 'SELF_ASSESSMENT',
        evidence,
        notes,
        lastPracticedAt: new Date(),
      },
      include: {
        skill: true,
      },
    });

    const gap = Math.max(0, userSkill.targetLevel - userSkill.currentLevel);
    let gapPriority = 'READY';
    if (gap >= 3) gapPriority = 'CRITICAL';
    else if (gap === 2) gapPriority = 'HIGH';
    else if (gap === 1) gapPriority = 'MODERATE';

    return {
      ...userSkill,
      gap,
      gapPriority,
    };
  }

  /**
   * Update an existing UserSkill by ID
   */
  async updateUserSkill(userId, userSkillId, data) {
    const existing = await prisma.userSkill.findFirst({
      where: { id: userSkillId, userId },
    });

    if (!existing) {
      const error = new Error('User skill record not found');
      error.statusCode = 404;
      throw error;
    }

    const updatePayload = {};
    if (data.currentLevel !== undefined) {
      const cur = parseInt(data.currentLevel, 10);
      if (isNaN(cur) || cur < 1 || cur > 5) {
        const error = new Error('currentLevel must be between 1 and 5');
        error.statusCode = 400;
        throw error;
      }
      updatePayload.currentLevel = cur;
    }

    if (data.targetLevel !== undefined) {
      const tar = parseInt(data.targetLevel, 10);
      if (isNaN(tar) || tar < 1 || tar > 5) {
        const error = new Error('targetLevel must be between 1 and 5');
        error.statusCode = 400;
        throw error;
      }
      updatePayload.targetLevel = tar;
    }

    if (data.evidence !== undefined) updatePayload.evidence = data.evidence;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.assessmentType !== undefined) updatePayload.assessmentType = data.assessmentType;
    updatePayload.lastPracticedAt = new Date();

    const updated = await prisma.userSkill.update({
      where: { id: userSkillId },
      data: updatePayload,
      include: { skill: true },
    });

    // Phase 1E: Immutable skill assessment history record whenever currentLevel changes (Section 16)
    if (updatePayload.currentLevel !== undefined && updatePayload.currentLevel !== existing.currentLevel) {
      await prisma.userSkillAssessmentHistory.create({
        data: {
          userId,
          userSkillId: updated.id,
          skillId: updated.skillId,
          previousLevel: existing.currentLevel,
          newLevel: updated.currentLevel,
          targetLevel: updated.targetLevel,
          assessmentType: updated.assessmentType,
          evidence: updated.evidence,
          notes: updated.notes,
          changedAt: new Date(),
        },
      });
    }

    const gap = Math.max(0, updated.targetLevel - updated.currentLevel);
    let gapPriority = 'READY';
    if (gap >= 3) gapPriority = 'CRITICAL';
    else if (gap === 2) gapPriority = 'HIGH';
    else if (gap === 1) gapPriority = 'MODERATE';

    return {
      ...updated,
      gap,
      gapPriority,
    };
  }

  /**
   * Get immutable assessment history for a specific UserSkill (Section 21)
   */
  async getSkillAssessmentHistory(userId, userSkillId) {
    const userSkill = await prisma.userSkill.findFirst({
      where: { id: userSkillId, userId },
      include: { skill: true },
    });

    if (!userSkill) {
      const error = new Error('User skill record not found');
      error.statusCode = 404;
      throw error;
    }

    return prisma.userSkillAssessmentHistory.findMany({
      where: { userId, userSkillId },
      orderBy: { changedAt: 'desc' },
      include: { skill: true },
    });
  }

  /**
   * Get all skill assessment history for a user across all skills
   */
  async getAllSkillHistory(userId, limit = 50) {
    return prisma.userSkillAssessmentHistory.findMany({
      where: { userId },
      orderBy: { changedAt: 'desc' },
      take: limit,
      include: { skill: true },
    });
  }

  /**
   * Delete user skill assessment
   */
  async deleteUserSkill(userId, userSkillId) {
    const existing = await prisma.userSkill.findFirst({
      where: { id: userSkillId, userId },
    });

    if (!existing) {
      const error = new Error('User skill record not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.userSkill.delete({
      where: { id: userSkillId },
    });

    return { success: true, message: 'Skill assessment removed' };
  }

  /**
   * Calculate gaps and Self-Assessed Role Readiness (Section 13 & 14)
   * Formula: Sum(min(currentLevel, targetLevel)) / Sum(targetLevel) * 100
   */
  async calculateGapsAndReadiness(userId) {
    const userSkills = await this.getUserSkills(userId);

    // Filter target skills
    const assessedSkills = userSkills.map((us) => {
      const gap = Math.max(0, us.targetLevel - us.currentLevel);
      let gapPriority = 'READY';
      if (gap >= 3) gapPriority = 'CRITICAL';
      else if (gap === 2) gapPriority = 'HIGH';
      else if (gap === 1) gapPriority = 'MODERATE';

      return {
        id: us.id,
        skillId: us.skillId,
        skillName: us.skill.name,
        category: us.skill.category,
        currentLevel: us.currentLevel,
        targetLevel: us.targetLevel,
        gap,
        gapPriority,
        evidence: us.evidence,
        notes: us.notes,
        assessmentType: us.assessmentType,
        lastPracticedAt: us.lastPracticedAt,
      };
    });

    // Readiness calculation
    if (assessedSkills.length === 0) {
      return {
        hasEnoughData: false,
        readinessScore: null,
        label: 'Self-Assessed Role Readiness',
        disclaimer: 'Based on your self assessment',
        message: 'Not enough information yet. Add target skills to calculate readiness.',
        totalSkills: 0,
        gaps: [],
        topGaps: [],
      };
    }

    const totalTarget = assessedSkills.reduce((sum, s) => sum + s.targetLevel, 0);
    const totalAchievedTowardsTarget = assessedSkills.reduce(
      (sum, s) => sum + Math.min(s.currentLevel, s.targetLevel),
      0
    );

    let readinessScore = 0;
    if (totalTarget > 0) {
      readinessScore = Math.round((totalAchievedTowardsTarget / totalTarget) * 100);
    }

    // Sort gaps by priority descending (Critical -> High -> Moderate -> Ready)
    const sortedGaps = [...assessedSkills].sort((a, b) => {
      if (b.gap !== a.gap) return b.gap - a.gap;
      return a.skillName.localeCompare(b.skillName);
    });

    const topGaps = sortedGaps.filter((s) => s.gap > 0).slice(0, 5);

    return {
      hasEnoughData: true,
      readinessScore,
      label: 'Self-Assessed Role Readiness',
      disclaimer: 'This score is based on your current self assessment, not a verified competency test.',
      totalSkills: assessedSkills.length,
      gaps: sortedGaps,
      topGaps,
    };
  }
}

module.exports = new SkillGapService();
