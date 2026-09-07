const { verifyAccessToken } = require('../utils/tokens');
const { sendError } = require('../utils/response');
const prisma = require('../config/db');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token is required', 401);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return sendError(res, 'Access token expired', 401);
      }
      return sendError(res, 'Invalid access token', 401);
    }

    // Attach user payload to request
    // If DB is connected, can enrich user, or use token payload
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
};
