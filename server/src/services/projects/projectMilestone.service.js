const prisma = require('../../config/db');

class ProjectMilestoneService {
  /**
   * Ensure project belongs to user
   */
  async ensureProjectOwnership(userId, projectId) {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }
    return project;
  }

  /**
   * List milestones for a project
   */
  async listMilestones(userId, projectId) {
    await this.ensureProjectOwnership(userId, projectId);

    return prisma.projectMilestone.findMany({
      where: { projectId, userId },
      include: {
        tasks: {
          select: { id: true, title: true, status: true, priority: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Create milestone
   */
  async createMilestone(userId, projectId, data) {
    await this.ensureProjectOwnership(userId, projectId);

    const status = data.status || 'TODO';
    const completedAt = status === 'COMPLETED' ? new Date() : null;

    const milestone = await prisma.projectMilestone.create({
      data: {
        userId,
        projectId,
        title: data.title,
        description: data.description || null,
        status,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        completedAt,
        order: data.order !== undefined ? data.order : 1,
      },
    });

    return milestone;
  }

  /**
   * Update milestone
   */
  async updateMilestone(userId, projectId, milestoneId, data) {
    await this.ensureProjectOwnership(userId, projectId);

    const existing = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, userId },
    });

    if (!existing) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && existing.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    return prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
  }

  /**
   * Update milestone status
   */
  async updateMilestoneStatus(userId, projectId, milestoneId, status) {
    return this.updateMilestone(userId, projectId, milestoneId, { status });
  }

  /**
   * Delete milestone safely
   */
  async deleteMilestone(userId, projectId, milestoneId) {
    await this.ensureProjectOwnership(userId, projectId);

    const existing = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, userId },
    });

    if (!existing) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      throw err;
    }

    // Safely unlink tasks and evidence
    await prisma.task.updateMany({
      where: { projectMilestoneId: milestoneId },
      data: { projectMilestoneId: null },
    });

    await prisma.evidence.updateMany({
      where: { projectMilestoneId: milestoneId },
      data: { projectMilestoneId: null },
    });

    await prisma.projectMilestone.delete({
      where: { id: milestoneId },
    });

    return { success: true, message: 'Milestone deleted safely' };
  }

  /**
   * Create task from milestone (with idempotency to prevent duplicate double-click tasks)
   */
  async createTaskFromMilestone(userId, projectId, milestoneId, data = {}) {
    const project = await this.ensureProjectOwnership(userId, projectId);

    const milestone = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, userId },
    });

    if (!milestone) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      throw err;
    }

    const taskTitle = data.title || milestone.title;

    // Prevent duplicate task creation if an identical task was created in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingRecentTask = await prisma.task.findFirst({
      where: {
        userId,
        projectId,
        projectMilestoneId: milestoneId,
        title: taskTitle,
        createdAt: { gte: tenSecondsAgo },
      },
    });

    if (existingRecentTask) {
      return existingRecentTask;
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title: taskTitle,
        description: data.description || milestone.description || null,
        taskType: 'PROJECT_WORK',
        priority: data.priority || 'MEDIUM',
        status: 'TODO',
        estimatedMinutes: data.estimatedMinutes || 30,
        dueDate: data.dueDate ? new Date(data.dueDate) : milestone.targetDate,
        projectId,
        projectMilestoneId: milestoneId,
        goalId: project.goalId || null,
      },
    });

    return task;
  }
}

module.exports = new ProjectMilestoneService();
