const prisma = require('../../config/db');
const { getUserLocalDate, parseLocalDateToUtcDate, getUserWeekRange } = require('../../utils/timezone');

class WorkLogService {
  /**
   * Helper to resolve user's IANA timezone
   * @param {string} userId
   * @returns {Promise<string>}
   */
  async getUserTimezone(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { timezone: true } } },
    });
    return user?.profile?.timezone || 'Asia/Kolkata';
  }

  /**
   * Get today's work log for user without any side-effects / database writes.
   * @param {string} userId
   * @returns {Promise<{ workLog: Object|null, date: string, timezone: string }>}
   */
  async getToday(userId) {
    const timezone = await this.getUserTimezone(userId);
    const localDateStr = getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    const workLog = await prisma.dailyWorkLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: localDate,
        },
      },
    });

    return {
      workLog,
      date: localDateStr,
      timezone,
    };
  }

  /**
   * Create or update today's work log (or specific local date if provided).
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async upsertToday(userId, data = {}) {
    const timezone = await this.getUserTimezone(userId);
    const localDateStr = data.date || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);

    const workLog = await prisma.dailyWorkLog.upsert({
      where: {
        userId_logDate: {
          userId,
          logDate: localDate,
        },
      },
      create: {
        userId,
        logDate: localDate,
        workedOn: data.workedOn !== undefined ? data.workedOn : null,
        learned: data.learned !== undefined ? data.learned : null,
        blockers: data.blockers !== undefined ? data.blockers : null,
        nextStep: data.nextStep !== undefined ? data.nextStep : null,
      },
      update: {
        workedOn: data.workedOn !== undefined ? data.workedOn : undefined,
        learned: data.learned !== undefined ? data.learned : undefined,
        blockers: data.blockers !== undefined ? data.blockers : undefined,
        nextStep: data.nextStep !== undefined ? data.nextStep : undefined,
      },
    });

    return {
      workLog,
      date: localDateStr,
      timezone,
    };
  }

  /**
   * Get work log for specific local calendar date (YYYY-MM-DD)
   * Causes zero database writes.
   * @param {string} userId
   * @param {string} dateStr
   * @returns {Promise<{ workLog: Object|null, date: string }>}
   */
  async getByDate(userId, dateStr) {
    const localDate = parseLocalDateToUtcDate(dateStr);

    const workLog = await prisma.dailyWorkLog.findUnique({
      where: {
        userId_logDate: {
          userId,
          logDate: localDate,
        },
      },
    });

    return {
      workLog,
      date: dateStr,
    };
  }

  /**
   * List paginated work logs chronologically
   * @param {string} userId
   * @param {Object} options
   * @returns {Promise<{ workLogs: Array, total: number, page: number, limit: number, totalPages: number }>}
   */
  async listHistory(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [workLogs, total] = await Promise.all([
      prisma.dailyWorkLog.findMany({
        where: { userId },
        orderBy: { logDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dailyWorkLog.count({
        where: { userId },
      }),
    ]);

    return {
      workLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get factual work log consistency stats
   * @param {string} userId
   * @returns {Promise<{ daysLoggedThisWeek: number, daysLoggedThisMonth: number }>}
   */
  async getStats(userId) {
    const timezone = await this.getUserTimezone(userId);
    const todayStr = getUserLocalDate(timezone);
    const weekRange = getUserWeekRange(todayStr);

    // Current month range (1st of month to today)
    const monthStartStr = `${todayStr.slice(0, 7)}-01`;
    const monthStartDate = parseLocalDateToUtcDate(monthStartStr);
    const todayDate = parseLocalDateToUtcDate(todayStr);

    const [daysLoggedThisWeek, daysLoggedThisMonth] = await Promise.all([
      prisma.dailyWorkLog.count({
        where: {
          userId,
          logDate: {
            gte: weekRange.weekStartDate,
            lte: weekRange.weekEndDate,
          },
          OR: [
            { workedOn: { not: null, not: '' } },
            { learned: { not: null, not: '' } },
            { blockers: { not: null, not: '' } },
            { nextStep: { not: null, not: '' } },
          ],
        },
      }),
      prisma.dailyWorkLog.count({
        where: {
          userId,
          logDate: {
            gte: monthStartDate,
            lte: todayDate,
          },
          OR: [
            { workedOn: { not: null, not: '' } },
            { learned: { not: null, not: '' } },
            { blockers: { not: null, not: '' } },
            { nextStep: { not: null, not: '' } },
          ],
        },
      }),
    ]);

    return {
      daysLoggedThisWeek,
      daysLoggedThisMonth,
    };
  }
}

module.exports = new WorkLogService();
