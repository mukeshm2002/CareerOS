const { z } = require('zod');

const careerStageEnum = z.enum([
  'STUDENT',
  'FRESHER',
  'WORKING_PROFESSIONAL',
  'FREELANCER',
  'CAREER_BREAK',
  'CAREER_SWITCHER',
  'ENTREPRENEUR',
  'OTHER',
]);

const experienceLevelEnum = z.enum([
  'BEGINNER',
  'ENTRY_LEVEL',
  'JUNIOR',
  'MID_LEVEL',
  'SENIOR',
  'LEAD',
  'MANAGER',
  'OTHER',
]);

const updateProfileSchema = z.object({
  firstName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().max(100).optional().nullable(),
  displayName: z.string().trim().max(100).optional().nullable(),
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
  bio: z.string().trim().max(2000).optional().nullable(),
});

module.exports = {
  careerStageEnum,
  experienceLevelEnum,
  updateProfileSchema,
};
