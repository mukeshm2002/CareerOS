const { z } = require('zod');

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
  fullName: z.string().trim().min(2, { message: 'Full name must be at least 2 characters long' }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, { message: 'Refresh token is required' }).optional(),
});

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  validate,
};
