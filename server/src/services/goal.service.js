const prisma = require('../config/db');

/**
 * Maps 13 user-facing areas to 4 system growthAreas for backward compatibility
 */
const AREA_TO_GROWTH_AREA = {
  CAREER: 'CAREER',
  EDUCATION: 'CAREER',
  SKILLS: 'CAREER',
  LEARNING: 'CAREER',
  BUSINESS: 'CAREER',
  COMMUNICATION: 'COMMUNICATION',
  HEALTH_AND_FITNESS: 'HEALTH',
  HEALTH: 'HEALTH',
  FINANCE: 'PERSONAL',
  PERSONAL_GROWTH: 'PERSONAL',
  PERSONAL: 'PERSONAL',
  RELATIONSHIPS: 'PERSONAL',
  CREATIVE: 'PERSONAL',
  LIFESTYLE: 'PERSONAL',
  OTHER: 'PERSONAL',
};

function mapAreaToGrowthArea(area) {
  if (!area) return 'CAREER';
  const upper = String(area).trim().toUpperCase();
  return AREA_TO_GROWTH_AREA[upper] || 'PERSONAL';
}

class GoalService {
  /**
   * Authoritative Goal Progress Calculation
   * Supports: MILESTONES, TASKS, NUMBER_TARGET, ROUTINE, MANUAL
   * Guaranteed: Safe integer 0–100, never NaN, Infinity, or negative.
   */
  async calculateGoalProgress(goal, tx = prisma) {
    if (!goal) return 0;

    const method = goal.trackingMethod || 'MILESTONES';

    switch (method) {
      case 'MILESTONES': {
        // Query roadmaps with active milestones
        const roadmaps = await tx.roadmap.findMany({
          where: { goalId: goal.id },
          include: {
            milestones: {
              where: { status: { not: 'SKIPPED' } },
            },
          },
        });

        if (!roadmaps || roadmaps.length === 0) return 0;

        // Prefer ACTIVE roadmap if available, otherwise take all roadmaps
        const activeRoadmap = roadmaps.find((r) => r.status === 'ACTIVE') || roadmaps[0];
        const milestones = activeRoadmap?.milestones || [];

        if (milestones.length === 0) return 0;

        const completedCount = milestones.filter((m) => m.status === 'COMPLETED').length;
        const percent = Math.round((completedCount / milestones.length) * 100);
        return Math.min(100, Math.max(0, percent));
      }

      case 'TASKS': {
        const tasks = await tx.task.findMany({
          where: { goalId: goal.id },
          select: { status: true },
        });

        if (!tasks || tasks.length === 0) return 0;

        const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
        const percent = Math.round((completed / tasks.length) * 100);
        return Math.min(100, Math.max(0, percent));
      }

      case 'NUMBER_TARGET': {
        const start = Number(goal.startValue ?? 0);
        const current = Number(goal.currentValue ?? start);
        const target = Number(goal.targetValue);

        if (isNaN(target) || isNaN(start) || isNaN(current)) return 0;
        if (target === start) return 0; // Prevent divide by zero

        let percent = 0;
        if (target > start) {
          percent = Math.round(((current - start) / (target - start)) * 100);
        } else {
          // Decreasing target (e.g., debt reduction, weight loss)
          percent = Math.round(((start - current) / (start - target)) * 100);
        }

        if (isNaN(percent)) return 0;
        return Math.min(100, Math.max(0, percent));
      }

      case 'ROUTINE': {
        if (goal.manualProgress !== null && goal.manualProgress !== undefined) {
          const clamped = Math.round(Number(goal.manualProgress));
          return isNaN(clamped) ? 0 : Math.min(100, Math.max(0, clamped));
        }
        return 0;
      }

      case 'MANUAL': {
        const val = Number(goal.manualProgress ?? goal.progress ?? 0);
        const clamped = Math.round(val);
        return isNaN(clamped) ? 0 : Math.min(100, Math.max(0, clamped));
      }

      default: {
        const val = Number(goal.progress ?? 0);
        return isNaN(val) ? 0 : Math.min(100, Math.max(0, Math.round(val)));
      }
    }
  }

  /**
   * Recalculates and persists authoritative progress for a goal
   */
  async recalculateGoalProgress(goalId, tx = prisma) {
    const goal = await tx.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) return 0;

    const calculatedProgress = await this.calculateGoalProgress(goal, tx);

    await tx.goal.update({
      where: { id: goalId },
      data: { progress: calculatedProgress },
    });

