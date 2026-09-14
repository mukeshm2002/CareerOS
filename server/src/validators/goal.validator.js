const { z } = require('zod');
const { goalTypeEnum, priorityEnum, growthAreaEnum } = require('./onboarding.validator');

const goalStatusEnum = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);

const createGoalSchema = z.object({
  title: z.string().trim().min(2, { message: 'Goal title must be at least 2 characters' }).max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  type: goalTypeEnum.default('JOB_SWITCH'),
  priority: priorityEnum.default('HIGH'),
  growthArea: growthAreaEnum.default('CAREER'),
  metadata: z.record(z.any()).optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).default('USD'),
  notes: z.string().trim().max(2000).optional().nullable(),
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
});

const updateGoalSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  type: goalTypeEnum.optional(),
  priority: priorityEnum.optional(),
  growthArea: growthAreaEnum.optional(),
  metadata: z.record(z.any()).optional().nullable(),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  status: goalStatusEnum.optional(),
  progress: z.number().int().min(0).max(100).optional(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
});

const updateGoalStatusSchema = z.object({
  status: goalStatusEnum,
});

module.exports = {
  goalStatusEnum,
  createGoalSchema,
  updateGoalSchema,
  updateGoalStatusSchema,
};
