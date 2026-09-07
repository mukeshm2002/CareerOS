const prisma = require('../../config/db');

class WeeklyMetricsService {
  /**
   * Calculate factual execution metrics for a specific date range
   * @param {string} userId
   * @param {Date} start - UTC start of period
   * @param {Date} end - UTC end of period
   * @param {string} timezone - User's IANA timezone (e.g. 'Asia/Kolkata')
   */
  async calculateMetrics(userId, start, end, timezone = 'UTC') {
    // 1. Completed focus sessions (actualMinutes > 0, NOT cancelled)
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        actualMinutes: { gt: 0 },
        startedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        task: {
          select: { id: true, goalId: true, milestoneId: true, taskType: true },
        },
      },
    });

    const focusSessionsCompleted = focusSessions.length;
    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

    // 2. Active Career Days: distinct calendar days in user's timezone containing >= 1 completed session
    const activeDateSet = new Set();
    focusSessions.forEach((s) => {
      // Format session date in user's timezone
      const localDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(s.startedAt));
      activeDateSet.add(localDateStr);
    });
    const activeDays = activeDateSet.size;

    // 3. Tasks completed within the period
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        goal: { select: { id: true, title: true } },
        milestone: { select: { id: true, title: true } },
        userSkill: { include: { skill: true } },
      },
    });
    const tasksCompleted = completedTasks.length;

    // 4. Tasks currently blocked or marked blocked
    const blockedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'BLOCKED',
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        priority: true,
      },
    });

    // 5. Daily plans confirmed in period
    // In DB, DailyPlan.date is stored as Date (@db.Date)
    const dailyPlans = await prisma.dailyPlan.findMany({
      where: {
        userId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'] },
        date: {
          gte: start,
          lte: end,
        },
      },
      include: {
        mainTask: true,
      },
    });

    const dailyPlansConfirmed = dailyPlans.length;
    // Main focus completed days: daily plans where mainTask is marked COMPLETED
    const mainFocusCompleted = dailyPlans.filter((dp) => dp.mainTask && dp.mainTask.status === 'COMPLETED').length;

    // 6. Planned vs Actual Focus Time (Section 9: Canonical source is DailyPlan.plannedMinutes)
    const plannedFocusMinutes = dailyPlans.reduce((acc, dp) => acc + (dp.plannedMinutes || 0), 0);
    const actualFocusMinutes = totalFocusMinutes;
    const differenceMinutes = actualFocusMinutes - plannedFocusMinutes;

    // 7. Daily reviews with blocker summaries in the period
    const dailyReviewsWithBlockers = await prisma.dailyReview.count({
      where: {
        userId,
        date: {
          gte: start,
          lte: end,
        },
        blockerSummary: { not: null },
      },
    });

    // 8. Roadmap milestones completed in period
    const milestonesCompleted = await prisma.roadmapMilestone.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    return {
      focusSessionsCompleted,
      totalFocusMinutes,
      activeDays,
      activeDateSet: Array.from(activeDateSet),
      tasksCompleted,
      completedTasksList: completedTasks,
      blockedTasksCount: blockedTasks.length,
      blockedTasksList: blockedTasks,
      dailyPlansConfirmed,
      mainFocusCompleted,
      mainFocusFollowThrough: `${mainFocusCompleted} / ${dailyPlansConfirmed || 0}`,
      plannedFocusMinutes,
      actualFocusMinutes,
      differenceMinutes,
      dailyReviewsWithBlockers,
      milestonesCompleted,
    };
  }
}

module.exports = new WeeklyMetricsService();
