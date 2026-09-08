/**
 * CareerOS Client Timezone Utilities
 * Standard IANA timezones formatted with offsets, friendly labels, and search keywords.
 */

export const TIMEZONES = [
  // Primary / India
  {
    value: 'Asia/Kolkata',
    name: 'India Standard Time',
    location: 'India',
    shortCity: 'India',
    keywords: ['india', 'kolkata', 'calcutta', 'mumbai', 'delhi', 'bengaluru', 'bangalore', 'ist', 'asia/kolkata', '+05:30', 'utc+05:30'],
  },
  // Middle East / Gulf
  {
    value: 'Asia/Dubai',
    name: 'Dubai',
    location: 'United Arab Emirates',
    shortCity: 'Dubai',
    keywords: ['dubai', 'uae', 'united arab emirates', 'abu dhabi', 'gst', 'asia/dubai', '+04:00', 'utc+04:00'],
  },
  // Southeast Asia & East Asia
  {
    value: 'Asia/Singapore',
    name: 'Singapore',
    location: 'Singapore',
    shortCity: 'Singapore',
    keywords: ['singapore', 'sgt', 'asia/singapore', '+08:00', 'utc+08:00'],
  },
  {
    value: 'Asia/Hong_Kong',
    name: 'Hong Kong',
    location: 'Hong Kong',
    shortCity: 'Hong Kong',
    keywords: ['hong kong', 'hkt', 'asia/hong_kong', '+08:00', 'utc+08:00'],
  },
  {
    value: 'Asia/Tokyo',
    name: 'Tokyo',
    location: 'Japan',
    shortCity: 'Tokyo',
    keywords: ['tokyo', 'japan', 'jst', 'asia/tokyo', '+09:00', 'utc+09:00'],
  },
  {
    value: 'Asia/Seoul',
    name: 'Seoul',
    location: 'South Korea',
    shortCity: 'Seoul',
    keywords: ['seoul', 'korea', 'kst', 'asia/seoul', '+09:00', 'utc+09:00'],
  },
  {
    value: 'Asia/Bangkok',
    name: 'Bangkok',
    location: 'Thailand, Vietnam, Jakarta',
    shortCity: 'Bangkok',
    keywords: ['bangkok', 'thailand', 'vietnam', 'jakarta', 'ict', 'asia/bangkok', '+07:00', 'utc+07:00'],
  },
  // South Asia neighbors
  {
    value: 'Asia/Kathmandu',
    name: 'Nepal Time',
    location: 'Nepal',
    shortCity: 'Kathmandu',
    keywords: ['nepal', 'kathmandu', 'npt', 'asia/kathmandu', '+05:45', 'utc+05:45'],
  },
  {
    value: 'Asia/Karachi',
    name: 'Pakistan Standard Time',
    location: 'Pakistan',
    shortCity: 'Karachi',
    keywords: ['pakistan', 'karachi', 'pkt', 'asia/karachi', '+05:00', 'utc+05:00'],
  },
  {
    value: 'Asia/Dhaka',
    name: 'Bangladesh Time',
    location: 'Bangladesh',
    shortCity: 'Dhaka',
    keywords: ['bangladesh', 'dhaka', 'bst', 'asia/dhaka', '+06:00', 'utc+06:00'],
  },
  // Europe & UK
  {
    value: 'Europe/London',
    name: 'London',
    location: 'United Kingdom',
    shortCity: 'London',
    keywords: ['london', 'uk', 'united kingdom', 'britain', 'england', 'gmt', 'bst', 'europe/london', '+00:00', '+01:00'],
  },
  {
    value: 'Europe/Paris',
    name: 'Paris',
    location: 'France',
    shortCity: 'Paris',
    keywords: ['paris', 'france', 'cet', 'cest', 'europe/paris', '+01:00', '+02:00'],
  },
  {
    value: 'Europe/Berlin',
    name: 'Berlin',
    location: 'Germany, Amsterdam',
    shortCity: 'Berlin',
    keywords: ['berlin', 'germany', 'amsterdam', 'frankfurt', 'cet', 'cest', 'europe/berlin', '+01:00', '+02:00'],
  },
  {
    value: 'Europe/Athens',
    name: 'Athens',
    location: 'Greece',
    shortCity: 'Athens',
    keywords: ['athens', 'greece', 'eet', 'eest', 'europe/athens', '+02:00', '+03:00'],
  },
  // Americas
  {
    value: 'America/New_York',
    name: 'New York',
    location: 'Eastern Time (US & Canada)',
    shortCity: 'New York',
    keywords: ['new york', 'nyc', 'eastern', 'est', 'edt', 'usa', 'united states', 'america/new_york', '-05:00', '-04:00'],
  },
  {
    value: 'America/Chicago',
    name: 'Chicago',
    location: 'Central Time (US & Canada)',
    shortCity: 'Chicago',
    keywords: ['chicago', 'central', 'cst', 'cdt', 'usa', 'united states', 'america/chicago', '-06:00', '-05:00'],
  },
  {
    value: 'America/Denver',
    name: 'Denver',
    location: 'Mountain Time (US & Canada)',
    shortCity: 'Denver',
    keywords: ['denver', 'mountain', 'mst', 'mdt', 'usa', 'united states', 'america/denver', '-07:00', '-06:00'],
  },
  {
    value: 'America/Los_Angeles',
    name: 'Los Angeles',
    location: 'Pacific Time (US & Canada)',
    shortCity: 'Los Angeles',
    keywords: ['los angeles', 'pacific', 'california', 'sf', 'san francisco', 'pst', 'pdt', 'usa', 'united states', 'america/los_angeles', '-08:00', '-07:00'],
  },
  {
    value: 'America/Toronto',
    name: 'Toronto',
    location: 'Canada',
    shortCity: 'Toronto',
    keywords: ['toronto', 'canada', 'eastern', 'america/toronto'],
  },
  {
    value: 'America/Vancouver',
    name: 'Vancouver',
    location: 'Canada (Pacific)',
    shortCity: 'Vancouver',
    keywords: ['vancouver', 'canada', 'pacific', 'america/vancouver'],
  },
  {
    value: 'America/Sao_Paulo',
    name: 'São Paulo',
    location: 'Brazil',
    shortCity: 'São Paulo',
    keywords: ['sao paulo', 'brazil', 'brasil', 'america/sao_paulo', '-03:00'],
  },
  // Oceania
  {
    value: 'Australia/Perth',
    name: 'Perth',
    location: 'Western Australia',
    shortCity: 'Perth',
    keywords: ['perth', 'australia', 'awst', 'australia/perth', '+08:00'],
  },
  {
    value: 'Australia/Sydney',
    name: 'Sydney',
    location: 'Australia (Sydney, Melbourne)',
    shortCity: 'Sydney',
    keywords: ['sydney', 'melbourne', 'australia', 'aest', 'aedt', 'australia/sydney', '+10:00', '+11:00'],
  },
  {
    value: 'Australia/Adelaide',
    name: 'Adelaide',
    location: 'South Australia',
    shortCity: 'Adelaide',
    keywords: ['adelaide', 'australia', 'acst', 'acdt', 'australia/adelaide', '+09:30', '+10:30'],
  },
  {
    value: 'Pacific/Auckland',
    name: 'Auckland',
    location: 'New Zealand',
    shortCity: 'Auckland',
    keywords: ['auckland', 'new zealand', 'nzst', 'nzdt', 'pacific/auckland', '+12:00', '+13:00'],
  },
  // Universal
  {
    value: 'UTC',
    name: 'UTC',
    location: 'Coordinated Universal Time',
    shortCity: 'UTC',
    keywords: ['utc', 'gmt', 'universal', 'zulu', 'coordinated universal time', '+00:00', 'utc+00:00'],
  },
];

