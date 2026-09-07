const prisma = require('../../config/db');
const roadmapTemplateService = require('./roadmapTemplate.service');

class RoadmapService {
  /**
   * Recalculates and updates roadmap progress and parent goal progress
   * Formula (Section 7): Completed Milestones / Total Active Milestones * 100
   * (SKIPPED milestones are excluded from denominator)
   */
  async recalculateRoadmapProgress(roadmapId, tx = prisma) {
    const roadmap = await tx.roadmap.findUnique({
      where: { id: roadmapId },
      include: { milestones: true },
    });

    if (!roadmap) return 0;

    const activeMilestones = roadmap.milestones.filter((m) => m.status !== 'SKIPPED');
    let calculatedProgress = 0;

    if (activeMilestones.length > 0) {
      const completedCount = activeMilestones.filter((m) => m.status === 'COMPLETED').length;
      calculatedProgress = Math.round((completedCount / activeMilestones.length) * 100);
    }

    await tx.roadmap.update({
      where: { id: roadmapId },
      data: { progress: calculatedProgress },
    });

    // Synchronize parent goal progress with active roadmap progress
    if (roadmap.status === 'ACTIVE' && roadmap.goalId) {
      await tx.goal.update({
        where: { id: roadmap.goalId },
        data: { progress: calculatedProgress },
      });
    }

    return calculatedProgress;
  }

