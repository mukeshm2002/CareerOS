const { z } = require('zod');

const dateStringRegex = /^\d{4}-\d{2}-\d{2}$/;

// Today & Daily Plan
const dateQuerySchema = z.object({
  date: z.string().regex(dateStringRegex, 'Date must be formatted YYYY-MM-DD').optional(),
});

const savePlanSchema = z.object({
  date: z.string().regex(dateStringRegex, 'Date must be formatted YYYY-MM-DD').optional(),
  mainTaskId: z.string().uuid('mainTaskId must be a valid UUID').optional().nullable(),
  secondaryTaskIds: z.array(z.string().uuid('secondaryTaskId must be a valid UUID')).max(3, 'Maximum 3 secondary tasks allowed').optional(),
  plannedMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  recommendationReason: z.string().max(1000).optional().nullable(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']).optional(),
});

const confirmPlanSchema = z.object({
  date: z.string().regex(dateStringRegex, 'Date must be formatted YYYY-MM-DD').optional(),
  mainTaskId: z.string().uuid('mainTaskId must be a valid UUID').optional(),
  plannedMinutes: z.number().int().min(0).max(1440).optional().nullable(),
});

const closePlanSchema = z.object({
  date: z.string().regex(dateStringRegex, 'Date must be formatted YYYY-MM-DD').optional(),
});

// Focus Sessions
const startFocusSchema = z.object({
  taskId: z.string().uuid('taskId must be a valid UUID').optional().nullable(),
  dailyPlanId: z.string().uuid('dailyPlanId must be a valid UUID').optional().nullable(),
  plannedMinutes: z.number().int().min(1).max(480).optional(),
  startedAt: z.string().datetime().optional(),
});

const pauseFocusSchema = z.object({
  pauseTimestamp: z.string().datetime().optional(),
});

const resumeFocusSchema = z.object({
  resumeTimestamp: z.string().datetime().optional(),
});

const finishFocusSchema = z.object({
  taskOutcome: z.enum(['COMPLETED', 'NOT_YET', 'BLOCKED']).default('NOT_YET'),
  notes: z.string().max(2000).optional().nullable(),
  endedAt: z.string().datetime().optional(),
  actualMinutes: z.number().int().min(0).optional(),
});

// Daily Review
const saveReviewSchema = z.object({
  date: z.string().regex(dateStringRegex, 'Date must be formatted YYYY-MM-DD').optional(),
  completedSummary: z.string().max(2000).optional().nullable(),
  learnedSummary: z.string().max(2000).optional().nullable(),
  blockerSummary: z.string().max(2000).optional().nullable(),
  tomorrowMainTaskId: z.string().uuid('tomorrowMainTaskId must be a valid UUID').optional().nullable(),
  tomorrowMainTask: z.string().max(300).optional().nullable(),
  energyLevel: z.enum(['VERY_LOW', 'LOW', 'OKAY', 'GOOD', 'HIGH']).optional().nullable(),
  mood: z.string().max(100).optional().nullable(),
  notes: z.string().max(3000).optional().nullable(),
  closeDay: z.boolean().optional(),
});

module.exports = {
  dateQuerySchema,
  savePlanSchema,
  confirmPlanSchema,
  closePlanSchema,
  startFocusSchema,
  pauseFocusSchema,
  resumeFocusSchema,
  finishFocusSchema,
  saveReviewSchema,
};