/**
 * Dynamically computes UTC offset string for any valid IANA timezone
 * Handles standard/daylight savings, half-hour, and quarter-hour offsets properly.
 * @param {string} tz - IANA timezone
 * @returns {string} e.g. "UTC+05:30", "UTC-04:00"
 */
export function getUtcOffset(timeZone) {
  try {
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone }));
    const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const diffMinutes = Math.round((tzDate - utcDate) / 60000);
    const sign = diffMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(diffMinutes);
    const hours = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mins = String(absMin % 60).padStart(2, '0');
    return `UTC${sign}${hours}:${mins}`;
  } catch {
    return 'UTC+00:00';
  }
}

/**
 * Return structured timezone information for display
 * @param {string} tz - IANA timezone
 */
export function getTimezoneInfo(tz) {
  const found = TIMEZONES.find((item) => item.value === tz);
  const offset = getUtcOffset(tz || 'Asia/Kolkata');

  if (found) {
    return {
      iana: found.value,
      name: found.name,
      location: found.location,
      offset,
      shortCity: found.shortCity,
      display: `${found.name} (${offset})`,
      subtitle: `${found.location} · ${offset}`,
    };
  }

  // Fallback for custom or unlisted IANA string
  const parts = (tz || 'UTC').split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  return {
    iana: tz || 'UTC',
    name: city || 'UTC',
    location: parts[0] || 'Global',
    offset,
    shortCity: city || 'UTC',
    display: `${city} (${offset})`,
    subtitle: `${parts[0] || 'Global'} · ${offset}`,
  };
}

/**
 * Format friendly timezone string for inputs and modals
 * e.g. "India Standard Time (UTC+05:30)" or "Dubai (UTC+04:00)"
 */
export function formatFriendlyTimezone(tz) {
  const info = getTimezoneInfo(tz);
  return info.display;
}

/**
 * Returns short representation for reminder cards
 * e.g. "India time", "Dubai time", "London time", "UTC"
 */
export function getCityOrShortTz(tz) {
  if (!tz || tz === 'UTC') return 'UTC';
  const info = getTimezoneInfo(tz);
  if (info.shortCity === 'India') return 'India time';
  return `${info.shortCity} time`;
}

/**
 * Converts 24-hour time "20:00" to friendly 12-hour "8:00 PM"
 */
export function formatReminderTime(timeStr) {
  if (!timeStr) return '';
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12;
  return `${h}:${m} ${ampm}`;
}

/**
 * Detect client browser timezone with fallback
 * @returns {string}
 */
export const detectBrowserTimezone = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Disallow obsolete Asia/Calcutta
    if (tz === 'Asia/Calcutta') return 'Asia/Kolkata';
    return tz || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};

/**
 * Format live time preview in a given timezone
 */
export const getTimePreview = (tz) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
  } catch {
    return '';
  }
};

/**
 * Legacy list kept for compatibility with any existing components
 */
export const TIMEZONE_OPTIONS = TIMEZONES.map((tz) => {
  const offset = getUtcOffset(tz.value);
  return {
    value: tz.value,
    label: `${tz.name} (${tz.location} · ${offset})`,
  };
});
