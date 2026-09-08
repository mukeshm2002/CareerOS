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

const NotificationChannelEnum = z.enum(['IN_APP', 'EMAIL', 'PUSH']);

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createReminderSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  message: z.string().trim().optional().nullable(),
  type: ReminderTypeEnum.optional().default('DAILY_CAREEROS_REVIEW'),
  time: z.string().regex(timeRegex, 'Time must be in HH:mm format (24h)').default('20:00'),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
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
  linkedTaskId: z.string().uuid().optional().nullable(),
  linkedGoalId: z.string().uuid().optional().nullable(),
  linkedJobOpportunityId: z.string().uuid().optional().nullable(),
  linkedFreelanceOpportunityId: z.string().uuid().optional().nullable(),
  linkedInternshipOpportunityId: z.string().uuid().optional().nullable(),
});

const updateReminderSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  message: z.string().trim().optional().nullable(),
  type: ReminderTypeEnum.optional(),
  time: z.string().regex(timeRegex, 'Time must be in HH:mm format (24h)').optional(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
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
  linkedTaskId: z.string().uuid().optional().nullable(),
  linkedGoalId: z.string().uuid().optional().nullable(),
  linkedJobOpportunityId: z.string().uuid().optional().nullable(),
  linkedFreelanceOpportunityId: z.string().uuid().optional().nullable(),
  linkedInternshipOpportunityId: z.string().uuid().optional().nullable(),
});

module.exports = {
  createReminderSchema,
  updateReminderSchema,
  ReminderTypeEnum,
};
