const prisma = require('../../config/db');
const { getUserLocalDate, parseLocalDateToUtcDate } = require('../../utils/timezone');

class DailyPlanService {
  /**
   * Get daily plan for date
   */
  async getPlan(userId, dateStr) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const localDateStr = dateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    const plan = await prisma.dailyPlan.findUnique({
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

    return plan;
  }

  /**
   * Save or update daily plan (Draft or Confirmed)
   * Enforces 1 main task + max 3 secondary tasks
   */
  async savePlan(userId, dateStr, { mainTaskId, secondaryTaskIds = [], plannedMinutes, recommendationReason, status }) {
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

    // Validate main task ownership if provided
    if (mainTaskId) {
      const task = await prisma.task.findFirst({
        where: { id: mainTaskId, userId },
      });
      if (!task) {
        const err = new Error('Main focus task not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    // Validate secondary tasks: max 3 (Section 4 & 15)
    if (!Array.isArray(secondaryTaskIds)) {
      secondaryTaskIds = [];
    }
    if (secondaryTaskIds.length > 3) {
      const err = new Error('A daily plan may contain at most 3 secondary tasks');
      err.statusCode = 400;
      throw err;
    }

    // Filter out duplicates and mainTaskId
    const uniqueSecondaryIds = Array.from(new Set(secondaryTaskIds)).filter((id) => id !== mainTaskId);
    if (uniqueSecondaryIds.length > 3) {
      const err = new Error('A daily plan may contain at most 3 secondary tasks');
      err.statusCode = 400;
      throw err;
    }

    if (uniqueSecondaryIds.length > 0) {
      const validSecondaryTasks = await prisma.task.findMany({
        where: {
          id: { in: uniqueSecondaryIds },
          userId,
        },
      });
      if (validSecondaryTasks.length !== uniqueSecondaryIds.length) {
        const err = new Error('One or more secondary tasks do not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    // Atomic transaction for upsert & secondary tasks
    return await prisma.$transaction(async (tx) => {
      let plan = await tx.dailyPlan.findUnique({
        where: {
          userId_date: {
            userId,
            date: localDate,
          },
        },
      });

      const planData = {
        mainTaskId: mainTaskId || null,
        plannedMinutes: plannedMinutes !== undefined ? plannedMinutes : null,
        recommendationReason: recommendationReason || null,
        status: status || (plan ? plan.status : 'DRAFT'),
      };

      if (plan) {
        plan = await tx.dailyPlan.update({
          where: { id: plan.id },
          data: planData,
        });
      } else {
        plan = await tx.dailyPlan.create({
          data: {
            userId,
            date: localDate,
            ...planData,
          },
        });
      }

      // Sync secondary tasks: remove existing and re-insert up to 3 with position
      await tx.dailyPlanSecondaryTask.deleteMany({
        where: { dailyPlanId: plan.id },
      });

      if (uniqueSecondaryIds.length > 0) {
        await tx.dailyPlanSecondaryTask.createMany({
          data: uniqueSecondaryIds.map((taskId, index) => ({
            dailyPlanId: plan.id,
            taskId,
            position: index,
          })),
        });
      }

      return await tx.dailyPlan.findUnique({
        where: { id: plan.id },
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
    });
  }

  /**
   * Confirm daily plan
   */
  async confirmPlan(userId, dateStr, planData = {}) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const localDateStr = dateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    let plan = await prisma.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId,
          date: localDate,
        },
      },
    });

    if (!plan && planData.mainTaskId) {
      plan = await this.savePlan(userId, localDateStr, {
        ...planData,
        status: 'CONFIRMED',
      });
    }

    if (!plan) {
      const err = new Error('No daily plan found to confirm');
      err.statusCode = 404;
      throw err;
    }

    return await prisma.dailyPlan.update({
      where: { id: plan.id },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        ...(planData.mainTaskId ? { mainTaskId: planData.mainTaskId } : {}),
        ...(planData.plannedMinutes !== undefined ? { plannedMinutes: planData.plannedMinutes } : {}),
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
            task: true,
          },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Close daily plan
   */
  async closePlan(userId, dateStr) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    const timezone = user?.profile?.timezone || 'UTC';
    const localDateStr = dateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    const plan = await prisma.dailyPlan.findUnique({
      where: {
        userId_date: {
          userId,
          date: localDate,
        },
      },
    });

    if (!plan) {
      const err = new Error('No daily plan found to close');
      err.statusCode = 404;
      throw err;
    }

    return await prisma.dailyPlan.update({
      where: { id: plan.id },
      data: {
        status: 'CLOSED',
      },
      include: {
        mainTask: true,
        secondaryTasks: true,
      },
    });
  }
}

module.exports = new DailyPlanService();
