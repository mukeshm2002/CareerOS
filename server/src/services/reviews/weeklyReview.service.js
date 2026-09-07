const prisma = require('../../config/db');
const weeklyMetricsService = require('../progress/weeklyMetrics.service');
const adaptationService = require('./adaptation.service');
const opportunityMetricsService = require('../opportunities/opportunityMetrics.service');

class WeeklyReviewService {
  /**
   * Resolve user IANA timezone
   */
  async getUserTimezone(userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    return profile?.timezone || 'Asia/Kolkata';
  }

  /**
   * Resolve Monday-to-Sunday dates for the current week in user timezone
   */
  resolveCurrentWeekDates(timezone = 'UTC') {
    const now = new Date();
    const localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [year, month, day] = localDateStr.split('-').map(Number);
    const localToday = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = localToday.getUTCDay(); // 0 = Sun, 1 = Mon
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(localToday);
    monday.setUTCDate(localToday.getUTCDate() + diffToMonday);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    const weekStartDate = monday.toISOString().slice(0, 10);
    const weekEndDate = sunday.toISOString().slice(0, 10);

    const utcStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const utcEnd = new Date(`${weekEndDate}T23:59:59.999Z`);

    return { weekStartDate, weekEndDate, utcStart, utcEnd };
  }

  /**
   * Validate that foreign foreign goals/tasks are rejected (Section 37 & 64)
   */
  async validateRelatedEntities(userId, { nextWeekMainGoalId, nextWeekMainTaskId }) {
    if (nextWeekMainGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: nextWeekMainGoalId, userId },
      });
      if (!goal) {
        const err = new Error('Next week goal not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (nextWeekMainTaskId) {
      const task = await prisma.task.findFirst({
        where: { id: nextWeekMainTaskId, userId },
      });
      if (!task) {
        const err = new Error('Next week main task not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }
  }

  /**
   * Get current week's review workspace data (GET /api/reviews/weekly/current)
   */
  async getCurrentWeeklyReview(userId) {
    const timezone = await this.getUserTimezone(userId);
    const { weekStartDate, weekEndDate, utcStart, utcEnd } = this.resolveCurrentWeekDates(timezone);

    // Compute live factual metrics for this week
    const liveMetrics = await weeklyMetricsService.calculateMetrics(
      userId,
      utcStart,
      utcEnd,
      timezone
    );

    // Compute deterministic adaptation suggestions
    const adaptationSuggestions = adaptationService.generateAdaptations(liveMetrics);

    // Find or create initial review for this user and week
    let existing = await prisma.weeklyReview.findFirst({
      where: {
        userId,
        weekStartDate: new Date(weekStartDate),
      },
    });

    if (!existing) {
      existing = await prisma.weeklyReview.create({
        data: {
          userId,
          weekStartDate: new Date(weekStartDate),
          weekEndDate: new Date(weekEndDate),
          status: 'DRAFT',
        },
      });
    }

    // Compute optional opportunity activity for the week (Section 40)
    const oppMetrics = await opportunityMetricsService.getOpportunityMetricsForPeriod(userId, utcStart, utcEnd);
    const hasOppData = Object.values(oppMetrics).some((v) => v > 0);

    // Phase 1G Projects, Learning & Evidence factual metrics (Section 61)
    const [
      projectsCompleted,
      projectMilestonesCompleted,
      learningModulesCompleted,
      learningSessions,
      evidenceAdded,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.projectMilestone.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.learningModule.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: utcStart, lte: utcEnd },
          task: {
            learningModuleId: { not: null },
          },
        },
        select: { actualMinutes: true, durationMinutes: true },
      }),
      prisma.evidence.count({
        where: {
          userId,
          createdAt: { gte: utcStart, lte: utcEnd },
        },
      }),
    ]);

    const learningFocusedMinutes = learningSessions.reduce(
      (sum, s) => sum + (s.actualMinutes || s.durationMinutes || 0),
      0
    );

    return {
      weekStartDate,
      weekEndDate,
      timezone,
      review: existing,
      currentFacts: {
        focusSessionsCompleted: liveMetrics.focusSessionsCompleted,
        totalFocusMinutes: liveMetrics.totalFocusMinutes,
        tasksCompleted: liveMetrics.tasksCompleted,
        activeDays: liveMetrics.activeDays,
        mainFocusCompleted: liveMetrics.mainFocusCompleted,
        dailyPlansConfirmed: liveMetrics.dailyPlansConfirmed,
        mainFocusFollowThrough: liveMetrics.mainFocusFollowThrough,
        milestonesCompleted: liveMetrics.milestonesCompleted,
        blockedTasksCount: liveMetrics.blockedTasksCount,
        plannedFocusMinutes: liveMetrics.plannedFocusMinutes,
        projects: {
          milestonesCompleted: projectMilestonesCompleted,
          projectsCompleted,
        },
        learning: {
          modulesCompleted: learningModulesCompleted,
          focusedMinutes: learningFocusedMinutes,
        },
        evidence: {
          added: evidenceAdded,
        },
        ...(hasOppData ? { opportunityActivity: oppMetrics } : {}),
      },
      adaptations: adaptationSuggestions,
      adaptationSuggestions,
    };
  }

  /**
   * Get specific review by ID or week start date (GET /api/reviews/weekly/:id)
   */
  async getWeeklyReviewByIdOrDate(userId, identifier) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let review;
    if (isUuid) {
      review = await prisma.weeklyReview.findFirst({
        where: {
          id: identifier,
          userId,
        },
      });
    } else {
      const dateObj = new Date(identifier);
      review = await prisma.weeklyReview.findFirst({
        where: {
          userId,
          weekStartDate: dateObj,
        },
      });
    }

    if (!review) {
      const err = new Error('Weekly review not found');
      err.statusCode = 404;
      throw err;
    }

    return review;
  }

  async getWeeklyReviewByDate(userId, weekStartDateStr) {
    return this.getWeeklyReviewByIdOrDate(userId, weekStartDateStr);
  }

  /**
   * Save or update weekly review draft (POST /api/reviews/weekly/draft)
   */
  async saveWeeklyReviewDraft(userId, data) {
    const timezone = await this.getUserTimezone(userId);
    const reviewId = data.reviewId || data.id;

    await this.validateRelatedEntities(userId, data);

    if (reviewId) {
      const existing = await prisma.weeklyReview.findFirst({
        where: { id: reviewId, userId },
      });
      if (!existing) {
        const err = new Error('Weekly review not found');
        err.statusCode = 404;
        throw err;
      }

      return await prisma.weeklyReview.update({
        where: { id: reviewId },
        data: {
          wins: data.wins !== undefined ? data.wins : undefined,
          challenges: data.challenges !== undefined ? data.challenges : undefined,
          learnings: data.learnings !== undefined ? data.learnings : undefined,
          continueDoing: data.continueDoing !== undefined ? data.continueDoing : undefined,
          stopDoing: data.stopDoing !== undefined ? data.stopDoing : undefined,
          startDoing: data.startDoing !== undefined ? data.startDoing : undefined,
          nextWeekMainGoalId: data.nextWeekMainGoalId !== undefined ? data.nextWeekMainGoalId : undefined,
          nextWeekMainTaskId: data.nextWeekMainTaskId !== undefined ? data.nextWeekMainTaskId : undefined,
          plannedCareerMinutes: data.plannedCareerMinutes !== undefined ? data.plannedCareerMinutes : undefined,
          notes: data.notes !== undefined ? data.notes : undefined,
          whatWentWell: data.wins !== undefined ? data.wins : undefined,
          whatBlocked: data.challenges !== undefined ? data.challenges : undefined,
          changesNextWeek: data.continueDoing !== undefined ? data.continueDoing : undefined,
        },
      });
    }

    let { weekStartDate, weekEndDate } = data;
    if (!weekStartDate || !weekEndDate) {
      const dates = this.resolveCurrentWeekDates(timezone);
      weekStartDate = dates.weekStartDate;
      weekEndDate = dates.weekEndDate;
    }

    const startObj = new Date(weekStartDate);
    const endObj = new Date(weekEndDate);

    const review = await prisma.weeklyReview.upsert({
      where: {
        userId_weekStartDate: {
          userId,
          weekStartDate: startObj,
        },
      },
      update: {
        weekEndDate: endObj,
        wins: data.wins !== undefined ? data.wins : undefined,
        challenges: data.challenges !== undefined ? data.challenges : undefined,
        learnings: data.learnings !== undefined ? data.learnings : undefined,
        continueDoing: data.continueDoing !== undefined ? data.continueDoing : undefined,
        stopDoing: data.stopDoing !== undefined ? data.stopDoing : undefined,
        startDoing: data.startDoing !== undefined ? data.startDoing : undefined,
        nextWeekMainGoalId: data.nextWeekMainGoalId !== undefined ? data.nextWeekMainGoalId : undefined,
        nextWeekMainTaskId: data.nextWeekMainTaskId !== undefined ? data.nextWeekMainTaskId : undefined,
        plannedCareerMinutes: data.plannedCareerMinutes !== undefined ? data.plannedCareerMinutes : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        whatWentWell: data.wins !== undefined ? data.wins : undefined,
        whatBlocked: data.challenges !== undefined ? data.challenges : undefined,
        changesNextWeek: data.continueDoing !== undefined ? data.continueDoing : undefined,
      },
      create: {
        userId,
        weekStartDate: startObj,
        weekEndDate: endObj,
        status: 'DRAFT',
        wins: data.wins || null,
        challenges: data.challenges || null,
        learnings: data.learnings || null,
        continueDoing: data.continueDoing || null,
        stopDoing: data.stopDoing || null,
        startDoing: data.startDoing || null,
        nextWeekMainGoalId: data.nextWeekMainGoalId || null,
        nextWeekMainTaskId: data.nextWeekMainTaskId || null,
        plannedCareerMinutes: data.plannedCareerMinutes || null,
        notes: data.notes || null,
        whatWentWell: data.wins || null,
        whatBlocked: data.challenges || null,
        changesNextWeek: data.continueDoing || null,
      },
    });

    return review;
  }

  /**
   * Complete weekly review and persist factual metrics snapshot (POST /api/reviews/weekly/:id/complete)
   */
  async completeWeeklyReview(userId, reviewId, data = {}) {
    const review = await prisma.weeklyReview.findFirst({
      where: { id: reviewId, userId },
    });

    if (!review) {
      const err = new Error('Weekly review not found');
      err.statusCode = 404;
      throw err;
    }

    await this.validateRelatedEntities(userId, data);

    const timezone = await this.getUserTimezone(userId);
    const startStr = review.weekStartDate.toISOString().slice(0, 10);
    const endStr = review.weekEndDate.toISOString().slice(0, 10);
    const utcStart = new Date(`${startStr}T00:00:00.000Z`);
    const utcEnd = new Date(`${endStr}T23:59:59.999Z`);

    // Compute factual snapshot from source records
    const liveMetrics = await weeklyMetricsService.calculateMetrics(
      userId,
      utcStart,
      utcEnd,
      timezone
    );

    // Optional opportunity metrics for the week (Section 40)
    const oppMetrics = await opportunityMetricsService.getOpportunityMetricsForPeriod(userId, utcStart, utcEnd);
    const hasOppData = Object.values(oppMetrics).some((v) => v > 0);

    // Phase 1G Projects, Learning & Evidence factual metrics (Section 61)
    const [
      projectsCompleted,
      projectMilestonesCompleted,
      learningModulesCompleted,
      learningSessions,
      evidenceAdded,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.projectMilestone.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.learningModule.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: utcStart, lte: utcEnd },
        },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: utcStart, lte: utcEnd },
          task: {
            learningModuleId: { not: null },
          },
        },
        select: { actualMinutes: true, durationMinutes: true },
      }),
      prisma.evidence.count({
        where: {
          userId,
          createdAt: { gte: utcStart, lte: utcEnd },
        },
      }),
    ]);

    const learningFocusedMinutes = learningSessions.reduce(
      (sum, s) => sum + (s.actualMinutes || s.durationMinutes || 0),
      0
    );

    const metricsSnapshot = {
      focusMinutes: liveMetrics.totalFocusMinutes,
      focusSessionsCompleted: liveMetrics.focusSessionsCompleted,
      tasksCompleted: liveMetrics.tasksCompleted,
      activeDays: liveMetrics.activeDays,
      mainFocusCompleted: liveMetrics.mainFocusCompleted,
      mainFocusConfirmed: liveMetrics.dailyPlansConfirmed,
      milestonesCompleted: liveMetrics.milestonesCompleted,
      plannedMinutes: liveMetrics.plannedFocusMinutes,
      differenceMinutes: liveMetrics.differenceMinutes,
      completedAt: new Date().toISOString(),
      projects: {
        milestonesCompleted: projectMilestonesCompleted,
        projectsCompleted,
      },
      learning: {
        modulesCompleted: learningModulesCompleted,
        focusedMinutes: learningFocusedMinutes,
      },
      evidence: {
        added: evidenceAdded,
      },
      ...(hasOppData ? { opportunityActivity: oppMetrics } : {}),
    };

    const completed = await prisma.weeklyReview.update({
      where: { id: review.id },
      data: {
        status: 'COMPLETED',
        metricsSnapshot,
        wins: data.wins !== undefined ? data.wins : review.wins,
        challenges: data.challenges !== undefined ? data.challenges : review.challenges,
        learnings: data.learnings !== undefined ? data.learnings : review.learnings,
        continueDoing: data.continueDoing !== undefined ? data.continueDoing : review.continueDoing,
        stopDoing: data.stopDoing !== undefined ? data.stopDoing : review.stopDoing,
        startDoing: data.startDoing !== undefined ? data.startDoing : review.startDoing,
        nextWeekMainGoalId: data.nextWeekMainGoalId !== undefined ? data.nextWeekMainGoalId : review.nextWeekMainGoalId,
        nextWeekMainTaskId: data.nextWeekMainTaskId !== undefined ? data.nextWeekMainTaskId : review.nextWeekMainTaskId,
        plannedCareerMinutes: data.plannedCareerMinutes !== undefined ? data.plannedCareerMinutes : review.plannedCareerMinutes,
        notes: data.notes !== undefined ? data.notes : review.notes,
        // sync snapshot fields into legacy columns for backwards compatibility
        deepWorkMinutes: liveMetrics.totalFocusMinutes,
        tasksCompletedCount: liveMetrics.tasksCompleted,
      },
    });

    return completed;
  }

  /**
   * Get past completed reviews (GET /api/reviews/weekly)
   */
  async getWeeklyReviewHistory(userId) {
    return prisma.weeklyReview.findMany({
      where: {
        userId,
      },
      orderBy: { weekStartDate: 'desc' },
      take: 20,
    });
  }
}

module.exports = new WeeklyReviewService();
