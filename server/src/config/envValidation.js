/**
 * Environment Validation (Section 50)
 * Validates critical environment configuration at startup
 */
const validateEnvironment = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required');
  }

  if (isProd) {
    if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.includes('default')) {
      errors.push('JWT_ACCESS_SECRET must be set to a secure secret in production');
    }
    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.includes('default')) {
      errors.push('JWT_REFRESH_SECRET must be set to a secure secret in production');
    }
    if (!process.env.CLIENT_URL) {
      errors.push('CLIENT_URL must be specified in production for CORS security');
    }
  }

  if (errors.length > 0) {
    const errorMsg = `[CRITICAL CONFIG ERROR] Startup validation failed:\n  - ${errors.join('\n  - ')}`;
    console.error(errorMsg);
    if (isProd) {
      throw new Error(errorMsg);
    }
  }

  return { isValid: errors.length === 0, errors };
};

module.exports = {
  validateEnvironment,
};
