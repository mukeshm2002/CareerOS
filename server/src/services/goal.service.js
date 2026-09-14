const prisma = require('../config/db');

class GoalService {
  async listGoals(userId, { status, growthArea } = {}) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const where = { userId };
    if (status) {
      where.status = status;
    }
    if (growthArea) {
      where.growthArea = growthArea;
    }

    const goals = await prisma.goal.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            tasks: true,
            roadmaps: true,
          },
        },
      },
    });

    return goals;
  }

  async getGoalById(userId, goalId) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId,
      },
      include: {
        roadmaps: {
          include: {
            milestones: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    return goal;
  }

  async createGoal(userId, data) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    let parsedStartDate = data.startDate ? new Date(data.startDate) : new Date();
    let parsedTargetDate = data.targetDate ? new Date(data.targetDate) : null;

    const mergedMetadata = {
      ...(data.metadata || {}),
      ...(data.why ? { why: data.why } : {}),
      ...(data.weeklyCommitment !== undefined && data.weeklyCommitment !== null
        ? { weeklyCommitment: Number(data.weeklyCommitment) || data.weeklyCommitment }
        : {}),
      ...(data.firstMilestone ? { firstMilestone: data.firstMilestone } : {}),
      ...(data.firstAction ? { firstAction: data.firstAction } : {}),
    };

    const description = data.description || data.why || null;
    const defaultType = data.growthArea === 'CAREER' || !data.growthArea ? 'JOB_SWITCH' : 'CUSTOM';

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description,
        type: data.type || defaultType,
        growthArea: data.growthArea || 'CAREER',
        metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : null,
        priority: data.priority || 'HIGH',
        status: 'ACTIVE',
        progress: 0,
        startDate: parsedStartDate,
        targetDate: parsedTargetDate,
        targetRole: data.targetRole || null,
        targetSalary: data.targetSalary || null,
        salaryCurrency: data.salaryCurrency || 'USD',
        notes: data.notes || null,
      },
    });

    let createdMilestone = null;
    if (data.firstMilestone && data.firstMilestone.trim()) {
      try {
        const roadmap = await prisma.roadmap.create({
          data: {
            userId,
            goalId: goal.id,
            title: `${goal.title} Roadmap`,
            status: 'ACTIVE',
            progress: 0,
            milestones: {
              create: {
                userId,
                title: data.firstMilestone.trim(),
                sequence: 1,
                status: 'NOT_STARTED',
                targetDate: parsedTargetDate,
              },
            },
          },
          include: { milestones: true },
        });
        createdMilestone = roadmap.milestones?.[0] || null;
      } catch (err) {
        console.warn('Failed to create roadmap milestone for goal:', err.message);
      }
    }

    let createdTask = null;
    if (data.firstAction && data.firstAction.trim()) {
      try {
        createdTask = await prisma.task.create({
          data: {
            userId,
            goalId: goal.id,
            milestoneId: createdMilestone ? createdMilestone.id : null,
            title: data.firstAction.trim(),
            status: 'TODO',
            priority: data.priority || 'HIGH',
            growthArea: data.growthArea || 'CAREER',
            dueDate: parsedTargetDate,
          },
        });
      } catch (err) {
        console.warn('Failed to create initial task for goal:', err.message);
      }
    }

    if (data.reminder && data.reminder.time) {
      try {
        const validChannel = ['IN_APP', 'EMAIL', 'PUSH'].includes(String(data.reminder.channel).toUpperCase())
          ? String(data.reminder.channel).toUpperCase()
          : 'IN_APP';
        const recurrence = data.reminder.frequency ? String(data.reminder.frequency).toUpperCase() : 'DAILY';

        await prisma.reminder.create({
          data: {
            userId,
            title: `Goal check-in: ${goal.title}`,
            type: 'DAILY_CAREEROS_REVIEW',
            time: data.reminder.time,
            recurrence,
            channel: validChannel,
            notificationChannel: validChannel,
            linkedGoalId: goal.id,
            enabled: true,
          },
        });
      } catch (err) {
        console.warn('Failed to create reminder for goal:', err.message);
      }
    }

    return {
      ...goal,
      firstTask: createdTask ? { id: createdTask.id, title: createdTask.title } : null,
    };
  }

  async updateGoal(userId, goalId, data) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    // Verify ownership first
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = { ...data };
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.targetDate) updateData.targetDate = new Date(data.targetDate);

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return updated;
  }

  async updateGoalStatus(userId, goalId, status) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: { status },
    });

    return updated;
  }

  async deleteGoal(userId, goalId) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.goal.delete({
      where: { id: goalId },
    });

    return { id: goalId };
  }
}

module.exports = new GoalService();
