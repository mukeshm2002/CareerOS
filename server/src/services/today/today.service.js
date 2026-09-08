const prisma = require('../../config/db');
const { getUserLocalDate, getUserYesterdayDate, parseLocalDateToUtcDate } = require('../../utils/timezone');
const recommendationService = require('./recommendation.service');
const skillGapService = require('../planning/skillGap.service');

class TodayService {
  /**
   * Get normalized Today Context for authenticated user
   * @param {string} userId
   * @param {string} [overrideDateStr] - Optional date override for testing or review
   * @returns {Promise<Object>}
   */
  async getTodayContext(userId, overrideDateStr) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const timezone = user.profile?.timezone || 'UTC';
    const localDateStr = overrideDateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);
    const yesterdayDateStr = getUserYesterdayDate(timezone, localDateStr);
    const yesterdayDate = parseLocalDateToUtcDate(yesterdayDateStr);

    const availableCareerMinutes = user.profile?.availableCareerMinutes || 120;

    // Fetch existing DailyPlan for today (if created)
    const todayPlan = await prisma.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId,
          date: localDate,
        },
      },
      include: {
        mainTask: {
          include: {
            goal: true,
            milestone: true,
            skill: true,
          },
        },
        secondaryTasks: {
          include: {
            task: {
              include: {
                goal: true,
                milestone: true,
                skill: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    // Fetch today's work log (if created)
    const todayWorkLog = await prisma.dailyWorkLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: localDate,
        },
      },
    });

    // Fetch yesterday's DailyReview and DailyPlan
    const [yesterdayReview, yesterdayPlan] = await Promise.all([
      prisma.dailyReview.findUnique({
        where: {
          userId_date: {
            userId,
            date: yesterdayDate,
          },
        },
      }),
      prisma.dailyPlan.findUnique({
        where: {
          userId_date: {
            userId,
            date: yesterdayDate,
          },
        },
      }),
    ]);

    // Fetch today's schedule blocks
    const todayScheduleBlocks = await prisma.scheduleBlock.findMany({
      where: {
        userId,
        date: localDate,
      },
      include: {
        task: true,
        goal: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Fetch incomplete tasks for recommendation
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
      },
      include: {
        goal: true,
        milestone: true,
        skill: true,
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    // Fetch completed tasks for today (for stats strip)
    const completedTasksToday = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: localDate,
          lt: new Date(localDate.getTime() + 86400000),
        },
      },
      select: { id: true, title: true, actualMinutes: true, completedAt: true },
    });

    // Fetch completed focus sessions for today (to compute completedMinutes)
    const todayFocusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        startedAt: {
          gte: localDate,
          lt: new Date(localDate.getTime() + 86400000),
        },
      },
      select: {
        id: true,
        taskId: true,
        status: true,
        plannedMinutes: true,
        actualMinutes: true,
        startedAt: true,
        endedAt: true,
      },
    });

    const completedMinutes = todayFocusSessions
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    // Calculate skill gaps
    let skillGaps = [];
    try {
      skillGaps = await skillGapService.calculateSkillGaps(userId);
    } catch (e) {
      skillGaps = [];
    }

    // Deterministic recommendation
    const recommendation = recommendationService.rankTasksForToday({
      userId,
      localDateStr,
      availableCareerMinutes,
      tasks: incompleteTasks,
      todayScheduleBlocks,
      yesterdayReview,
      yesterdayPlan,
      skillGaps,
    });

    // Calculate plannedMinutes
    let plannedMinutes = 0;
    if (todayPlan) {
      if (todayPlan.plannedMinutes) {
        plannedMinutes = todayPlan.plannedMinutes;
      } else {
        const mainEst = todayPlan.mainTask?.estimatedMinutes || 0;
        const secEst = todayPlan.secondaryTasks?.reduce((sum, st) => sum + (st.task?.estimatedMinutes || 0), 0) || 0;
        plannedMinutes = mainEst + secEst;
      }
    } else if (recommendation.recommendedTask) {
      plannedMinutes = recommendation.recommendedTask.estimatedMinutes || 30;
    }

    // Determine Day Status (Section 13)
    // READY: No plan confirmed yet
    // PLANNED: Plan confirmed, no focus session started
    // IN_PROGRESS: Focus session active/in progress
    // COMPLETED: Plan completed
    // CLOSED: Day closed via Daily Review
    let dayStatus = 'READY';
    if (todayPlan) {
      if (todayPlan.status === 'CLOSED') {
        dayStatus = 'CLOSED';
      } else if (todayPlan.status === 'COMPLETED') {
        dayStatus = 'COMPLETED';
      } else if (todayPlan.status === 'IN_PROGRESS') {
        dayStatus = 'IN_PROGRESS';
      } else if (todayPlan.status === 'CONFIRMED') {
        dayStatus = 'PLANNED';
      } else {
        dayStatus = 'READY';
      }
    }

    // Check active focus session
    const activeFocusSession = await prisma.focusSession.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      include: {
        task: {
          include: {
            goal: true,
            milestone: true,
          },
        },
      },
    });

    if (activeFocusSession && dayStatus !== 'CLOSED') {
      dayStatus = 'IN_PROGRESS';
    }

    return {
      date: localDateStr,
      timezone,
      dayStatus,
      availableCareerMinutes,
      plannedMinutes,
      completedMinutes,
      todayPlan,
      todayWorkLog,
      recommendation,
      activeFocusSession,
      todaySchedule: todayScheduleBlocks,
      completedTasksToday,
      todayFocusSessions,
      previousUnfinishedPlan: yesterdayPlan && yesterdayPlan.status !== 'COMPLETED' && yesterdayPlan.status !== 'CLOSED' ? yesterdayPlan : null,
    };
  }

  /**
   * Pure recommendation fetcher without side-effects
   */
  async getRecommendation(userId, overrideDateStr) {
    const context = await this.getTodayContext(userId, overrideDateStr);
    return context.recommendation;
  }
}

module.exports = new TodayService();
