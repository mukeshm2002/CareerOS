const { z } = require('zod');
const { isValidIanaTimezone } = require('../utils/timezone');

const ReminderTypeEnum = z.enum([
  'DAILY_CAREEROS_REVIEW',
  'DAILY_CAREER_REVIEW',
  'DAILY_SHUTDOWN',
  'WEEKLY_CAREER_REVIEW',
  'WEEKLY_REVIEW',
  'TASK_DUE',
  'OPPORTUNITY_FOLLOW_UP',
  'INTERVIEW',
  'FREELANCE_FOLLOW_UP',
  'CUSTOM',
]);

const NotificationChannelEnum = z.enum(['IN_APP', 'EMAIL', 'PUSH', 'VOICE']);

const ReminderStatusEnum = z.enum([
  'PENDING',
  'PROCESSING',
  'SENT',
  'DELIVERED',
  'ANSWERED',
  'MISSED',
  'FAILED',
  'SNOOZED',
  'CANCELLED',
]);

const ReminderSourceTypeEnum = z.enum([
  'TASK',
  'SCHEDULE',
  'GOAL',
  'HEALTH',
  'COMMUNICATION',
  'CUSTOM',
]);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  message: z.string().trim().optional().nullable(),
  type: ReminderTypeEnum.optional().default('CUSTOM'),
  sourceType: ReminderSourceTypeEnum.optional().default('CUSTOM'),
  sourceId: z.string().optional().nullable(),
  time: z.string().regex(timeRegex, 'Time must be in HH:mm format (24h)').optional().default('20:00'),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  scheduledAt: z.union([z.string().datetime(), z.string(), z.date()]).optional().nullable(),
  scheduledFor: z.union([z.string().datetime(), z.string(), z.date()]).optional().nullable(),
  offsetMinutes: z.number().int().min(0).max(10080).optional().default(0),
  timezone: z
    .string()
    .trim()
    .max(100)
    .refine(isValidIanaTimezone, { message: 'Must be a valid IANA timezone' })
    .optional()
    .nullable(),
  recurrence: z.enum(['DAILY', 'WEEKLY', 'ONCE', 'CUSTOM']).optional().default('DAILY'),
  enabled: z.boolean().optional().default(true),
  channel: NotificationChannelEnum.optional().default('IN_APP'),
  notificationChannel: NotificationChannelEnum.optional(),
  fallbackToInApp: z.boolean().optional().default(true),
  linkedTaskId: z.string().uuid().optional().nullable(),
  linkedScheduleBlockId: z.string().uuid().optional().nullable(),
  linkedGoalId: z.string().uuid().optional().nullable(),
  linkedJobOpportunityId: z.string().uuid().optional().nullable(),
  linkedFreelanceOpportunityId: z.string().uuid().optional().nullable(),
  linkedInternshipOpportunityId: z.string().uuid().optional().nullable(),
  phoneContactId: z.string().uuid().optional().nullable(),
});

const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().optional().nullable(),
  type: ReminderTypeEnum.optional(),
  sourceType: ReminderSourceTypeEnum.optional(),
  sourceId: z.string().optional().nullable(),
  status: ReminderStatusEnum.optional(),
  time: z.string().regex(timeRegex, 'Time must be in HH:mm format (24h)').optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  scheduledAt: z.union([z.string().datetime(), z.string(), z.date()]).optional().nullable(),
  scheduledFor: z.union([z.string().datetime(), z.string(), z.date()]).optional().nullable(),
  offsetMinutes: z.number().int().min(0).max(10080).optional(),
  timezone: z
    .string()
    .trim()
    .max(100)
    .refine(isValidIanaTimezone, { message: 'Must be a valid IANA timezone' })
    .optional()
    .nullable(),
  recurrence: z.enum(['DAILY', 'WEEKLY', 'ONCE', 'CUSTOM']).optional(),
  enabled: z.boolean().optional(),
  channel: NotificationChannelEnum.optional(),
  notificationChannel: NotificationChannelEnum.optional(),
  fallbackToInApp: z.boolean().optional(),
  linkedTaskId: z.string().uuid().optional().nullable(),
  linkedScheduleBlockId: z.string().uuid().optional().nullable(),
  linkedGoalId: z.string().uuid().optional().nullable(),
  linkedJobOpportunityId: z.string().uuid().optional().nullable(),
  linkedFreelanceOpportunityId: z.string().uuid().optional().nullable(),
  linkedInternshipOpportunityId: z.string().uuid().optional().nullable(),
  phoneContactId: z.string().uuid().optional().nullable(),
});

const snoozeReminderSchema = z.object({
  minutes: z.number().int().min(1).max(10080).default(10),
});

const updateReminderSettingsSchema = z.object({
  defaultTaskReminderOffset: z.number().int().min(0).max(10080).optional(),
  defaultScheduleReminderOffset: z.number().int().min(0).max(10080).optional(),
  voiceRemindersEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(timeRegex).optional(),
  quietHoursEnd: z.string().regex(timeRegex).optional(),
  fallbackNotificationEnabled: z.boolean().optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
});

module.exports = {
  createReminderSchema,
  updateReminderSchema,
  snoozeReminderSchema,
  updateReminderSettingsSchema,
  ReminderTypeEnum,
  NotificationChannelEnum,
  ReminderStatusEnum,
  ReminderSourceTypeEnum,
};
