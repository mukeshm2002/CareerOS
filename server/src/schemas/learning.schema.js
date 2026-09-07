const { z } = require('zod');

const LearningPathStatusEnum = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'PAUSED',
  'ARCHIVED',
]);

const LearningModuleTypeEnum = z.enum([
  'READ',
  'WATCH',
  'PRACTICE',
  'BUILD',
  'ASSESSMENT',
  'PROJECT',
  'OTHER',
]);

const LearningModuleStatusEnum = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
]);

const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']);

const optionalUrl = z.string().trim().url().optional().or(z.literal('')).or(z.null());
const optionalDate = z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).or(z.null());

const createLearningPathSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().optional().nullable(),
  goalId: z.string().uuid().optional().nullable().or(z.literal('')),
  skillId: z.string().uuid().optional().nullable().or(z.literal('')),
  provider: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  estimatedHours: z.coerce.number().positive().optional().default(10.0),
  targetDate: optionalDate,
  status: LearningPathStatusEnum.optional().default('NOT_STARTED'),
});

const updateLearningPathSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  goalId: z.string().uuid().optional().nullable().or(z.literal('')),
  skillId: z.string().uuid().optional().nullable().or(z.literal('')),
  provider: z.string().trim().optional().nullable(),
  category: z.string().trim().optional().nullable(),
  estimatedHours: z.coerce.number().positive().optional(),
  targetDate: optionalDate,
  status: LearningPathStatusEnum.optional(),
});

const updateLearningPathStatusSchema = z.object({
  status: LearningPathStatusEnum,
});

const learningPathQuerySchema = z.object({
  status: z.string().optional(),
  goalId: z.string().optional(),
  skillId: z.string().optional(),
  archived: z.union([z.string(), z.boolean()]).optional(),
  search: z.string().optional(),
});

const createLearningModuleSchema = z.object({
  title: z.string().trim().min(1, 'Module title is required').max(255),
  description: z.string().trim().optional().nullable(),
  moduleType: LearningModuleTypeEnum.optional().default('READ'),
  status: LearningModuleStatusEnum.optional().default('NOT_STARTED'),
  estimatedMinutes: z.coerce.number().int().positive().optional().default(30),
  order: z.coerce.number().int().optional().default(1),
  resourceUrl: optionalUrl,
  notes: z.string().trim().optional().nullable(),
});

const updateLearningModuleSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  moduleType: LearningModuleTypeEnum.optional(),
  status: LearningModuleStatusEnum.optional(),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  order: z.coerce.number().int().optional(),
  resourceUrl: optionalUrl,
  notes: z.string().trim().optional().nullable(),
});

const updateLearningModuleStatusSchema = z.object({
  status: LearningModuleStatusEnum,
});

const createModuleTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  priority: PriorityEnum.optional().default('MEDIUM'),
  estimatedMinutes: z.coerce.number().int().positive().optional().default(30),
  dueDate: optionalDate,
});

const createProjectFromLearningSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().optional().nullable(),
  goalId: z.string().uuid().optional().nullable().or(z.literal('')),
});

module.exports = {
  LearningPathStatusEnum,
  LearningModuleTypeEnum,
  LearningModuleStatusEnum,
  createLearningPathSchema,
  updateLearningPathSchema,
  updateLearningPathStatusSchema,
  learningPathQuerySchema,
  createLearningModuleSchema,
  updateLearningModuleSchema,
  updateLearningModuleStatusSchema,
  createModuleTaskSchema,
  createProjectFromLearningSchema,
};
