const prisma = require('../../config/db');
const { getUserLocalDate, parseLocalDateToUtcDate } = require('../../utils/timezone');
const dailyPlanService = require('./dailyPlan.service');

class DailyReviewService {
  /**
   * Get review for user and date
   */
  async getReview(userId, dateStr) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const localDateStr = dateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    return await prisma.dailyReview.findUnique({
      where: {
        userId_date: {
          userId,
          date: localDate,
        },
      },
      include: {
        tomorrowMainTaskRel: {
          include: {
            goal: true,
            milestone: true,
          },
        },
      },
    });
  }

  /**
   * Save or update daily review (draft or final)
   */
  async saveReview(userId, dateStr, data = {}) {
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
    const localDateStr = dateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    // Validate tomorrowMainTaskId if provided
    let tomorrowTaskTitle = data.tomorrowMainTask;
    if (data.tomorrowMainTaskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: data.tomorrowMainTaskId,
          userId,
        },
      });

      if (!task) {
        const err = new Error('Tomorrow main task not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
      tomorrowTaskTitle = task.title;
    }

    const reviewFields = {
      completedSummary: data.completedSummary !== undefined ? data.completedSummary : undefined,
      learnedSummary: data.learnedSummary !== undefined ? data.learnedSummary : undefined,
      learnings: data.learnedSummary !== undefined ? data.learnedSummary : (data.learnings !== undefined ? data.learnings : undefined),
      blockerSummary: data.blockerSummary !== undefined ? data.blockerSummary : undefined,
      blockers: data.blockerSummary !== undefined ? data.blockerSummary : (data.blockers !== undefined ? data.blockers : undefined),
      tomorrowMainTaskId: data.tomorrowMainTaskId !== undefined ? (data.tomorrowMainTaskId || null) : undefined,
      tomorrowMainTask: tomorrowTaskTitle !== undefined ? tomorrowTaskTitle : undefined,
      energyLevel: data.energyLevel !== undefined ? (data.energyLevel || null) : undefined,
      mood: data.mood !== undefined ? data.mood : undefined,
      notes: data.notes !== undefined ? data.notes : undefined,
    };

    // Filter out undefined fields
    const cleanedFields = {};
    for (const [key, value] of Object.entries(reviewFields)) {
      if (value !== undefined) {
        cleanedFields[key] = value;
      }
    }

    const review = await prisma.dailyReview.upsert({
      where: {
        userId_date: {
          userId,
          date: localDate,
        },
      },
      update: cleanedFields,
      create: {
        userId,
        date: localDate,
        ...cleanedFields,
      },
      include: {
        tomorrowMainTaskRel: {
          include: {
            goal: true,
            milestone: true,
          },
        },
      },
    });

    // If closeDay requested, close daily plan
    if (data.closeDay) {
      try {
        await dailyPlanService.closePlan(userId, localDateStr);
      } catch (e) {
        // Safe to ignore if plan didn't exist
      }
    }

    return review;
  }
}

module.exports = new DailyReviewService();
