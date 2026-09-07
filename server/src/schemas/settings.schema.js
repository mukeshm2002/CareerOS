const { z } = require('zod');

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidIanaTimezone = (tz) => {
  if (!tz) return true;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1).max(255).optional(),
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable(),
  displayName: z.string().trim().max(100).optional().nullable(),
  currentRole: z.string().trim().max(150).optional().nullable(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  experienceLevel: z.enum([
    'BEGINNER',
    'ENTRY_LEVEL',
    'JUNIOR',
    'MID_LEVEL',
    'SENIOR',
    'LEAD',
    'MANAGER',
    'OTHER',
  ]).optional(),
  currentSituation: z.enum([
    'STUDENT',
    'FRESHER',
    'WORKING_PROFESSIONAL',
    'FREELANCER',
    'CAREER_BREAK',
    'CAREER_SWITCHER',
    'ENTREPRENEUR',
    'OTHER',
  ]).optional(),
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isValidIanaTimezone, { message: 'Must be a valid IANA timezone' })
    .optional(),
  country: z.string().trim().max(100).optional().nullable(),
  bio: z.string().trim().max(2000).optional().nullable(),
});

const updatePreferencesSchema = z.object({
  defaultFocusMinutes: z.number().int().min(5).max(240).optional(),
  weeklyCareerMinutesTarget: z.number().int().min(0).max(10000).optional(),
  preferredDays: z.string().trim().max(100).optional().nullable(),
  preferredStartTime: z.string().regex(timeRegex).optional().nullable(),
  preferredEndTime: z.string().regex(timeRegex).optional().nullable(),
  defaultCurrency: z.string().trim().max(10).optional(),
  defaultOpportunityPriority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  theme: z.enum(['LIGHT', 'DARK', 'SYSTEM']).optional(),
});

const updateNotificationPreferencesSchema = z.object({
  emailNotificationsEnabled: z.boolean().optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
  dailyReviewReminderEnabled: z.boolean().optional(),
  dailyReviewReminderTime: z.string().regex(timeRegex).optional().nullable(),
  careerReviewReminderEnabled: z.boolean().optional(),
  careerReviewReminderTime: z.string().regex(timeRegex).optional().nullable(),
  weeklyReviewReminderEnabled: z.boolean().optional(),
  weeklyReviewDay: z.number().int().min(0).max(6).optional().nullable(),
  weeklyReviewTime: z.string().regex(timeRegex).optional().nullable(),
  opportunityFollowUpReminderEnabled: z.boolean().optional(),
  taskDueReminderEnabled: z.boolean().optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

module.exports = {
  updateProfileSchema,
  updatePreferencesSchema,
  updateNotificationPreferencesSchema,
  changePasswordSchema,
};
