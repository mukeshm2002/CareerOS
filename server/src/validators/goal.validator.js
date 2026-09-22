const { z } = require('zod');
const { goalTypeEnum, priorityEnum, growthAreaEnum } = require('./onboarding.validator');

const goalStatusEnum = z.enum([
  'PLANNED',
  'DRAFT',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'ABANDONED',
  'ARCHIVED',
]);

const goalAreaEnum = z.enum([
  'CAREER',
  'EDUCATION',
  'SKILLS',
  'LEARNING',
  'COMMUNICATION',
  'HEALTH_AND_FITNESS',
  'HEALTH',
  'FINANCE',
  'PERSONAL_GROWTH',
  'PERSONAL',
  'RELATIONSHIPS',
  'BUSINESS',
  'CREATIVE',
  'LIFESTYLE',
  'OTHER',
]);

const trackingMethodEnum = z.enum([
  'MILESTONES',
  'TASKS',
  'NUMBER_TARGET',
  'ROUTINE',
  'MANUAL',
]);

const goalConfidenceEnum = z.enum(['ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK']);

const createGoalSchema = z.object({
  title: z.string().trim().min(2, { message: 'Goal title must be at least 2 characters' }).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  desiredOutcome: z.string().trim().max(2000).optional().nullable(),
  area: goalAreaEnum.optional().default('CAREER'),
  customArea: z.string().trim().max(100).optional().nullable(),
  growthArea: growthAreaEnum.optional(),
  type: goalTypeEnum.optional().default('CUSTOM'),
  priority: priorityEnum.optional().default('MEDIUM'),
  status: goalStatusEnum.optional().default('ACTIVE'),
  trackingMethod: trackingMethodEnum.optional().default('MILESTONES'),

  // Conditional numeric tracking fields
  startValue: z.number().optional().default(0),
  currentValue: z.number().optional().default(0),
  targetValue: z.number().optional().nullable(),
  unit: z.string().trim().max(50).optional().nullable(),

  // Conditional routine tracking fields
  routineFrequency: z.number().int().min(1).optional().nullable(),
  routinePeriod: z.enum(['DAY', 'WEEK', 'MONTH']).optional().nullable(),

  // Conditional manual tracking fields
  manualProgress: z.number().int().min(0).max(100).optional().default(0),

  // Dates
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),

  // Optional career fields (preserved for backwards compatibility)
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).optional().default('USD'),
  notes: z.string().trim().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),

  // Actionable Step 3 fields
  why: z.string().trim().max(2000).optional().nullable(),
  weeklyCommitment: z.union([z.number(), z.string()]).optional().nullable(),
  firstMilestone: z.string().trim().max(200).optional().nullable(),
  firstAction: z.string().trim().max(200).optional().nullable(),
  reminder: z.object({
    frequency: z.string().optional().nullable(),
    time: z.string().optional().nullable(),
    channel: z.string().optional().nullable(),
  }).optional().nullable(),
}).superRefine((data, ctx) => {
  // Validate customArea required if area is OTHER
  if (data.area === 'OTHER' && (!data.customArea || data.customArea.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom area name is required when area is Other',
      path: ['customArea'],
    });
  }

  // Validate targetValue and unit if NUMBER_TARGET
  if (data.trackingMethod === 'NUMBER_TARGET') {
    if (data.targetValue === undefined || data.targetValue === null || isNaN(data.targetValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Target value is required for Number/Target tracking',
        path: ['targetValue'],
      });
    }
    if (!data.unit || data.unit.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Unit is required for Number/Target tracking',
        path: ['unit'],
      });
    }
  }
});

const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  desiredOutcome: z.string().trim().max(2000).optional().nullable(),
  area: goalAreaEnum.optional(),
  customArea: z.string().trim().max(100).optional().nullable(),
  growthArea: growthAreaEnum.optional(),
  type: goalTypeEnum.optional(),
  priority: priorityEnum.optional(),
  status: goalStatusEnum.optional(),
  trackingMethod: trackingMethodEnum.optional(),
  progress: z.number().int().min(0).max(100).optional(),

  // Numeric tracking
  startValue: z.number().optional().nullable(),
  currentValue: z.number().optional().nullable(),
  targetValue: z.number().optional().nullable(),
  unit: z.string().trim().max(50).optional().nullable(),

  // Routine tracking
  routineFrequency: z.number().int().min(1).optional().nullable(),
  routinePeriod: z.enum(['DAY', 'WEEK', 'MONTH']).optional().nullable(),

  // Manual tracking
  manualProgress: z.number().int().min(0).max(100).optional(),

  // Dates
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),

  // Career fields
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
});

const updateGoalStatusSchema = z.object({
  status: goalStatusEnum,
  pauseReason: z.string().trim().max(1000).optional().nullable(),
  resumeDate: z.string().optional().nullable(),
  abandonReason: z.string().trim().max(1000).optional().nullable(),
  reflection: z.string().trim().max(2000).optional().nullable(),
  learnings: z.string().trim().max(2000).optional().nullable(),
});

const updateGoalProgressSchema = z.object({
  currentValue: z.number().optional().nullable(),
  manualProgress: z.number().int().min(0).max(100).optional(),
});

const successCriterionSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(300),
  sortOrder: z.number().int().optional(),
});

const goalCheckInSchema = z.object({
  confidence: goalConfidenceEnum.default('ON_TRACK'),
  whatIsGoingWell: z.string().trim().max(2000).optional().nullable(),
  whatIsGettingInWay: z.string().trim().max(2000).optional().nullable(),
  planAdjustments: z.string().trim().max(2000).optional().nullable(),
});

module.exports = {
  goalStatusEnum,
  goalAreaEnum,
  trackingMethodEnum,
  goalConfidenceEnum,
  createGoalSchema,
  updateGoalSchema,
  updateGoalStatusSchema,
  updateGoalProgressSchema,
  successCriterionSchema,
  goalCheckInSchema,
};