  /**
   * Get active roadmap for a user goal
   */
  async getRoadmapByGoalId(userId, goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const roadmap = await prisma.roadmap.findFirst({
      where: {
        goalId,
        userId,
      },
      include: {
        milestones: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { userId },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                estimatedMinutes: true,
                dueDate: true,
              },
            },
          },
        },
      },
    });

    return roadmap;
  }

  /**
   * Create roadmap for a goal (from template or manual)
   * Prevents duplicate active roadmaps for the same goal
   */
  async createRoadmap(userId, goalId, data) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if an active roadmap already exists for this goal
    const existingActive = await prisma.roadmap.findFirst({
      where: {
        goalId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingActive) {
      const error = new Error('An active roadmap already exists for this goal');
      error.statusCode = 409;
      throw error;
    }

    const {
      title = `${goal.title} Roadmap`,
      description = goal.description,
      useTemplate = true,
      milestones: manualMilestones,
    } = data;

    // Use deterministic template if requested and goal is not CUSTOM
    let milestoneDefs = [];
    if (useTemplate && goal.type && goal.type !== 'CUSTOM') {
      const templateStages = roadmapTemplateService.getTemplate(goal.type);
      if (templateStages) {
        milestoneDefs = templateStages.map((s) => ({
          title: s.title,
          description: s.description,
          sequence: s.sequence,
          status: 'NOT_STARTED',
        }));
      }
    } else if (Array.isArray(manualMilestones) && manualMilestones.length > 0) {
      milestoneDefs = manualMilestones.map((m, idx) => ({
        title: m.title || `Stage ${idx + 1}`,
        description: m.description || null,
        sequence: m.sequence || idx + 1,
        status: m.status || 'NOT_STARTED',
        targetDate: m.targetDate ? new Date(m.targetDate) : null,
      }));
    }

    const created = await prisma.$transaction(async (tx) => {
      const roadmap = await tx.roadmap.create({
        data: {
          userId,
          goalId,
          title,
          description,
          status: 'ACTIVE',
          progress: 0,
        },
      });

      if (milestoneDefs.length > 0) {
        for (const m of milestoneDefs) {
          await tx.roadmapMilestone.create({
            data: {
              roadmapId: roadmap.id,
              userId,
              title: m.title,
              description: m.description,
              sequence: m.sequence,
              status: m.status,
              targetDate: m.targetDate || null,
              progress: 0,
            },
          });
        }
      }

      return roadmap;
    });

    return this.getRoadmapById(userId, created.id);
  }

  /**
   * Get roadmap by ID with milestones
   */
  async getRoadmapById(userId, roadmapId) {
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
      include: {
        milestones: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { userId },
              select: {
                id: true,
                title: true,
                status: true,
                priority: true,
                estimatedMinutes: true,
                dueDate: true,
              },
            },
          },
        },
        goal: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            priority: true,
            targetDate: true,
            progress: true,
          },
        },
      },
    });

    if (!roadmap) {
      const error = new Error('Roadmap not found');
      error.statusCode = 404;
      throw error;
    }

    return roadmap;
  }

  /**
   * Update roadmap metadata
   */
  async updateRoadmap(userId, roadmapId, data) {
    const existing = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
    });

    if (!existing) {
      const error = new Error('Roadmap not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.roadmap.update({
      where: { id: roadmapId },
      data: {
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
      },
    });

    return this.getRoadmapById(userId, updated.id);
  }

  /**
   * Update roadmap status (DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED)
   */
  async updateRoadmapStatus(userId, roadmapId, status) {
    const existing = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
    });

    if (!existing) {
      const error = new Error('Roadmap not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    // If activating, check if another active roadmap exists for the same goal
    if (status === 'ACTIVE' && existing.status !== 'ACTIVE') {
      const activeForGoal = await prisma.roadmap.findFirst({
        where: {
          goalId: existing.goalId,
          userId,
          status: 'ACTIVE',
          id: { not: roadmapId },
        },
      });

      if (activeForGoal) {
        const error = new Error('Another active roadmap already exists for this goal');
        error.statusCode = 409;
        throw error;
      }
    }

    const updated = await prisma.roadmap.update({
      where: { id: roadmapId },
      data: { status },
    });

    await this.recalculateRoadmapProgress(roadmapId);

    return this.getRoadmapById(userId, updated.id);
  }

  /**
   * Add a milestone to a roadmap
   */
  async addMilestone(userId, roadmapId, data) {
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
      include: { milestones: { orderBy: { sequence: 'desc' }, take: 1 } },
    });

    if (!roadmap) {
      const error = new Error('Roadmap not found');
      error.statusCode = 404;
      throw error;
    }

    const highestSeq = roadmap.milestones[0]?.sequence || 0;
    const nextSeq = data.sequence || highestSeq + 1;

    const milestone = await prisma.roadmapMilestone.create({
      data: {
        roadmapId,
        userId,
        title: data.title,
        description: data.description || null,
        sequence: nextSeq,
        status: data.status || 'NOT_STARTED',
        progress: 0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        dependencyMilestoneId: data.dependencyMilestoneId || null,
      },
    });

    await this.recalculateRoadmapProgress(roadmapId);
    return milestone;
  }

  /**
   * Update milestone details
   */
  async updateMilestone(userId, milestoneId, data) {
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, userId },
    });

    if (!milestone) {
      const error = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    // Dependency check: Cannot depend on itself
    if (data.dependencyMilestoneId && data.dependencyMilestoneId === milestoneId) {
      const error = new Error('A milestone cannot depend on itself');
      error.statusCode = 400;
      throw error;
    }

    const updated = await prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: {
        title: data.title !== undefined ? data.title : milestone.title,
        description: data.description !== undefined ? data.description : milestone.description,
        sequence: data.sequence !== undefined ? data.sequence : milestone.sequence,
        targetDate: data.targetDate !== undefined ? (data.targetDate ? new Date(data.targetDate) : null) : milestone.targetDate,
        dependencyMilestoneId: data.dependencyMilestoneId !== undefined ? data.dependencyMilestoneId : milestone.dependencyMilestoneId,
      },
    });

    await this.recalculateRoadmapProgress(milestone.roadmapId);
    return updated;
  }

  /**
   * Update milestone status (NOT_STARTED, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED)
   */
  async updateMilestoneStatus(userId, milestoneId, status) {
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, userId },
    });

    if (!milestone) {
      const error = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid milestone status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const updateData = { status };
    if (status === 'IN_PROGRESS' && !milestone.startedAt) {
      updateData.startedAt = new Date();
    } else if (status === 'COMPLETED') {
      if (!milestone.startedAt) updateData.startedAt = new Date();
      updateData.completedAt = new Date();
      updateData.progress = 100;
    } else if (status === 'NOT_STARTED') {
      updateData.completedAt = null;
      updateData.startedAt = null;
      updateData.progress = 0;
    }

    const updated = await prisma.roadmapMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    await this.recalculateRoadmapProgress(milestone.roadmapId);
    return updated;
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(userId, milestoneId) {
    const milestone = await prisma.roadmapMilestone.findFirst({
      where: { id: milestoneId, userId },
    });

    if (!milestone) {
      const error = new Error('Milestone not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.roadmapMilestone.delete({
      where: { id: milestoneId },
    });

    await this.recalculateRoadmapProgress(milestone.roadmapId);
    return { success: true, message: 'Milestone deleted successfully' };
  }

  /**
   * Reorder milestones in a stable sequence
   */
  async reorderMilestones(userId, roadmapId, orderedMilestoneIds) {
    const roadmap = await prisma.roadmap.findFirst({
      where: { id: roadmapId, userId },
      include: { milestones: true },
    });

    if (!roadmap) {
      const error = new Error('Roadmap not found');
      error.statusCode = 404;
      throw error;
    }

    if (!Array.isArray(orderedMilestoneIds)) {
      const error = new Error('orderedMilestoneIds must be an array of milestone IDs');
      error.statusCode = 400;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      for (let idx = 0; idx < orderedMilestoneIds.length; idx++) {
        const id = orderedMilestoneIds[idx];
        await tx.roadmapMilestone.updateMany({
          where: { id, roadmapId, userId },
          data: { sequence: idx + 1 },
        });
      }
    });

    return this.getRoadmapById(userId, roadmapId);
  }
}

module.exports = new RoadmapService();