    return calculatedProgress;
  }

  /**
   * List goals with rich filtering and summary metrics
   */
  async listGoals(userId, filters = {}) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const { status, growthArea, area, priority, trackingMethod, search } = filters;

    const where = { userId };

    // Status filtering:
    // If status is given and not 'ALL', filter by it.
    // If no status is specified, exclude 'ARCHIVED' by default for active workflows.
    if (status && status !== 'ALL') {
      if (Array.isArray(status)) {
        where.status = { in: status };
      } else {
        where.status = status;
      }
    } else if (!status) {
      where.status = { not: 'ARCHIVED' };
    }

    // Area filtering (support both area and legacy growthArea)
    if (area && area !== 'ALL') {
      where.OR = [
        { area: area },
        { growthArea: area },
      ];
    } else if (growthArea && growthArea !== 'ALL') {
      where.growthArea = growthArea;
    }

    if (priority && priority !== 'ALL') {
      where.priority = priority;
    }

    if (trackingMethod && trackingMethod !== 'ALL') {
      where.trackingMethod = trackingMethod;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { notes: { contains: query, mode: 'insensitive' } },
          ],
        },
      ];
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
            successCriteria: true,
          },
        },
        successCriteria: {
          select: {
            id: true,
            isCompleted: true,
          },
        },
        tasks: {
          where: { status: { not: 'COMPLETED' } },
          orderBy: { dueDate: 'asc' },
          take: 1,
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
          },
        },
      },
    });

    // Compute summary metrics for the user across all goals
    const metrics = await this.getGoalMetrics(userId);
    goals.metrics = metrics;

    return goals;
  }

  /**
   * Calculates high-fidelity summary metrics for user's goals
   */
  async getGoalMetrics(userId) {
    const userGoals = await prisma.goal.findMany({
      where: { userId },
      select: {
        id: true,
        status: true,
        targetDate: true,
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { confidence: true },
        },
      },
    });

    const now = new Date();
    const fourteenDaysLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    let activeCount = 0;
    let dueSoonCount = 0;
    let needsAttentionCount = 0;
    let completedCount = 0;

    for (const g of userGoals) {
      if (g.status === 'COMPLETED') {
        completedCount++;
      } else if (g.status === 'ACTIVE') {
        activeCount++;

        // Due soon: deadline within next 14 days
        if (g.targetDate) {
          const target = new Date(g.targetDate);
          if (target >= now && target <= fourteenDaysLater) {
            dueSoonCount++;
          }
        }

        // Needs attention: check-in marked AT_RISK or NEEDS_ATTENTION, or overdue
        const lastCheckIn = g.checkIns?.[0];
        const isConfidenceWarning = lastCheckIn && (lastCheckIn.confidence === 'AT_RISK' || lastCheckIn.confidence === 'NEEDS_ATTENTION');
        const isOverdue = g.targetDate && new Date(g.targetDate) < now;

        if (isConfidenceWarning || isOverdue) {
          needsAttentionCount++;
        }
      }
    }

    return {
      active: activeCount,
      dueSoon: dueSoonCount,
      needsAttention: needsAttentionCount,
      completed: completedCount,
    };
  }

  /**
   * Get Goal Command Center details
   */
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
              include: {
                tasks: {
                  select: { id: true, status: true },
                },
              },
            },
          },
        },
        tasks: {
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' },
          ],
        },
        successCriteria: {
          orderBy: { sortOrder: 'asc' },
        },
        checkIns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        projects: {
          select: { id: true, title: true, status: true, progress: true },
        },
        learningPaths: {
          select: { id: true, title: true, status: true, progress: true },
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

  /**
   * Create Goal
   */
  async createGoal(userId, data) {
    if (!prisma) {
      const error = new Error('Database client not initialized');
      error.statusCode = 500;
      throw error;
    }

    const parsedStartDate = data.startDate ? new Date(data.startDate) : new Date();
    const parsedTargetDate = data.targetDate ? new Date(data.targetDate) : null;

    const area = data.area ? String(data.area).trim().toUpperCase() : (data.growthArea || 'CAREER');
    const growthArea = mapAreaToGrowthArea(area);
    const customArea = area === 'OTHER' && data.customArea ? data.customArea.trim() : null;

    const trackingMethod = data.trackingMethod || 'MILESTONES';

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
    const defaultType = growthArea === 'CAREER' ? 'JOB_SWITCH' : 'CUSTOM';

    // Tracking numeric values
    let startValue = null;
    let currentValue = null;
    let targetValue = null;
    let unit = null;

    if (trackingMethod === 'NUMBER_TARGET') {
      startValue = data.startValue !== undefined && data.startValue !== null ? Number(data.startValue) : 0;
      currentValue = data.currentValue !== undefined && data.currentValue !== null ? Number(data.currentValue) : startValue;
      targetValue = data.targetValue !== undefined && data.targetValue !== null ? Number(data.targetValue) : null;
      unit = data.unit?.trim() || null;
    }

    // Tracking routine values
    let routineFrequency = null;
    let routinePeriod = null;
    if (trackingMethod === 'ROUTINE') {
      routineFrequency = data.routineFrequency !== undefined && data.routineFrequency !== null ? Number(data.routineFrequency) : null;
      routinePeriod = data.routinePeriod ? String(data.routinePeriod).toUpperCase() : 'WEEK';
    }

    // Manual progress
    let manualProgress = null;
    if (trackingMethod === 'MANUAL') {
      manualProgress = data.manualProgress !== undefined && data.manualProgress !== null ? Number(data.manualProgress) : 0;
    }

    // Initial progress computation
    let initialProgress = 0;
    if (trackingMethod === 'MANUAL') {
      initialProgress = Math.min(100, Math.max(0, Math.round(Number(manualProgress || 0))));
    } else if (trackingMethod === 'NUMBER_TARGET' && targetValue !== null && targetValue !== startValue) {
      if (targetValue > startValue) {
        initialProgress = Math.round(((currentValue - startValue) / (targetValue - startValue)) * 100);
      } else {
        initialProgress = Math.round(((startValue - currentValue) / (startValue - targetValue)) * 100);
      }
      initialProgress = Math.min(100, Math.max(0, initialProgress));
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        title: data.title.trim(),
        description,
        type: data.type || defaultType,
        growthArea,
        area,
        customArea,
        why: data.why?.trim() || null,
        desiredOutcome: data.desiredOutcome?.trim() || null,
        trackingMethod,
        startValue,
        currentValue,
        targetValue,
        unit,
        routineFrequency,
        routinePeriod,
        manualProgress,
        metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'ACTIVE',
        progress: initialProgress,
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
            priority: data.priority || 'MEDIUM',
            growthArea,
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

  /**
   * Update Goal Details
   */
  async updateGoal(userId, goalId, data) {
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

    const updateData = {};

    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.why !== undefined) updateData.why = data.why?.trim() || null;
    if (data.desiredOutcome !== undefined) updateData.desiredOutcome = data.desiredOutcome?.trim() || null;

    if (data.area !== undefined) {
      const area = String(data.area).trim().toUpperCase();
      updateData.area = area;
      updateData.growthArea = mapAreaToGrowthArea(area);
      if (area === 'OTHER' && data.customArea !== undefined) {
        updateData.customArea = data.customArea?.trim() || null;
      }
    } else if (data.growthArea !== undefined) {
      updateData.growthArea = data.growthArea;
    }

    if (data.trackingMethod !== undefined) updateData.trackingMethod = data.trackingMethod;
    if (data.priority !== undefined) updateData.priority = data.priority;

    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.targetDate !== undefined) {
      updateData.targetDate = data.targetDate ? new Date(data.targetDate) : null;
    }

    if (data.startValue !== undefined) updateData.startValue = data.startValue !== null ? Number(data.startValue) : null;
    if (data.currentValue !== undefined) updateData.currentValue = data.currentValue !== null ? Number(data.currentValue) : null;
    if (data.targetValue !== undefined) updateData.targetValue = data.targetValue !== null ? Number(data.targetValue) : null;
    if (data.unit !== undefined) updateData.unit = data.unit?.trim() || null;

    if (data.routineFrequency !== undefined) updateData.routineFrequency = data.routineFrequency !== null ? Number(data.routineFrequency) : null;
    if (data.routinePeriod !== undefined) updateData.routinePeriod = data.routinePeriod ? String(data.routinePeriod).toUpperCase() : null;
    if (data.manualProgress !== undefined) updateData.manualProgress = data.manualProgress !== null ? Number(data.manualProgress) : null;

    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    // Recalculate progress if tracking inputs changed
    await this.recalculateGoalProgress(goalId);

    return this.getGoalById(userId, goalId);
  }

  /**
   * Update Goal Progress (Numeric or Manual)
   */
  async updateGoalProgress(userId, goalId, progressData) {
    const existing = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!existing) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};

    if (progressData.currentValue !== undefined) {
      updateData.currentValue = Number(progressData.currentValue);
    }
    if (progressData.manualProgress !== undefined) {
      updateData.manualProgress = Number(progressData.manualProgress);
    }
    if (progressData.progress !== undefined && existing.trackingMethod === 'MANUAL') {
      updateData.manualProgress = Number(progressData.progress);
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.goal.update({
        where: { id: goalId },
        data: updateData,
      });
    }

    const calculatedProgress = await this.recalculateGoalProgress(goalId);
    return { id: goalId, progress: calculatedProgress };
  }

  /**
   * Lifecycle Status Transition
   * Supports: PLANNED, ACTIVE, PAUSED, COMPLETED, ABANDONED, ARCHIVED
   */
  async updateGoalStatus(userId, goalId, statusPayload) {
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

    // Support string status or payload object
    const status = typeof statusPayload === 'string' ? statusPayload : statusPayload.status;
    const pauseReason = statusPayload?.pauseReason || null;
    const resumeDate = statusPayload?.resumeDate ? new Date(statusPayload.resumeDate) : null;
    const abandonReason = statusPayload?.abandonReason || null;
    const reflection = statusPayload?.reflection || null;
    const learnings = statusPayload?.learnings || null;

    const updateData = { status };

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      if (reflection) updateData.reflection = reflection;
      if (learnings) updateData.learnings = learnings;
    } else if (status === 'PAUSED') {
      if (pauseReason) updateData.pauseReason = pauseReason;
      if (resumeDate) updateData.resumeDate = resumeDate;
    } else if (status === 'ABANDONED') {
      if (abandonReason) updateData.abandonReason = abandonReason;
    } else if (status === 'ACTIVE') {
      // Resumed or activated
      updateData.pauseReason = null;
      updateData.resumeDate = null;
    }

    const updated = await prisma.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Safe Goal Archival / Soft Delete
   */
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

    // Hard delete scoped cleanly to the goal and its specific dependents
    await prisma.$transaction(async (tx) => {
      // Remove success criteria and checkins
      await tx.goalSuccessCriterion.deleteMany({ where: { goalId } });
      await tx.goalCheckIn.deleteMany({ where: { goalId } });

      // Detach tasks from goal (prevent cascading tasks away)
      await tx.task.updateMany({
        where: { goalId },
        data: { goalId: null },
      });

      // Detach roadmaps from goal
      await tx.roadmap.updateMany({
        where: { goalId },
        data: { goalId: null },
      });

      // Delete the goal itself
      await tx.goal.delete({
        where: { id: goalId },
      });
    });

    return { id: goalId };
  }

  // ==========================================
  // SUCCESS CRITERIA CRUD
  // ==========================================

  async addSuccessCriterion(userId, goalId, data) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: {
        successCriteria: {
          orderBy: { sortOrder: 'desc' },
          take: 1,
        },
      },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const highestSort = goal.successCriteria[0]?.sortOrder || 0;
    const sortOrder = data.sortOrder !== undefined ? data.sortOrder : highestSort + 1;

    const criterion = await prisma.goalSuccessCriterion.create({
      data: {
        goalId,
        userId,
        title: data.title.trim(),
        isCompleted: false,
        sortOrder,
      },
    });

    return criterion;
  }

  async updateSuccessCriterion(userId, goalId, criterionId, data) {
    const criterion = await prisma.goalSuccessCriterion.findFirst({
      where: { id: criterionId, goalId, userId },
    });

    if (!criterion) {
      const error = new Error('Success criterion not found');
      error.statusCode = 404;
      throw error;
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title.trim();
    if (data.sortOrder !== undefined) updateData.sortOrder = Number(data.sortOrder);
    if (data.isCompleted !== undefined) {
      updateData.isCompleted = Boolean(data.isCompleted);
      updateData.completedAt = updateData.isCompleted ? new Date() : null;
    }

    const updated = await prisma.goalSuccessCriterion.update({
      where: { id: criterionId },
      data: updateData,
    });

    return updated;
  }

  async toggleSuccessCriterion(userId, goalId, criterionId, explicitState) {
    const criterion = await prisma.goalSuccessCriterion.findFirst({
      where: { id: criterionId, goalId, userId },
    });

    if (!criterion) {
      const error = new Error('Success criterion not found');
      error.statusCode = 404;
      throw error;
    }

    const isCompleted = explicitState !== undefined ? Boolean(explicitState) : !criterion.isCompleted;

    const updated = await prisma.goalSuccessCriterion.update({
      where: { id: criterionId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    return updated;
  }

  async deleteSuccessCriterion(userId, goalId, criterionId) {
    const criterion = await prisma.goalSuccessCriterion.findFirst({
      where: { id: criterionId, goalId, userId },
    });

    if (!criterion) {
      const error = new Error('Success criterion not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.goalSuccessCriterion.delete({
      where: { id: criterionId },
    });

    return { id: criterionId };
  }

  // ==========================================
  // GOAL CHECK-IN
  // ==========================================

  async addCheckIn(userId, goalId, data) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const checkIn = await prisma.goalCheckIn.create({
      data: {
        goalId,
        userId,
        confidence: data.confidence || 'ON_TRACK',
        whatIsGoingWell: data.whatIsGoingWell?.trim() || null,
        whatIsGettingInWay: data.whatIsGettingInWay?.trim() || null,
        adjustmentsNeeded: data.adjustmentsNeeded?.trim() || null,
      },
    });

    return checkIn;
  }

  async getCheckIns(userId, goalId) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const checkIns = await prisma.goalCheckIn.findMany({
      where: { goalId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return checkIns;
  }
}

module.exports = new GoalService();
