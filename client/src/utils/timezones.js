/**
 * CareerOS Client Timezone Utilities
 * Standard IANA timezones formatted with offsets and user-friendly labels.
 */

export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, UTC+05:30) - India' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT, UTC-05:00) - Eastern Time' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT, UTC-06:00) - Central Time' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT, UTC-07:00) - Mountain Time' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT, UTC-08:00) - Pacific Time' },
  { value: 'America/Anchorage', label: 'America/Anchorage (AKST, UTC-09:00) - Alaska' },
  { value: 'Pacific/Honolulu', label: 'Pacific/Honolulu (HST, UTC-10:00) - Hawaii' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST, UTC+00:00) - London' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST, UTC+01:00) - Paris, Rome' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST, UTC+01:00) - Berlin, Amsterdam' },
  { value: 'Europe/Athens', label: 'Europe/Athens (EET/EEST, UTC+02:00) - Athens' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST, UTC+04:00) - Dubai' },
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT, UTC+05:00) - Pakistan' },
  { value: 'Asia/Dhaka', label: 'Asia/Dhaka (BST, UTC+06:00) - Bangladesh' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok (ICT, UTC+07:00) - Bangkok, Jakarta' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, UTC+08:00) - Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (HKT, UTC+08:00) - Hong Kong' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, UTC+09:00) - Tokyo' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul (KST, UTC+09:00) - Seoul' },
  { value: 'Australia/Perth', label: 'Australia/Perth (AWST, UTC+08:00) - Perth' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT, UTC+10:00) - Sydney, Melbourne' },
  { value: 'Pacific/Auckland', label: 'Pacific/Auckland (NZST/NZDT, UTC+12:00) - Auckland' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time, UTC+00:00)' },
];

/**
 * Format live time string for a given IANA timezone
 * @param {string} tz - IANA timezone
 * @returns {string}
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
 * Detect client browser timezone with fallback
 * @returns {string}
 */
export const detectBrowserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  } catch {
    return 'Asia/Kolkata';
  }
};
