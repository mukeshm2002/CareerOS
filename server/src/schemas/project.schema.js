const { z } = require('zod');

const ProjectTypeEnum = z.enum([
  'PERSONAL',
  'LEARNING',
  'PORTFOLIO',
  'FREELANCE',
  'INTERNSHIP',
  'WORK',
  'OPEN_SOURCE',
  'ACADEMIC',
  'CASE_STUDY',
  'OTHER',
]);

const ProjectStatusEnum = z.enum([
  'IDEA',
  'PLANNING',
  'BUILDING',
  'TESTING',
  'COMPLETED',
  'ARCHIVED',
  'PLANNED',
  'IN_PROGRESS',
  'BLOCKED',
]);

const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']);

const ProjectMilestoneStatusEnum = z.enum([
  'TODO',
  'IN_PROGRESS',
  'COMPLETED',
  'SKIPPED',
]);

const optionalUrl = z.string().trim().url().optional().or(z.literal('')).or(z.null());
const optionalDate = z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).or(z.null());

const createProjectSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().optional().nullable(),
  projectType: ProjectTypeEnum.optional().default('PERSONAL'),
  status: ProjectStatusEnum.optional().default('IDEA'),
  priority: PriorityEnum.optional().default('MEDIUM'),
  problemStatement: z.string().trim().optional().nullable(),
  objective: z.string().trim().optional().nullable(),
  goalId: z.string().uuid().optional().nullable().or(z.literal('')),
  startDate: optionalDate,
  targetDate: optionalDate,
  repositoryUrl: optionalUrl,
  liveUrl: optionalUrl,
  demoUrl: optionalUrl,
  caseStudyUrl: optionalUrl,
  isPortfolioVisible: z.boolean().optional().default(false),
  skillIds: z.array(z.string().uuid()).optional(),
  skills: z.array(z.object({
    skillId: z.string().uuid(),
    usageLevel: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })).optional(),
});

const updateProjectSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  projectType: ProjectTypeEnum.optional(),
  status: ProjectStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  problemStatement: z.string().trim().optional().nullable(),
  objective: z.string().trim().optional().nullable(),
  goalId: z.string().uuid().optional().nullable().or(z.literal('')),
  startDate: optionalDate,
  targetDate: optionalDate,
  completedAt: optionalDate,
  repositoryUrl: optionalUrl,
  liveUrl: optionalUrl,
  demoUrl: optionalUrl,
  caseStudyUrl: optionalUrl,
  isPortfolioVisible: z.boolean().optional(),
});

const updateProjectStatusSchema = z.object({
  status: ProjectStatusEnum,
});

const togglePortfolioSchema = z.object({
  isPortfolioVisible: z.boolean().optional(),
});

const projectQuerySchema = z.object({
  status: z.string().optional(),
  projectType: z.string().optional(),
  goalId: z.string().optional(),
  skillId: z.string().optional(),
  portfolio: z.union([z.string(), z.boolean()]).optional(),
  archived: z.union([z.string(), z.boolean()]).optional(),
  search: z.string().optional(),
});

const createMilestoneSchema = z.object({
  title: z.string().trim().min(1, 'Milestone title is required').max(255),
  description: z.string().trim().optional().nullable(),
  status: ProjectMilestoneStatusEnum.optional().default('TODO'),
  targetDate: optionalDate,
  order: z.coerce.number().int().optional().default(1),
});

const updateMilestoneSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  status: ProjectMilestoneStatusEnum.optional(),
  targetDate: optionalDate,
  order: z.coerce.number().int().optional(),
});

const updateMilestoneStatusSchema = z.object({
  status: ProjectMilestoneStatusEnum,
});

const addProjectSkillSchema = z.object({
  skillId: z.string().uuid(),
  usageLevel: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const createMilestoneTaskSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  priority: PriorityEnum.optional().default('MEDIUM'),
  estimatedMinutes: z.coerce.number().int().positive().optional().default(30),
  dueDate: optionalDate,
});

module.exports = {
  ProjectTypeEnum,
  ProjectStatusEnum,
  PriorityEnum,
  ProjectMilestoneStatusEnum,
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  togglePortfolioSchema,
  projectQuerySchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  updateMilestoneStatusSchema,
  addProjectSkillSchema,
  createMilestoneTaskSchema,
};
