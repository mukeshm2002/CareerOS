const { z } = require('zod');

// Validates E.164 phone numbers (e.g. +919876543210, +14155552671)
const phoneRegex = /^\+[1-9]\d{6,14}$/;

const startPhoneVerificationSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .refine((val) => phoneRegex.test(val.replace(/[\s\-()]/g, '')), {
      message: 'Phone number must be a valid international number with country code (e.g. +91 98765 43210)',
    }),
});

const confirmPhoneVerificationSchema = z.object({
  code: z
    .string()
    .trim()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must be numeric'),
});

module.exports = {
  startPhoneVerificationSchema,
  confirmPhoneVerificationSchema,
};
