const { z } = require('zod');

const EvidenceTypeEnum = z.enum([
  'GITHUB_REPOSITORY',
  'LIVE_DEMO',
  'SCREENSHOT',
  'DESIGN_FILE',
  'CAD_FILE',
  'DOCUMENT',
  'CERTIFICATE',
  'ARTICLE',
  'PRESENTATION',
  'VIDEO',
  'ASSESSMENT',
  'CUSTOMER_FEEDBACK',
  'WORK_SAMPLE',
  'OTHER',
]);

const optionalUrl = z.string().trim().url().optional().or(z.literal('')).or(z.null());

const createEvidenceSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(255),
  description: z.string().trim().optional().nullable(),
  evidenceType: EvidenceTypeEnum.optional().default('OTHER'),
  url: optionalUrl,
  fileName: z.string().trim().optional().nullable(),
  externalReference: z.string().trim().optional().nullable(),
  projectId: z.string().uuid().optional().nullable().or(z.literal('')),
  projectMilestoneId: z.string().uuid().optional().nullable().or(z.literal('')),
  learningModuleId: z.string().uuid().optional().nullable().or(z.literal('')),
  skillIds: z.array(z.string().uuid()).optional(),
  skills: z.array(z.object({
    skillId: z.string().uuid(),
    notes: z.string().optional().nullable(),
  })).optional(),
});

const updateEvidenceSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional().nullable(),
  evidenceType: EvidenceTypeEnum.optional(),
  url: optionalUrl,
  fileName: z.string().trim().optional().nullable(),
  externalReference: z.string().trim().optional().nullable(),
  projectId: z.string().uuid().optional().nullable().or(z.literal('')),
  projectMilestoneId: z.string().uuid().optional().nullable().or(z.literal('')),
  learningModuleId: z.string().uuid().optional().nullable().or(z.literal('')),
});

const linkEvidenceSkillSchema = z.object({
  skillId: z.string().uuid(),
  notes: z.string().trim().optional().nullable(),
});

const assessSkillFromEvidenceSchema = z.object({
  skillId: z.string().uuid(),
  newLevel: z.coerce.number().int().min(1).max(5),
  notes: z.string().trim().optional().nullable(),
  evidenceText: z.string().trim().optional().nullable(),
});

const evidenceQuerySchema = z.object({
  projectId: z.string().optional(),
  projectMilestoneId: z.string().optional(),
  learningModuleId: z.string().optional(),
  skillId: z.string().optional(),
  type: z.string().optional(),
  evidenceType: z.string().optional(),
  search: z.string().optional(),
});

module.exports = {
  EvidenceTypeEnum,
  createEvidenceSchema,
  updateEvidenceSchema,
  linkEvidenceSkillSchema,
  assessSkillFromEvidenceSchema,
  evidenceQuerySchema,
};
