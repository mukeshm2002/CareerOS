const prisma = require('../../config/db');
const skillGapService = require('../planning/skillGap.service');

class EvidenceService {
  /**
   * Validate linked entities belong to user
   */
  async validateEntityOwnership(userId, { projectId, projectMilestoneId, learningModuleId }) {
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
      });
      if (!project) {
        const err = new Error('Referenced project not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (projectMilestoneId) {
      const milestone = await prisma.projectMilestone.findFirst({
        where: { id: projectMilestoneId, userId },
      });
      if (!milestone) {
        const err = new Error('Referenced milestone not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (learningModuleId) {
      const module = await prisma.learningModule.findFirst({
        where: { id: learningModuleId, userId },
      });
      if (!module) {
        const err = new Error('Referenced learning module not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }
  }

  /**
   * List evidence with filters
   */
  async listEvidence(userId, query = {}) {
    const where = { userId };

    if (query.projectId) {
      where.projectId = query.projectId;
    }

    if (query.projectMilestoneId) {
      where.projectMilestoneId = query.projectMilestoneId;
    }

    if (query.learningModuleId) {
      where.learningModuleId = query.learningModuleId;
    }

    const typeFilter = query.type || query.evidenceType;
    if (typeFilter && typeFilter !== 'ALL') {
      where.evidenceType = typeFilter;
    }

    if (query.skillId) {
      where.skills = {
        some: {
          skillId: query.skillId,
        },
      };
    }

    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { fileName: { contains: searchTerm, mode: 'insensitive' } },
        { externalReference: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const evidence = await prisma.evidence.findMany({
      where,
      include: {
        project: {
          select: { id: true, title: true, isPortfolioVisible: true },
        },
        projectMilestone: {
          select: { id: true, title: true },
        },
        learningModule: {
          select: { id: true, title: true },
        },
        skills: {
          include: {
            skill: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return { evidence };
  }

  /**
   * Get single evidence by ID
   */
  async getEvidenceById(userId, evidenceId) {
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId },
      include: {
        project: {
          select: { id: true, title: true, isPortfolioVisible: true },
        },
        projectMilestone: {
          select: { id: true, title: true },
        },
        learningModule: {
          select: { id: true, title: true },
        },
        skills: {
          include: {
            skill: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
    });

    if (!evidence) {
      const err = new Error('Evidence not found');
      err.statusCode = 404;
      throw err;
    }

    return evidence;
  }

  /**
   * Create evidence (does NOT automatically upgrade skill levels - Section 19)
   */
  async createEvidence(userId, data) {
    await this.validateEntityOwnership(userId, {
      projectId: data.projectId,
      projectMilestoneId: data.projectMilestoneId,
      learningModuleId: data.learningModuleId,
    });

    const evidence = await prisma.evidence.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        evidenceType: data.evidenceType || 'OTHER',
        url: data.url || null,
        fileName: data.fileName || null,
        externalReference: data.externalReference || null,
        projectId: data.projectId || null,
        projectMilestoneId: data.projectMilestoneId || null,
        learningModuleId: data.learningModuleId || null,
      },
    });

    // Link skills if provided
    if (Array.isArray(data.skillIds) && data.skillIds.length > 0) {
      for (const skillId of data.skillIds) {
        await this.linkSkill(userId, evidence.id, { skillId });
      }
    } else if (Array.isArray(data.skills) && data.skills.length > 0) {
      for (const item of data.skills) {
        await this.linkSkill(userId, evidence.id, item);
      }
    }

    return this.getEvidenceById(userId, evidence.id);
  }

  /**
   * Update evidence
   */
  async updateEvidence(userId, evidenceId, data) {
    const existing = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId },
    });

    if (!existing) {
      const err = new Error('Evidence not found');
      err.statusCode = 404;
      throw err;
    }

    await this.validateEntityOwnership(userId, {
      projectId: data.projectId,
      projectMilestoneId: data.projectMilestoneId,
      learningModuleId: data.learningModuleId,
    });

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.evidenceType !== undefined) updateData.evidenceType = data.evidenceType;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.fileName !== undefined) updateData.fileName = data.fileName;
    if (data.externalReference !== undefined) updateData.externalReference = data.externalReference;
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;
    if (data.projectMilestoneId !== undefined) updateData.projectMilestoneId = data.projectMilestoneId || null;
    if (data.learningModuleId !== undefined) updateData.learningModuleId = data.learningModuleId || null;

    await prisma.evidence.update({
      where: { id: evidenceId },
      data: updateData,
    });

    return this.getEvidenceById(userId, evidenceId);
  }

  /**
   * Delete evidence
   */
  async deleteEvidence(userId, evidenceId) {
    const existing = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId },
    });

    if (!existing) {
      const err = new Error('Evidence not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.evidenceSkill.deleteMany({
      where: { evidenceId },
    });

    await prisma.evidence.delete({
      where: { id: evidenceId },
    });

    return { success: true, message: 'Evidence deleted successfully' };
  }

  /**
   * Link skill to evidence
   */
  async linkSkill(userId, evidenceId, { skillId, notes }) {
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId },
    });

    if (!evidence) {
      const err = new Error('Evidence not found');
      err.statusCode = 404;
      throw err;
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      const err = new Error('Skill not found');
      err.statusCode = 404;
      throw err;
    }

    const existing = await prisma.evidenceSkill.findUnique({
      where: {
        evidenceId_skillId: { evidenceId, skillId },
      },
    });

    if (existing) {
      return prisma.evidenceSkill.update({
        where: { id: existing.id },
        data: {
          notes: notes !== undefined ? notes : existing.notes,
        },
        include: { skill: true },
      });
    }

    return prisma.evidenceSkill.create({
      data: {
        evidenceId,
        skillId,
        userId,
        notes: notes || null,
      },
      include: { skill: true },
    });
  }

  /**
   * Unlink skill from evidence
   */
  async unlinkSkill(userId, evidenceId, skillId) {
    const evidence = await prisma.evidence.findFirst({
      where: { id: evidenceId, userId },
    });

    if (!evidence) {
      const err = new Error('Evidence not found');
      err.statusCode = 404;
      throw err;
    }

    const existing = await prisma.evidenceSkill.findUnique({
      where: {
        evidenceId_skillId: { evidenceId, skillId },
      },
    });

    if (!existing) {
      const err = new Error('Skill not linked to this evidence');
      err.statusCode = 404;
      throw err;
    }

    await prisma.evidenceSkill.delete({
      where: { id: existing.id },
    });

    return { success: true, message: 'Skill unlinked from evidence' };
  }

  /**
   * Deliberate skill assessment from evidence (Section 20 & 79)
   * Calls Phase 1E UserSkill assessment engine to update UserSkill and record in UserSkillAssessmentHistory
   */
  async assessSkillFromEvidence(userId, { skillId, newLevel, notes, evidenceText }) {
    let userSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: { userId, skillId },
      },
    });

    if (!userSkill) {
      // Create user skill if it doesn't exist yet
      userSkill = await skillGapService.createUserSkill(userId, {
        skillId,
        currentLevel: 1,
        targetLevel: 4,
      });
    }

    // Explicit assessment using Phase 1E history engine
    const updated = await skillGapService.updateUserSkill(userId, userSkill.id, {
      currentLevel: newLevel,
      assessmentType: 'PROJECT_EVIDENCE',
      evidence: evidenceText || 'Validated project/learning evidence',
      notes: notes || null,
    });

    return updated;
  }
}

module.exports = new EvidenceService();
