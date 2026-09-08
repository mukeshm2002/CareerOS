const { z } = require('zod');

const upsertWorkLogSchema = z.object({
  workedOn: z.string().max(5000).optional().nullable(),
  learned: z.string().max(5000).optional().nullable(),
  blockers: z.string().max(5000).optional().nullable(),
  nextStep: z.string().max(5000).optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
});

const workLogDateParamSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

const workLogHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  upsertWorkLogSchema,
  workLogDateParamSchema,
  workLogHistoryQuerySchema,
};
