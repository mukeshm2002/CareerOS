const { z } = require('zod');

const JobStageEnum = z.enum([
  'SAVED',
  'PREPARING',
  'APPLIED',
  'SCREENING',
  'ASSESSMENT',
  'INTERVIEW',
  'FINAL_INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'ARCHIVED',
]);

const FreelanceStageEnum = z.enum([
  'LEAD',
  'RESEARCHING',
  'CONTACTED',
  'DISCOVERY',
  'MEETING',
  'PROPOSAL_PREPARATION',
  'PROPOSAL_SENT',
  'FOLLOW_UP',
  'NEGOTIATION',
  'WON',
  'IN_PROGRESS',
  'COMPLETED',
  'LOST',
  'ARCHIVED',
]);

const InternshipStageEnum = z.enum([
  'SAVED',
  'PREPARING',
  'APPLIED',
  'SCREENING',
  'ASSESSMENT',
  'INTERVIEW',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'ARCHIVED',
]);

const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']);
const WorkModeEnum = z.enum(['ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN']);
const EmploymentTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'OTHER']);

const OpportunityActivityTypeEnum = z.enum([
  'CREATED',
  'STATUS_CHANGED',
  'APPLICATION_SENT',
  'FOLLOW_UP',
  'CALL',
  'EMAIL',
  'ASSESSMENT',
  'INTERVIEW',
  'PROPOSAL_SENT',
  'MEETING',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'REJECTED',
  'WON',
  'LOST',
  'NOTE',
  'OTHER',
]);

const opportunityQuerySchema = z.object({
  status: z.string().optional(),
  goalId: z.string().uuid().optional(),
  priority: PriorityEnum.optional(),
  source: z.string().optional(),
  stale: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  followUpDue: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  archived: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['RECENT', 'NEXT_ACTION', 'PRIORITY', 'CREATED']).optional().default('RECENT'),
});

// Job Opportunity Schemas
const createJobOpportunitySchema = z.object({
  goalId: z.string().uuid().nullable().optional(),
  company: z.string().trim().min(1, 'Company is required').max(150),
  role: z.string().trim().min(1, 'Role is required').max(150),
  jobUrl: z.string().url().nullable().optional().or(z.literal('')),
  source: z.string().max(50).optional(),
  sourceLabel: z.string().max(100).optional(),
  location: z.string().max(150).optional(),
  workMode: WorkModeEnum.optional().default('UNKNOWN'),
  employmentType: EmploymentTypeEnum.optional().default('FULL_TIME'),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  salaryCurrency: z.string().max(10).optional().default('USD'),
  salaryRange: z.string().max(100).optional(),
  status: JobStageEnum.optional().default('SAVED'),
  priority: PriorityEnum.optional().default('MEDIUM'),
  savedDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  appliedDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  nextAction: z.string().max(255).optional(),
  nextActionDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().max(5000).optional(),
});

const updateJobOpportunitySchema = createJobOpportunitySchema.partial().extend({
  rejectionReason: z.string().max(500).optional(),
  offerSalary: z.number().int().nonnegative().nullable().optional(),
  offerCurrency: z.string().max(10).optional(),
  offerNotes: z.string().max(5000).optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

const updateJobStatusSchema = z.object({
  status: JobStageEnum,
  notes: z.string().max(2000).optional(),
  offerSalary: z.number().int().nonnegative().nullable().optional(),
  offerCurrency: z.string().max(10).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// Freelance Opportunity Schemas
const createFreelanceOpportunitySchema = z.object({
  goalId: z.string().uuid().nullable().optional(),
  clientName: z.string().trim().min(1, 'Client name is required').max(150),
  projectName: z.string().trim().min(1, 'Project name is required').max(200),
  source: z.string().max(50).optional(),
  sourceLabel: z.string().max(100).optional(),
  projectType: z.string().max(100).optional(),
  estimatedValue: z.string().max(100).optional(),
  estimatedAmount: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(10).optional().default('USD'),
  status: FreelanceStageEnum.optional().default('LEAD'),
  priority: PriorityEnum.optional().default('MEDIUM'),
  firstContactDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  proposalDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  nextAction: z.string().max(255).optional(),
  nextActionDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  expectedStartDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().max(5000).optional(),
});

const updateFreelanceOpportunitySchema = createFreelanceOpportunitySchema.partial().extend({
  actualStartDate: z.string().datetime().nullable().optional(),
  actualEndDate: z.string().datetime().nullable().optional(),
  agreedValue: z.number().nonnegative().nullable().optional(),
  lostReason: z.string().max(500).optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

const updateFreelanceStatusSchema = z.object({
  status: FreelanceStageEnum,
  notes: z.string().max(2000).optional(),
  agreedValue: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(10).optional(),
  lostReason: z.string().max(500).optional(),
  actualEndDate: z.string().datetime().nullable().optional(),
});

// Internship Opportunity Schemas
const createInternshipOpportunitySchema = z.object({
  goalId: z.string().uuid().nullable().optional(),
  company: z.string().trim().min(1, 'Company is required').max(150),
  role: z.string().trim().min(1, 'Role is required').max(150),
  internshipUrl: z.string().url().nullable().optional().or(z.literal('')),
  source: z.string().max(50).optional(),
  sourceLabel: z.string().max(100).optional(),
  location: z.string().max(150).optional(),
  workMode: WorkModeEnum.optional().default('UNKNOWN'),
  stipend: z.string().max(100).optional(),
  stipendMin: z.number().int().nonnegative().nullable().optional(),
  stipendMax: z.number().int().nonnegative().nullable().optional(),
  stipendCurrency: z.string().max(10).optional().default('USD'),
  status: InternshipStageEnum.optional().default('SAVED'),
  priority: PriorityEnum.optional().default('MEDIUM'),
  appliedDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  nextAction: z.string().max(255).optional(),
  nextActionDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  notes: z.string().max(5000).optional(),
});

const updateInternshipOpportunitySchema = createInternshipOpportunitySchema.partial().extend({
  rejectionReason: z.string().max(500).optional(),
  offerStipend: z.number().int().nonnegative().nullable().optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
});

const updateInternshipStatusSchema = z.object({
  status: InternshipStageEnum,
  notes: z.string().max(2000).optional(),
  offerStipend: z.number().int().nonnegative().nullable().optional(),
  rejectionReason: z.string().max(500).optional(),
});

// Activity Schema
const createActivitySchema = z.object({
  activityType: OpportunityActivityTypeEnum,
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  occurredAt: z.string().datetime().nullable().optional(),
});

// Create Task From Opportunity Schema
const createTaskFromOpportunitySchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().max(2000).optional(),
  priority: PriorityEnum.optional().default('MEDIUM'),
  dueDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()),
  estimatedMinutes: z.number().int().positive().optional().default(45),
  taskType: z.string().optional(),
});

module.exports = {
  JobStageEnum,
  FreelanceStageEnum,
  InternshipStageEnum,
  PriorityEnum,
  WorkModeEnum,
  EmploymentTypeEnum,
  OpportunityActivityTypeEnum,
  opportunityQuerySchema,
  createJobOpportunitySchema,
  updateJobOpportunitySchema,
  updateJobStatusSchema,
  createFreelanceOpportunitySchema,
  updateFreelanceOpportunitySchema,
  updateFreelanceStatusSchema,
  createInternshipOpportunitySchema,
  updateInternshipOpportunitySchema,
  updateInternshipStatusSchema,
  createActivitySchema,
  createTaskFromOpportunitySchema,
};
