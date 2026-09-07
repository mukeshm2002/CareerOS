/**
 * Timezone utilities for user-local date boundaries
 */

/**
 * Get user's local date string (YYYY-MM-DD)
 * @param {string} timezone - IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
 * @param {Date} [now] - Date instance, defaults to new Date()
 * @returns {string} - "YYYY-MM-DD"
 */
function getUserLocalDate(timezone = 'UTC', now = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(now); // en-CA formats as YYYY-MM-DD
  } catch (err) {
    // Fallback to UTC if invalid timezone
    return now.toISOString().slice(0, 10);
  }
}

/**
 * Get yesterday's local date string (YYYY-MM-DD)
 * @param {string} timezone
 * @param {string} [currentLocalDateStr]
 * @returns {string}
 */
function getUserYesterdayDate(timezone = 'UTC', currentLocalDateStr) {
  const todayStr = currentLocalDateStr || getUserLocalDate(timezone);
  const d = new Date(todayStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Get tomorrow's local date string (YYYY-MM-DD)
 * @param {string} timezone
 * @param {string} [currentLocalDateStr]
 * @returns {string}
 */
function getUserTomorrowDate(timezone = 'UTC', currentLocalDateStr) {
  const todayStr = currentLocalDateStr || getUserLocalDate(timezone);
  const d = new Date(todayStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Get user's local time components
 * @param {string} timezone
 * @param {Date} [now]
 * @returns {{ hour: number, minute: number, timeString: string, greeting: string }}
 */
function getUserLocalTimeInfo(timezone = 'UTC', now = new Date()) {
  try {
    const timeParts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || 'UTC',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(now);

    const hour = parseInt(timeParts.find((p) => p.type === 'hour')?.value || '12', 10);
    const minute = parseInt(timeParts.find((p) => p.type === 'minute')?.value || '0', 10);
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    let greeting = 'Good evening';
    if (hour >= 5 && hour < 12) {
      greeting = 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon';
    }

    return { hour, minute, timeString, greeting };
  } catch (err) {
    return { hour: 12, minute: 0, timeString: '12:00', greeting: 'Welcome' };
  }
}

/**
 * Parse YYYY-MM-DD into a UTC midnight Date object suitable for @db.Date Prisma fields
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {Date}
 */
function parseLocalDateToUtcDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return new Date(dateStr);
  }
  return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
}

/**
 * Get start and end of week for a user-local date (Monday to Sunday)
 * @param {string} dateStr - "YYYY-MM-DD"
 * @returns {{ weekStartStr: string, weekEndStr: string }}
 */
function getUserWeekRange(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z');
  // day of week: 0 = Sun, 1 = Mon, ..., 6 = Sat
  const day = d.getUTCDay();
  // Monday is day 1. Distance back to Monday:
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return {
    weekStartStr: monday.toISOString().slice(0, 10),
    weekEndStr: sunday.toISOString().slice(0, 10),
    weekStartDate: parseLocalDateToUtcDate(monday.toISOString().slice(0, 10)),
    weekEndDate: parseLocalDateToUtcDate(sunday.toISOString().slice(0, 10)),
  };
}

module.exports = {
  getUserLocalDate,
  getUserYesterdayDate,
  getUserTomorrowDate,
  getUserLocalTimeInfo,
  parseLocalDateToUtcDate,
  getUserWeekRange,
};
