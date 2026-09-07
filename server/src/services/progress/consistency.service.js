const prisma = require('../../config/db');

class ConsistencyService {
  /**
   * Calculate consecutive active-day streak and longest streak in user timezone
   * @param {string} userId
   * @param {string} timezone
   */
  async calculateConsistency(userId, timezone = 'UTC') {
    // Fetch all completed focus sessions with actualMinutes > 0
    const sessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        actualMinutes: { gt: 0 },
      },
      select: { startedAt: true },
      orderBy: { startedAt: 'desc' },
    });

    if (sessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
      };
    }

    // Set of distinct YYYY-MM-DD strings in user's timezone
    const activeDates = new Set();
    sessions.forEach((s) => {
      const dateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(s.startedAt));
      activeDates.add(dateStr);
    });

    const sortedDates = Array.from(activeDates).sort(); // ascending 'YYYY-MM-DD'
    const totalActiveDays = sortedDates.length;

    // Current date in user's timezone
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    // Calculate current streak
    // Streak can continue if user was active today OR yesterday
    let currentStreak = 0;
    const todayDate = new Date(`${todayStr}T00:00:00Z`);

    // Check if active today
    let checkDate = new Date(todayDate);
    if (!activeDates.has(todayStr)) {
      // If not active today, check if active yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const checkStr = checkDate.toISOString().slice(0, 10);
      if (activeDates.has(checkStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest consecutive streak ever
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;

    for (const dStr of sortedDates) {
      const curDate = new Date(`${dStr}T00:00:00Z`);
      if (prevDate) {
        const diffDays = Math.round((curDate - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDate = curDate;
    }

    return {
      currentStreak,
      longestStreak,
      totalActiveDays,
    };
  }
}

module.exports = new ConsistencyService();
