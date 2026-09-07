const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) => {
  sendError(res, `Route not found: ${req.originalUrl}`, 404);
};

const errorHandler = (err, req, res, next) => {
  // Server-side logging only
  console.error(`[Error ${req.requestId ? `reqId=${req.requestId}` : ''}]`, err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errors = err.errors || [];

  if (err.name === 'ZodError' || err.issues) {
    statusCode = 400;
    message = err.issues ? err.issues.map((i) => i.message).join(', ') : 'Validation error';
    errors = err.issues || [];
  }

  // Production error sanitization (Section 44)
  if (process.env.NODE_ENV === 'production') {
    if (statusCode === 500) {
      message = 'An unexpected internal server error occurred';
      errors = [];
    } else if (err.code && err.code.startsWith('P')) {
      // Prisma error codes
      message = 'A database constraint or validation error occurred';
    }
  }

  sendError(res, message, statusCode, errors);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
