const prisma = require('../../config/db');

class TrendService {
  /**
   * Get simple weekly buckets for up to 8 weeks ending at the current week
   * @param {string} userId
   * @param {string} timezone
   * @param {number} weekCount (max 8)
   */
  async getWeeklyTrend(userId, timezone = 'UTC', weekCount = 8) {
    const weeks = [];
    const now = new Date();

    // Determine current user-local date
    const localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);

    const [year, month, day] = localDateStr.split('-').map(Number);
    // User local midnight
    const localToday = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = localToday.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    // Current week's Monday
    const currentMonday = new Date(localToday);
    currentMonday.setUTCDate(localToday.getUTCDate() + diffToMonday);

    // Build the 8 weekly windows ending on current week (from oldest to newest)
    for (let i = weekCount - 1; i >= 0; i--) {
      const weekMonday = new Date(currentMonday);
      weekMonday.setUTCDate(currentMonday.getUTCDate() - i * 7);

      const weekSunday = new Date(weekMonday);
      weekSunday.setUTCDate(weekMonday.getUTCDate() + 6);

      const startStr = weekMonday.toISOString().slice(0, 10);
      const endStr = weekSunday.toISOString().slice(0, 10);

      // UTC range for user local Monday 00:00:00 to Sunday 23:59:59.999
      const utcStart = new Date(`${startStr}T00:00:00.000Z`);
      const utcEnd = new Date(`${endStr}T23:59:59.999Z`);

      const label = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(weekMonday);

      weeks.push({
        label,
        weekStartDate: startStr,
        weekEndDate: endStr,
        utcStart,
        utcEnd,
      });
    }

    // Earliest start and latest end
    const earliestStart = weeks[0].utcStart;
    const latestEnd = weeks[weeks.length - 1].utcEnd;

    // Fetch all completed focus sessions in the 8-week window
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        actualMinutes: { gt: 0 },
        startedAt: { gte: earliestStart, lte: latestEnd },
      },
      select: { actualMinutes: true, startedAt: true },
    });

    // Fetch all completed tasks in the 8-week window
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: earliestStart, lte: latestEnd },
      },
      select: { completedAt: true },
    });

    // Populate buckets
    const trendData = weeks.map((w) => {
      const weekSessions = focusSessions.filter(
        (s) => s.startedAt >= w.utcStart && s.startedAt <= w.utcEnd
      );
      const focusMinutes = weekSessions.reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

      const activeDateSet = new Set();
      weekSessions.forEach((s) => {
        const dStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(s.startedAt));
        activeDateSet.add(dStr);
      });

      const tasksCompleted = tasks.filter(
        (t) => t.completedAt >= w.utcStart && t.completedAt <= w.utcEnd
      ).length;

      return {
        label: w.label,
        weekStartDate: w.weekStartDate,
        weekEndDate: w.weekEndDate,
        focusMinutes,
        tasksCompleted,
        activeDays: activeDateSet.size,
      };
    });

    return trendData;
  }
}

module.exports = new TrendService();
