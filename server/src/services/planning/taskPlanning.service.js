const prisma = require('../../config/db');

class TaskPlanningService {
  /**
   * Validate cross-resource linkages (Section 19)
   */
  async validateTaskRelations(userId, {
    goalId,
    milestoneId,
    skillId,
    projectId,
    projectMilestoneId,
    learningModuleId,
    jobOpportunityId,
    freelanceOpportunityId,
    internshipOpportunityId,
  } = {}) {
    let resolvedGoalId = goalId || null;
    let resolvedProjectId = projectId || null;

    // 1. If goalId is provided, verify it belongs to the authenticated user
    if (resolvedGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: resolvedGoalId, userId },
      });
      if (!goal) {
        const error = new Error('Referenced goal not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
    }

    // 2. If milestoneId is provided, verify it belongs to user's roadmap
    if (milestoneId) {
      const milestone = await prisma.roadmapMilestone.findFirst({
        where: { id: milestoneId, userId },
        include: { roadmap: true },
      });

      if (!milestone) {
        const error = new Error('Referenced milestone not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }

      // If goalId is also provided, enforce that milestone belongs to THAT goal's roadmap!
      if (resolvedGoalId && milestone.roadmap.goalId !== resolvedGoalId) {
        const error = new Error('Cross-resource mismatch: Milestone does not belong to the specified goal');
        error.statusCode = 400;
        throw error;
      }

      // If goalId was not explicitly provided, infer it from milestone's roadmap
      if (!resolvedGoalId && milestone.roadmap.goalId) {
        resolvedGoalId = milestone.roadmap.goalId;
      }
    }

    // 3. If skillId is provided, verify it exists globally or in user skills
    if (skillId) {
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
      });
      if (!skill) {
        const error = new Error('Referenced skill not found');
        error.statusCode = 404;
        throw error;
      }
    }

    // 4. If projectId is provided, verify it belongs to user
    if (resolvedProjectId) {
      const project = await prisma.project.findFirst({
        where: { id: resolvedProjectId, userId },
      });
      if (!project) {
        const error = new Error('Referenced project not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
    }

    // 4b. If projectMilestoneId is provided, verify it belongs to user and matches projectId
    if (projectMilestoneId) {
      const pm = await prisma.projectMilestone.findFirst({
        where: { id: projectMilestoneId, userId },
      });
      if (!pm) {
        const error = new Error('Referenced project milestone not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (resolvedProjectId && pm.projectId !== resolvedProjectId) {
        const error = new Error('Cross-resource mismatch: Milestone does not belong to the specified project');
        error.statusCode = 400;
        throw error;
      }
      if (!resolvedProjectId) {
        resolvedProjectId = pm.projectId;
      }
    }

    // 4c. If learningModuleId is provided, verify it belongs to user
    if (learningModuleId) {
      const lm = await prisma.learningModule.findFirst({
        where: { id: learningModuleId, userId },
        include: { learningPath: true },
      });
      if (!lm) {
        const error = new Error('Referenced learning module not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (!resolvedGoalId && lm.learningPath.goalId) {
        resolvedGoalId = lm.learningPath.goalId;
      }
    }

    // 5. Opportunity relations and mutual exclusivity (Section 34)
    const oppCount = [jobOpportunityId, freelanceOpportunityId, internshipOpportunityId].filter(Boolean).length;
    if (oppCount > 1) {
      const error = new Error('A task cannot link to multiple opportunity types simultaneously');
      error.statusCode = 400;
      throw error;
    }

    if (jobOpportunityId) {
      const job = await prisma.jobOpportunity.findFirst({
        where: { id: jobOpportunityId, userId },
      });
      if (!job) {
        const error = new Error('Referenced job opportunity not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (!resolvedGoalId && job.goalId) {
        resolvedGoalId = job.goalId;
      }
    }

    if (freelanceOpportunityId) {
      const freelance = await prisma.freelanceOpportunity.findFirst({
        where: { id: freelanceOpportunityId, userId },
      });
      if (!freelance) {
        const error = new Error('Referenced freelance opportunity not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (!resolvedGoalId && freelance.goalId) {
        resolvedGoalId = freelance.goalId;
      }
    }

    if (internshipOpportunityId) {
      const internship = await prisma.internshipOpportunity.findFirst({
        where: { id: internshipOpportunityId, userId },
      });
      if (!internship) {
        const error = new Error('Referenced internship opportunity not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (!resolvedGoalId && internship.goalId) {
        resolvedGoalId = internship.goalId;
      }
    }

    return { resolvedGoalId, resolvedProjectId };
  }

  /**
   * Recalculate milestone progress from tasks if milestone exists
   */
  async updateMilestoneTaskProgress(milestoneId, tx = prisma) {
    if (!milestoneId) return;

    const tasks = await tx.task.findMany({
      where: { milestoneId },
      select: { status: true },
    });

    if (tasks.length === 0) return;

    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = Math.round((completed / tasks.length) * 100);

    await tx.roadmapMilestone.update({
      where: { id: milestoneId },
      data: { progress },
    });
  }

  /**
   * List tasks with filters (status, goalId, milestoneId, skillId, due)
   */
  async getTasks(userId, filters = {}) {
    const where = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.goalId) {
      where.goalId = filters.goalId;
    }

    if (filters.milestoneId) {
      where.milestoneId = filters.milestoneId;
    }

    if (filters.skillId) {
      where.skillId = filters.skillId;
    }

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.projectMilestoneId) {
      where.projectMilestoneId = filters.projectMilestoneId;
    }

    if (filters.learningModuleId) {
      where.learningModuleId = filters.learningModuleId;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.due) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      if (filters.due === 'today') {
        where.dueDate = {
          gte: startOfToday,
          lte: endOfToday,
        };
      } else if (filters.due === 'overdue') {
        where.dueDate = {
          lt: startOfToday,
        };
        where.status = { not: 'COMPLETED' };
      } else if (filters.due === 'upcoming') {
        where.dueDate = {
          gt: endOfToday,
        };
      }
    }

    return prisma.task.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        goal: { select: { id: true, title: true, type: true } },
        milestone: { select: { id: true, title: true, sequence: true, status: true } },
        skill: { select: { id: true, name: true, category: true } },
        project: { select: { id: true, title: true } },
        projectMilestone: { select: { id: true, title: true } },
        learningModule: { select: { id: true, title: true } },
      },
    });
  }

  /**
   * Get single task by ID
   */
  async getTaskById(userId, taskId) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: {
        goal: { select: { id: true, title: true, type: true } },
        milestone: { select: { id: true, title: true, sequence: true, status: true } },
        skill: { select: { id: true, name: true, category: true } },
        scheduleBlocks: {
          select: { id: true, date: true, startTime: true, endTime: true, category: true },
        },
      },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    return task;
  }

  /**
   * Create task with cross-resource validation
   */
  async createTask(userId, data) {
    const {
      title,
      description = null,
      priority = 'MEDIUM',
      status = 'TODO',
      taskType = 'LEARNING',
      dueDate = null,
      estimatedMinutes = 30,
      actualMinutes = 0,
      goalId = null,
      milestoneId = null,
      skillId = null,
      projectId = null,
      projectMilestoneId = null,
      learningModuleId = null,
      jobOpportunityId = null,
      freelanceOpportunityId = null,
      internshipOpportunityId = null,
    } = data;

    if (!title || !title.trim()) {
      const error = new Error('Task title is required');
      error.statusCode = 400;
      throw error;
    }

    if (estimatedMinutes !== undefined && estimatedMinutes !== null) {
      const est = parseInt(estimatedMinutes, 10);
      if (isNaN(est) || est <= 0) {
        const error = new Error('estimatedMinutes must be greater than 0');
        error.statusCode = 400;
        throw error;
      }
    }

    if (actualMinutes !== undefined && actualMinutes !== null) {
      const act = parseInt(actualMinutes, 10);
      if (isNaN(act) || act < 0) {
        const error = new Error('actualMinutes must be greater than or equal to 0');
        error.statusCode = 400;
        throw error;
      }
    }

    let parsedDueDate = null;
    if (dueDate) {
      const d = new Date(dueDate);
      if (isNaN(d.getTime())) {
        const error = new Error('Invalid dueDate format');
        error.statusCode = 400;
        throw error;
      }
      parsedDueDate = d;
    }

    // Validate relationships and cross-mismatch prevention
    const { resolvedGoalId, resolvedProjectId } = await this.validateTaskRelations(userId, {
      goalId,
      milestoneId,
      skillId,
      projectId,
      projectMilestoneId,
      learningModuleId,
      jobOpportunityId,
      freelanceOpportunityId,
      internshipOpportunityId,
    });

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          userId,
          title: title.trim(),
          description,
          priority,
          status,
          taskType,
          dueDate: parsedDueDate,
          estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : 30,
          actualMinutes: actualMinutes ? parseInt(actualMinutes, 10) : 0,
          goalId: resolvedGoalId,
          milestoneId: milestoneId || null,
          skillId: skillId || null,
          projectId: resolvedProjectId,
          projectMilestoneId: projectMilestoneId || null,
          learningModuleId: learningModuleId || null,
          jobOpportunityId: jobOpportunityId || null,
          freelanceOpportunityId: freelanceOpportunityId || null,
          internshipOpportunityId: internshipOpportunityId || null,
          completedAt: status === 'COMPLETED' ? new Date() : null,
        },
        include: {
          goal: { select: { id: true, title: true } },
          milestone: { select: { id: true, title: true } },
          skill: { select: { id: true, name: true } },
          jobOpportunity: { select: { id: true, company: true, role: true } },
          freelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
          internshipOpportunity: { select: { id: true, company: true, role: true } },
        },
      });

      if (milestoneId) {
        await this.updateMilestoneTaskProgress(milestoneId, tx);
      }

      return created;
    });

    return task;
  }

  /**
   * Update task
   */
  async updateTask(userId, taskId, data) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    if (data.title !== undefined && (!data.title || !data.title.trim())) {
      const error = new Error('Task title cannot be empty');
      error.statusCode = 400;
      throw error;
    }

    if (data.estimatedMinutes !== undefined && data.estimatedMinutes !== null) {
      const est = parseInt(data.estimatedMinutes, 10);
      if (isNaN(est) || est <= 0) {
        const error = new Error('estimatedMinutes must be greater than 0');
        error.statusCode = 400;
        throw error;
      }
    }

    if (data.actualMinutes !== undefined && data.actualMinutes !== null) {
      const act = parseInt(data.actualMinutes, 10);
      if (isNaN(act) || act < 0) {
        const error = new Error('actualMinutes must be greater than or equal to 0');
        error.statusCode = 400;
        throw error;
      }
    }

    let parsedDueDate = existing.dueDate;
    if (data.dueDate !== undefined) {
      if (data.dueDate === null) {
        parsedDueDate = null;
      } else {
        const d = new Date(data.dueDate);
        if (isNaN(d.getTime())) {
          const error = new Error('Invalid dueDate format');
          error.statusCode = 400;
          throw error;
        }
        parsedDueDate = d;
      }
    }

    const checkGoalId = data.goalId !== undefined ? data.goalId : existing.goalId;
    const checkMilestoneId = data.milestoneId !== undefined ? data.milestoneId : existing.milestoneId;
    const checkSkillId = data.skillId !== undefined ? data.skillId : existing.skillId;
    const checkProjectId = data.projectId !== undefined ? data.projectId : existing.projectId;
    const checkProjectMilestoneId = data.projectMilestoneId !== undefined ? data.projectMilestoneId : existing.projectMilestoneId;
    const checkLearningModuleId = data.learningModuleId !== undefined ? data.learningModuleId : existing.learningModuleId;

    const { resolvedGoalId, resolvedProjectId } = await this.validateTaskRelations(userId, {
      goalId: checkGoalId,
      milestoneId: checkMilestoneId,
      skillId: checkSkillId,
      projectId: checkProjectId,
      projectMilestoneId: checkProjectMilestoneId,
      learningModuleId: checkLearningModuleId,
    });

    let completedAt = existing.completedAt;
    if (data.status) {
      if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        completedAt = new Date();
      } else if (data.status !== 'COMPLETED') {
        completedAt = null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.task.update({
        where: { id: taskId },
        data: {
          title: data.title !== undefined ? data.title.trim() : existing.title,
          description: data.description !== undefined ? data.description : existing.description,
          priority: data.priority !== undefined ? data.priority : existing.priority,
          status: data.status !== undefined ? data.status : existing.status,
          taskType: data.taskType !== undefined ? data.taskType : existing.taskType,
          dueDate: parsedDueDate,
          estimatedMinutes: data.estimatedMinutes !== undefined ? parseInt(data.estimatedMinutes, 10) : existing.estimatedMinutes,
          actualMinutes: data.actualMinutes !== undefined ? parseInt(data.actualMinutes, 10) : existing.actualMinutes,
          goalId: resolvedGoalId,
          milestoneId: checkMilestoneId,
          skillId: checkSkillId,
          projectId: resolvedProjectId,
          projectMilestoneId: checkProjectMilestoneId,
          learningModuleId: checkLearningModuleId,
          completedAt,
        },
        include: {
          goal: { select: { id: true, title: true } },
          milestone: { select: { id: true, title: true } },
          skill: { select: { id: true, name: true } },
        },
      });

      if (checkMilestoneId) {
        await this.updateMilestoneTaskProgress(checkMilestoneId, tx);
      }
      if (existing.milestoneId && existing.milestoneId !== checkMilestoneId) {
        await this.updateMilestoneTaskProgress(existing.milestoneId, tx);
      }

      return result;
    });

    return updated;
  }

  /**
   * Update task status (TODO, IN_PROGRESS, COMPLETED, BLOCKED, SKIPPED)
   */
  async updateTaskStatus(userId, taskId, status) {
    const validStatuses = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED'];
    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    return this.updateTask(userId, taskId, { status });
  }

  /**
   * Delete task
   */
  async deleteTask(userId, taskId) {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!existing) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.$transaction(async (tx) => {
      await tx.task.delete({
        where: { id: taskId },
      });

      if (existing.milestoneId) {
        await this.updateMilestoneTaskProgress(existing.milestoneId, tx);
      }
    });

    return { success: true, message: 'Task deleted successfully' };
  }
}

module.exports = new TaskPlanningService();
