const prisma = require('../../config/db');
const weeklyMetricsService = require('./weeklyMetrics.service');
const consistencyService = require('./consistency.service');
const goalProgressService = require('./goalProgress.service');
const trendService = require('./trend.service');
const skillGapService = require('../planning/skillGap.service');
const opportunityMetricsService = require('../opportunities/opportunityMetrics.service');

class ProgressService {
  /**
   * Resolve user IANA timezone from profile
   */
  async getUserTimezone(userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    return profile?.timezone || 'Asia/Kolkata';
  }

  /**
   * Determine UTC start and end bounds for a period string in user's timezone
   */
  resolvePeriodBounds(period = 'this_week', timezone = 'UTC', customStart = null, customEnd = null) {
    const normalized = (period || 'this_week').toLowerCase();
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

    let startDateStr;
    let endDateStr;
    let label;

    switch (normalized) {
      case 'last_week': {
        const lastMonday = new Date(localToday);
        lastMonday.setUTCDate(localToday.getUTCDate() + diffToMonday - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setUTCDate(lastMonday.getUTCDate() + 6);
        startDateStr = lastMonday.toISOString().slice(0, 10);
        endDateStr = lastSunday.toISOString().slice(0, 10);
        label = 'Last Week';
        break;
      }
      case 'this_month': {
        const firstOfMonth = new Date(Date.UTC(year, month - 1, 1));
        const lastOfMonth = new Date(Date.UTC(year, month, 0));
        startDateStr = firstOfMonth.toISOString().slice(0, 10);
        endDateStr = lastOfMonth.toISOString().slice(0, 10);
        label = 'This Month';
        break;
      }
      case 'last_30_days': {
        const thirtyDaysAgo = new Date(localToday);
        thirtyDaysAgo.setUTCDate(localToday.getUTCDate() - 29);
        startDateStr = thirtyDaysAgo.toISOString().slice(0, 10);
        endDateStr = localToday.toISOString().slice(0, 10);
        label = 'Last 30 Days';
        break;
      }
      case 'custom': {
        if (customStart && customEnd) {
          startDateStr = customStart;
          endDateStr = customEnd;
          label = `${customStart} to ${customEnd}`;
        } else {
          // fallback to this week
          const mon = new Date(localToday);
          mon.setUTCDate(localToday.getUTCDate() + diffToMonday);
          const sun = new Date(mon);
          sun.setUTCDate(mon.getUTCDate() + 6);
          startDateStr = mon.toISOString().slice(0, 10);
          endDateStr = sun.toISOString().slice(0, 10);
          label = 'This Week';
        }
        break;
      }
      case 'this_week':
      default: {
        const thisMonday = new Date(localToday);
        thisMonday.setUTCDate(localToday.getUTCDate() + diffToMonday);
        const thisSunday = new Date(thisMonday);
        thisSunday.setUTCDate(thisMonday.getUTCDate() + 6);
        startDateStr = thisMonday.toISOString().slice(0, 10);
        endDateStr = thisSunday.toISOString().slice(0, 10);
        label = 'This Week';
        break;
      }
    }

    const utcStart = new Date(`${startDateStr}T00:00:00.000Z`);
    const utcEnd = new Date(`${endDateStr}T23:59:59.999Z`);

    return {
      periodType: normalized.toUpperCase(),
      label,
      startDate: startDateStr,
      endDate: endDateStr,
      utcStart,
      utcEnd,
      timezone,
    };
  }

  /**
   * Main aggregate Progress API implementation (GET /api/progress)
   */
  async getProgress(userId, query = {}) {
    const timezone = await this.getUserTimezone(userId);
    const bounds = this.resolvePeriodBounds(
      query.period,
      timezone,
      query.startDate,
      query.endDate
    );

    // 1. Execution metrics
    const metrics = await weeklyMetricsService.calculateMetrics(
      userId,
      bounds.utcStart,
      bounds.utcEnd,
      timezone
    );

    // 2. Consistency & Streak
    const consistency = await consistencyService.calculateConsistency(userId, timezone);

    // 3. Goal Movement & Roadmap Attribution
    const goals = await goalProgressService.calculateGoalMovement(
      userId,
      bounds.utcStart,
      bounds.utcEnd
    );

    // 4. Skill Movement in period (from UserSkillAssessmentHistory)
    const skillHistory = await prisma.userSkillAssessmentHistory.findMany({
      where: {
        userId,
        changedAt: {
          gte: bounds.utcStart,
          lte: bounds.utcEnd,
        },
      },
      include: {
        skill: true,
      },
      orderBy: { changedAt: 'desc' },
    });

    const skillMovements = skillHistory.map((h) => ({
      id: h.id,
      skillId: h.skillId,
      skillName: h.skill?.name || 'Unknown',
      category: h.skill?.category || 'TECHNICAL',
      previousLevel: h.previousLevel,
      newLevel: h.newLevel,
      targetLevel: h.targetLevel,
      assessmentType: h.assessmentType,
      evidence: h.evidence,
      notes: h.notes,
      changedAt: h.changedAt,
    }));

    // 5. Tasks breakdown by type & recent completions
    const tasksByType = {};
    metrics.completedTasksList.forEach((t) => {
      const type = t.taskType || 'GENERAL';
      tasksByType[type] = (tasksByType[type] || 0) + 1;
    });

    const recentCompletions = metrics.completedTasksList.slice(0, 10).map((t) => ({
      id: t.id,
      title: t.title,
      taskType: t.taskType,
      goalTitle: t.goal?.title || null,
      milestoneTitle: t.milestone?.title || null,
      skillName: t.userSkill?.skill?.name || null,
      actualMinutes: t.actualMinutes || 0,
      completedAt: t.completedAt,
    }));

    // 6. 8-Week Trend
    const trend = await trendService.getWeeklyTrend(userId, timezone, 8);

    // Compute total days in period
    const startD = new Date(`${bounds.startDate}T00:00:00Z`);
    const endD = new Date(`${bounds.endDate}T00:00:00Z`);
    const totalDaysInPeriod = Math.max(1, Math.round((endD - startD) / (86400000)) + 1);

    // 7. Opportunity Activity in period (Section 39)
    const opportunityActivity = await opportunityMetricsService.getOpportunityMetricsForPeriod(
      userId,
      bounds.utcStart,
      bounds.utcEnd
    );

    // 8. Phase 1G Projects, Learning & Evidence metrics in period (Section 58, 59, 60, 86)
    const [
      projectsCompleted,
      projectMilestonesCompleted,
      learningModulesCompleted,
      learningSessions,
      projectSessions,
      evidenceAdded,
      portfolioProjects,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
        },
      }),
      prisma.projectMilestone.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
        },
      }),
      prisma.learningModule.count({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
        },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
          task: {
            learningModuleId: { not: null },
          },
        },
        select: { actualMinutes: true, durationMinutes: true },
      }),
      prisma.focusSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
          task: {
            projectId: { not: null },
          },
        },
        select: { actualMinutes: true, durationMinutes: true },
      }),
      prisma.evidence.count({
        where: {
          userId,
          createdAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
        },
      }),
      prisma.project.count({
        where: {
          userId,
          isPortfolioVisible: true,
          archivedAt: null,
        },
      }),
    ]);

    const learningFocusMinutes = learningSessions.reduce(
      (sum, s) => sum + (s.actualMinutes || s.durationMinutes || 0),
      0
    );
    const projectFocusMinutes = projectSessions.reduce(
      (sum, s) => sum + (s.actualMinutes || s.durationMinutes || 0),
      0
    );

    return {
      period: {
        type: bounds.periodType,
        label: bounds.label,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        timezone,
      },
      metrics: {
        ...metrics,
        plannedMinutes: metrics.plannedFocusMinutes,
        projectsCompleted,
        projectMilestonesCompleted,
        learningModulesCompleted,
        learningFocusMinutes,
        projectFocusMinutes,
        evidenceAdded,
        portfolioProjects,
      },
      goalProgress: goals,
      execution: {
        focusSessionsCompleted: metrics.focusSessionsCompleted,
        totalFocusMinutes: metrics.totalFocusMinutes,
        tasksCompleted: metrics.tasksCompleted,
        tasksBlocked: metrics.blockedTasksCount,
        activeDays: metrics.activeDays,
        dailyPlansConfirmed: metrics.dailyPlansConfirmed,
        mainFocusCompleted: metrics.mainFocusCompleted,
        mainFocusFollowThrough: metrics.mainFocusFollowThrough,
        milestonesCompleted: metrics.milestonesCompleted,
      },
      plannedVsActual: {
        plannedFocusMinutes: metrics.plannedFocusMinutes,
        actualFocusMinutes: metrics.actualFocusMinutes,
        differenceMinutes: metrics.differenceMinutes,
      },
      consistency: {
        activeDays: metrics.activeDays,
        totalDaysInPeriod,
        currentStreak: consistency.currentStreak,
        longestStreak: consistency.longestStreak,
      },
      goals,
      skills: {
        upgradedSkillsCount: skillMovements.length,
        assessmentChanges: skillMovements,
      },
      tasks: {
        byType: tasksByType,
        recentCompletions,
      },
      blockers: {
        blockedTasksCount: metrics.blockedTasksCount,
        blockedTasksList: metrics.blockedTasksList,
        dailyReviewsWithBlockers: metrics.dailyReviewsWithBlockers,
      },
      trend,
      opportunityActivity,
      projectsCompleted,
      projectMilestonesCompleted,
      learningModulesCompleted,
      learningFocusMinutes,
      projectFocusMinutes,
      evidenceAdded,
      portfolioProjects,
      proofOfWork: {
        projectsCompleted,
        projectMilestonesCompleted,
        projectFocusMinutes,
        evidenceAdded,
        portfolioProjects,
      },
      learning: {
        modulesCompleted: learningModulesCompleted,
        learningFocusMinutes,
      },
    };
  }

  /**
   * Trends endpoint for multi-week trajectory (GET /api/progress/trends)
   */
  async getTrends(userId, query = {}) {
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const timezone = userProfile?.timezone || 'UTC';
    const weeks = Math.min(parseInt(query.weeks, 10) || 8, 8);
    const trend = await trendService.getWeeklyTrend(userId, timezone, weeks);
    return { trend };
  }

  /**
   * Detail endpoint for a single goal's progress (GET /api/progress/goals/:goalId)
   */
  async getGoalProgressDetail(userId, goalId, query = {}) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
      include: {
        roadmaps: {
          include: {
            milestones: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    const timezone = await this.getUserTimezone(userId);
    const bounds = this.resolvePeriodBounds(
      query.period || 'this_week',
      timezone,
      query.startDate,
      query.endDate
    );

    const roadmap = goal.roadmaps[0] || null;

    // Completed tasks for this goal
    const goalTasks = await prisma.task.findMany({
      where: {
        userId,
        goalId: goal.id,
        status: 'COMPLETED',
        completedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
      },
      select: {
        id: true,
        title: true,
        taskType: true,
        actualMinutes: true,
        completedAt: true,
        milestoneId: true,
      },
    });

    // Focus sessions for this goal
    const goalSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        actualMinutes: { gt: 0 },
        startedAt: { gte: bounds.utcStart, lte: bounds.utcEnd },
        task: { goalId: goal.id },
      },
      select: { actualMinutes: true },
    });
    const totalFocusMinutes = goalSessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    return {
      goal: {
        id: goal.id,
        title: goal.title,
        status: goal.status,
        priority: goal.priority,
        progress: goal.progress,
      },
      period: bounds,
      roadmap: roadmap
        ? {
            id: roadmap.id,
            title: roadmap.title,
            progress: roadmap.progress,
            milestones: roadmap.milestones,
          }
        : null,
      periodExecution: {
        tasksCompletedCount: goalTasks.length,
        focusMinutes: totalFocusMinutes,
        tasks: goalTasks,
      },
    };
  }
}

module.exports = new ProgressService();
