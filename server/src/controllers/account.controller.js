const settingsService = require('../services/settings/settings.service');
const { changePasswordSchema } = require('../schemas/settings.schema');
const { clearRefreshCookie } = require('../utils/cookie');
const { sendSuccess } = require('../utils/response');

class AccountController {
  async changePassword(req, res, next) {
    try {
      const validated = changePasswordSchema.parse(req.body);
      const result = await settingsService.changePassword(req.user.id, validated);
      clearRefreshCookie(res);
      return sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AccountController();
