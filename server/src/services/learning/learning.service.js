const prisma = require('../../config/db');
const { getUserLocalDate, getUserWeekRange } = require('../../utils/timezone');

class LearningService {
  /**
   * Helper to get user's local date and week range
   */
  async getUserLocalContext(userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const tz = profile?.timezone || 'Asia/Kolkata';
    const localTodayStr = getUserLocalDate(tz);
    const weekRange = getUserWeekRange(localTodayStr);
    return {
      timezone: tz,
      localTodayStr,
      weekRange,
    };
  }

  /**
   * Validate goal ownership
   */
  async validateGoalOwnership(userId, goalId) {
    if (!goalId) return;
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      const err = new Error('Referenced goal not found or does not belong to user');
      err.statusCode = 404;
      throw err;
    }
  }

  /**
   * Factual calculation of learning path progress based on modules (Section 29)
   */
  computeLearningProgress(modules = []) {
    if (!modules || modules.length === 0) {
      return {
        progressPercent: null,
        totalModules: 0,
        completedModules: 0,
        nonSkippedModules: 0,
      };
    }

    const nonSkipped = modules.filter((m) => m.status !== 'SKIPPED');
    if (nonSkipped.length === 0) {
      return {
        progressPercent: null,
        totalModules: modules.length,
        completedModules: 0,
        nonSkippedModules: 0,
      };
    }

    const completed = nonSkipped.filter((m) => m.status === 'COMPLETED' || m.isCompleted).length;
    const progressPercent = Math.round((completed / nonSkipped.length) * 100);

    return {
      progressPercent,
      totalModules: modules.length,
      completedModules: completed,
      nonSkippedModules: nonSkipped.length,
    };
  }

  /**
   * Compute learning focused minutes for a path or user
   */
  async getPathFocusedMinutes(pathId, userId) {
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        task: {
          learningModule: {
            learningPathId: pathId,
          },
        },
      },
      select: {
        actualMinutes: true,
        durationMinutes: true,
      },
    });

    return sessions.reduce((acc, s) => acc + (s.actualMinutes || s.durationMinutes || 0), 0);
  }

  /**
   * List learning paths with factual progress and summary stats
   */
  async listLearningPaths(userId, query = {}) {
    const where = { userId };

    if (query.archived === 'true' || query.archived === true) {
      where.OR = [
        { status: 'ARCHIVED' },
        { archivedAt: { not: null } },
      ];
    } else {
      where.status = { not: 'ARCHIVED' };
      where.archivedAt = null;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.goalId) {
      where.goalId = query.goalId;
    }

    if (query.skillId) {
      where.skillId = query.skillId;
    }

    if (query.search && query.search.trim().length > 0) {
      const searchTerm = query.search.trim();
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { category: { contains: searchTerm, mode: 'insensitive' } },
        { provider: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const paths = await prisma.learningPath.findMany({
      where,
      include: {
        goal: {
          select: { id: true, title: true },
        },
        skill: {
          select: { id: true, name: true, category: true },
        },
        userSkill: {
          select: { id: true, currentLevel: true, targetLevel: true },
        },
        modules: {
          orderBy: [{ order: 'asc' }, { sequence: 'asc' }, { createdAt: 'asc' }],
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const enrichedPaths = paths.map((p) => {
      const progressMeta = this.computeLearningProgress(p.modules);
      const nextModule = p.modules.find(
        (m) => m.status !== 'COMPLETED' && m.status !== 'SKIPPED' && !m.isCompleted
      );
      return {
        ...p,
        progressPercent: progressMeta.progressPercent,
        moduleProgress: progressMeta,
        nextModule: nextModule || null,
      };
    });

    // Top summary stats
    const { weekRange } = await this.getUserLocalContext(userId);
    const startOfWeek = new Date(weekRange.weekStartStr + 'T00:00:00.000Z');
    const endOfWeek = new Date(weekRange.weekEndStr + 'T23:59:59.999Z');

    const [activePathsCount, modulesCompletedThisWeek, weekLearningSessions] = await Promise.all([
      prisma.learningPath.count({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          archivedAt: null,
        },
      }),
      prisma.learningModule.count({
        where: {
          userId,
          OR: [
            { completedAt: { gte: startOfWeek, lte: endOfWeek } },
            { isCompleted: true, updatedAt: { gte: startOfWeek, lte: endOfWeek } },
          ],
        },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: startOfWeek, lte: endOfWeek },
          task: {
            learningModuleId: { not: null },
          },
        },
        select: {
          actualMinutes: true,
          durationMinutes: true,
        },
      }),
    ]);

    const learningMinutes = weekLearningSessions.reduce(
      (acc, s) => acc + (s.actualMinutes || s.durationMinutes || 0),
      0
    );

    const activeSkills = new Set();
    enrichedPaths.forEach((p) => {
      if (p.skillId && p.status !== 'COMPLETED' && p.status !== 'ARCHIVED') {
        activeSkills.add(p.skillId);
      }
    });

    return {
      paths: enrichedPaths,
      summary: {
        activePaths: activePathsCount,
        modulesCompletedThisWeek,
        learningMinutes,
        skillsBeingDeveloped: activeSkills.size,
      },
    };
  }

  /**
   * Get single learning path by ID with full details
   */
  async getLearningPathById(userId, pathId) {
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
      include: {
        goal: {
          select: { id: true, title: true },
        },
        skill: {
          select: { id: true, name: true, category: true },
        },
        userSkill: {
          select: { id: true, currentLevel: true, targetLevel: true },
        },
        modules: {
          orderBy: [{ order: 'asc' }, { sequence: 'asc' }, { createdAt: 'asc' }],
          include: {
            evidence: {
              select: { id: true, title: true, evidenceType: true, url: true },
            },
            tasks: {
              select: { id: true, title: true, status: true, priority: true },
            },
          },
        },
      },
    });

    if (!path) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    const progressMeta = this.computeLearningProgress(path.modules);
    const focusedMinutes = await this.getPathFocusedMinutes(pathId, userId);
    const nextModule = path.modules.find(
      (m) => m.status !== 'COMPLETED' && m.status !== 'SKIPPED' && !m.isCompleted
    );

    return {
      ...path,
      progressPercent: progressMeta.progressPercent,
      moduleProgress: progressMeta,
      nextModule: nextModule || null,
      focusedMinutes,
    };
  }

  /**
   * Create new learning path
   */
  async createLearningPath(userId, data) {
    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    let userSkillId = null;
    if (data.skillId) {
      const skill = await prisma.skill.findUnique({
        where: { id: data.skillId },
      });
      if (!skill) {
        const err = new Error('Skill not found');
        err.statusCode = 404;
        throw err;
      }
      const userSkill = await prisma.userSkill.findUnique({
        where: {
          userId_skillId: { userId, skillId: data.skillId },
        },
      });
      if (userSkill) {
        userSkillId = userSkill.id;
      }
    }

    const status = data.status || 'NOT_STARTED';
    const startedAt = status === 'IN_PROGRESS' ? new Date() : null;

    const path = await prisma.learningPath.create({
      data: {
        userId,
        title: data.title,
        description: data.description || null,
        goalId: data.goalId || null,
        skillId: data.skillId || null,
        userSkillId,
        provider: data.provider || null,
        category: data.category || null,
        estimatedHours: data.estimatedHours || 10.0,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        status,
        startedAt,
      },
    });

    return this.getLearningPathById(userId, path.id);
  }

  /**
   * Update learning path
   */
  async updateLearningPath(userId, pathId, data) {
    const existing = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
    });

    if (!existing) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.goalId !== undefined) updateData.goalId = data.goalId || null;
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    if (data.skillId !== undefined) {
      updateData.skillId = data.skillId || null;
      if (data.skillId) {
        const userSkill = await prisma.userSkill.findUnique({
          where: {
            userId_skillId: { userId, skillId: data.skillId },
          },
        });
        updateData.userSkillId = userSkill ? userSkill.id : null;
      } else {
        updateData.userSkillId = null;
      }
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED' && !existing.completedAt) {
        updateData.completedAt = new Date();
      } else if (data.status !== 'COMPLETED' && existing.status === 'COMPLETED') {
        updateData.completedAt = null;
      }
      if (data.status === 'ARCHIVED' && !existing.archivedAt) {
        updateData.archivedAt = new Date();
      } else if (data.status !== 'ARCHIVED' && existing.status === 'ARCHIVED') {
        updateData.archivedAt = null;
      }
      if (data.status === 'IN_PROGRESS' && !existing.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    await prisma.learningPath.update({
      where: { id: pathId },
      data: updateData,
    });

    return this.getLearningPathById(userId, pathId);
  }

  /**
   * Update path status
   */
  async updatePathStatus(userId, pathId, status) {
    return this.updateLearningPath(userId, pathId, { status });
  }

  /**
   * Delete learning path safely: unlinks tasks and evidence
   */
  async deleteLearningPath(userId, pathId) {
    const existing = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
      include: { modules: true },
    });

    if (!existing) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    const moduleIds = existing.modules.map((m) => m.id);

    // Unlink tasks and evidence
    if (moduleIds.length > 0) {
      await prisma.task.updateMany({
        where: { learningModuleId: { in: moduleIds } },
        data: { learningModuleId: null },
      });

      await prisma.evidence.updateMany({
        where: { learningModuleId: { in: moduleIds } },
        data: { learningModuleId: null },
      });

      await prisma.learningModule.deleteMany({
        where: { learningPathId: pathId },
      });
    }

    await prisma.learningPath.delete({
      where: { id: pathId },
    });

    return { success: true, message: 'Learning path deleted safely' };
  }

  /**
   * Create module
   */
  async createModule(userId, pathId, data) {
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
    });

    if (!path) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    const status = data.status || 'NOT_STARTED';
    const isCompleted = status === 'COMPLETED';
    const completedAt = isCompleted ? new Date() : null;

    const module = await prisma.learningModule.create({
      data: {
        userId,
        learningPathId: pathId,
        title: data.title,
        description: data.description || null,
        moduleType: data.moduleType || 'READ',
        status,
        estimatedMinutes: data.estimatedMinutes || 30,
        order: data.order !== undefined ? data.order : 1,
        sequence: data.order !== undefined ? data.order : 1,
        resourceUrl: data.resourceUrl || null,
        notes: data.notes || null,
        isCompleted,
        completedAt,
      },
    });

    return module;
  }

  /**
   * Update module
   */
  async updateModule(userId, pathId, moduleId, data) {
    const module = await prisma.learningModule.findFirst({
      where: { id: moduleId, learningPathId: pathId, userId },
    });

    if (!module) {
      const err = new Error('Learning module not found');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.moduleType !== undefined) updateData.moduleType = data.moduleType;
    if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes;
    if (data.order !== undefined) {
      updateData.order = data.order;
      updateData.sequence = data.order;
    }
    if (data.resourceUrl !== undefined) updateData.resourceUrl = data.resourceUrl;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'COMPLETED' && !module.completedAt) {
        updateData.completedAt = new Date();
        updateData.isCompleted = true;
      } else if (data.status !== 'COMPLETED' && module.status === 'COMPLETED') {
        updateData.completedAt = null;
        updateData.isCompleted = false;
      }
      if (data.status === 'IN_PROGRESS' && !module.startedAt) {
        updateData.startedAt = new Date();
      }
    }

    return prisma.learningModule.update({
      where: { id: moduleId },
      data: updateData,
    });
  }

  /**
   * Update module status
   */
  async updateModuleStatus(userId, pathId, moduleId, status) {
    return this.updateModule(userId, pathId, moduleId, { status });
  }

  /**
   * Delete module safely
   */
  async deleteModule(userId, pathId, moduleId) {
    const module = await prisma.learningModule.findFirst({
      where: { id: moduleId, learningPathId: pathId, userId },
    });

    if (!module) {
      const err = new Error('Learning module not found');
      err.statusCode = 404;
      throw err;
    }

    // Unlink tasks and evidence
    await prisma.task.updateMany({
      where: { learningModuleId: moduleId },
      data: { learningModuleId: null },
    });

    await prisma.evidence.updateMany({
      where: { learningModuleId: moduleId },
      data: { learningModuleId: null },
    });

    await prisma.learningModule.delete({
      where: { id: moduleId },
    });

    return { success: true, message: 'Module deleted safely' };
  }

  /**
   * Convert learning module to actionable Task (Section 30 & 39)
   */
  async createTaskFromModule(userId, pathId, moduleId, data = {}) {
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
    });

    if (!path) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    const module = await prisma.learningModule.findFirst({
      where: { id: moduleId, learningPathId: pathId, userId },
    });

    if (!module) {
      const err = new Error('Learning module not found');
      err.statusCode = 404;
      throw err;
    }

    const taskTitle = data.title || `Study: ${module.title}`;

    // Prevent duplicate accidental creation (10 seconds window)
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingRecentTask = await prisma.task.findFirst({
      where: {
        userId,
        learningModuleId: moduleId,
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
        description: data.description || module.description || null,
        taskType: 'LEARNING',
        priority: data.priority || 'MEDIUM',
        status: 'TODO',
        estimatedMinutes: data.estimatedMinutes || module.estimatedMinutes || 30,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        learningModuleId: moduleId,
        goalId: path.goalId || null,
        skillId: path.skillId || null,
      },
    });

    return task;
  }

  /**
   * Explicit creation of project from learning path (Section 32)
   */
  async createProjectFromLearning(userId, pathId, data) {
    const path = await prisma.learningPath.findFirst({
      where: { id: pathId, userId },
    });

    if (!path) {
      const err = new Error('Learning path not found');
      err.statusCode = 404;
      throw err;
    }

    const project = await prisma.project.create({
      data: {
        userId,
        title: data.title,
        description: data.description || `Applied project for ${path.title}`,
        projectType: 'LEARNING',
        status: 'IDEA',
        priority: 'MEDIUM',
        goalId: data.goalId || path.goalId || null,
        problemStatement: `Created from learning path: ${path.title}`,
      },
    });

    if (path.skillId) {
      await prisma.projectSkill.create({
        data: {
          projectId: project.id,
          skillId: path.skillId,
          usageLevel: 'PRIMARY',
          notes: `Demonstrated from learning path: ${path.title}`,
        },
      });
    }

    return project;
  }
}

module.exports = new LearningService();
