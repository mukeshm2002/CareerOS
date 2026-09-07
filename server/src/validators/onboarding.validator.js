const { z } = require('zod');
const { careerStageEnum, experienceLevelEnum } = require('./user.validator');

const goalTypeEnum = z.enum([
  'FIRST_JOB',
  'JOB_SWITCH',
  'SALARY_GROWTH',
  'PROMOTION',
  'FREELANCING',
  'CAREER_CHANGE',
  'SKILL_MASTERY',
  'CERTIFICATION',
  'PORTFOLIO',
  'BUSINESS',
  'CUSTOM',
]);

const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT']);

const updateOnboardingProfileSchema = z.object({
  currentSituation: careerStageEnum.optional().nullable(),
  currentRole: z.string().trim().max(150).optional().nullable(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  experienceLevel: experienceLevelEnum.optional().nullable(),
  timezone: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  wakeTime: z.string().trim().max(20).optional().nullable(),
  workStartTime: z.string().trim().max(20).optional().nullable(),
  workEndTime: z.string().trim().max(20).optional().nullable(),
  personalStartTime: z.string().trim().max(20).optional().nullable(),
  personalEndTime: z.string().trim().max(20).optional().nullable(),
  sleepTime: z.string().trim().max(20).optional().nullable(),
  availableCareerMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  careerMission: z.string().trim().max(2000).optional().nullable(),
  onboardingDraft: z.any().optional().nullable(),
});

const updateOnboardingProgressSchema = z.object({
  step: z.number().int().min(1).max(7),
});

const onboardingGoalInputSchema = z.object({
  title: z.string().trim().min(2, { message: 'Goal title is required' }).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  type: goalTypeEnum.default('JOB_SWITCH'),
  priority: priorityEnum.default('HIGH'),
  targetDate: z.string().optional().nullable(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  salaryCurrency: z.string().trim().max(10).default('USD'),
});

const onboardingSkillInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.enum(['TECHNICAL', 'PROFESSIONAL', 'COMMUNICATION', 'DOMAIN', 'TOOLS', 'OTHER']).default('TECHNICAL'),
  selfRating: z.number().int().min(1).max(5).default(3),
});

const completeOnboardingSchema = z.object({
  situation: careerStageEnum.default('WORKING_PROFESSIONAL'),
  currentRole: z.string().trim().max(150).optional().nullable(),
  targetRole: z.string().trim().max(150).optional().nullable(),
  targetSalary: z.string().trim().max(100).optional().nullable(),
  experienceLevel: experienceLevelEnum.default('MID_LEVEL'),
  timezone: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  wakeTime: z.string().trim().max(20).optional().nullable(),
  workStartTime: z.string().trim().max(20).optional().nullable(),
  workEndTime: z.string().trim().max(20).optional().nullable(),
  personalStartTime: z.string().trim().max(20).optional().nullable(),
  personalEndTime: z.string().trim().max(20).optional().nullable(),
  sleepTime: z.string().trim().max(20).optional().nullable(),
  availableCareerMinutes: z.number().int().min(0).max(1440).default(140),
  careerMission: z.string().trim().max(1000).optional().nullable(),
  goals: z.array(onboardingGoalInputSchema).min(1, { message: 'At least one career goal is required' }),
  skills: z.array(onboardingSkillInputSchema).optional(),
});

module.exports = {
  goalTypeEnum,
  priorityEnum,
  updateOnboardingProfileSchema,
  updateOnboardingProgressSchema,
  completeOnboardingSchema,
};
