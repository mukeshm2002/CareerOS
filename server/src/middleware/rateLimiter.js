const rateLimit = require('express-rate-limit');

// Detect test environment
const isTest = process.env.NODE_ENV === 'test';

/**
 * Authentication Rate Limiter for Login/Register endpoints
 * 20 attempts per 15 minutes in production; bypassed in tests unless explicitly testing rate limits
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest && process.env.ENABLE_RATE_LIMIT_TEST !== 'true' ? 10000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skip: () => isTest && process.env.ENABLE_RATE_LIMIT_TEST !== 'true',
});

/**
 * General Production API Rate Limiter
 * 1000 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest && process.env.ENABLE_RATE_LIMIT_TEST !== 'true' ? 50000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
  skip: () => isTest && process.env.ENABLE_RATE_LIMIT_TEST !== 'true',
});

module.exports = {
  authLimiter,
  apiLimiter,
};
