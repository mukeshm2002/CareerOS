const prisma = require('../config/db');

class GoalService {
  async listGoals(userId, { status } = {}) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const where = { userId };
    if (status) {
      where.status = status;
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

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        type: data.type || 'JOB_SWITCH',
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

    return goal;
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
