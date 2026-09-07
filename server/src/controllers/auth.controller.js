const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response');
const { setRefreshCookie, clearRefreshCookie } = require('../utils/cookie');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, fullName } = req.body;
      const result = await authService.register({ email, password, fullName });
      if (result.tokens?.refreshToken) {
        setRefreshCookie(res, result.tokens.refreshToken);
      }
      return sendSuccess(res, result, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      if (result.tokens?.refreshToken) {
        setRefreshCookie(res, result.tokens.refreshToken);
      }
      return sendSuccess(res, result, 'Login successful', 200);
    } catch (error) {
      next(error);
    }
  }

  async refresh(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) {
        return sendError(res, 'Refresh token is required', 400);
      }
      const result = await authService.refresh(refreshToken);
      if (result.refreshToken) {
        setRefreshCookie(res, result.refreshToken);
      }
      return sendSuccess(res, result, 'Token refreshed successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const refreshToken = req.body?.refreshToken || req.cookies?.refreshToken;
      await authService.logout(req.user.id, refreshToken);
      clearRefreshCookie(res);
      return sendSuccess(res, null, 'Logged out successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async logoutAll(req, res, next) {
    try {
      await authService.logoutAll(req.user.id);
      clearRefreshCookie(res);
      return sendSuccess(res, null, 'Logged out from all sessions successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      return sendSuccess(res, { user }, 'User profile retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
