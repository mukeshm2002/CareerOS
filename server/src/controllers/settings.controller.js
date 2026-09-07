const settingsService = require('../services/settings/settings.service');
const {
  updateProfileSchema,
  updatePreferencesSchema,
  updateNotificationPreferencesSchema,
} = require('../schemas/settings.schema');
const { sendSuccess } = require('../utils/response');

class SettingsController {
  async getSettings(req, res, next) {
    try {
      const data = await settingsService.getSettings(req.user.id);
      return sendSuccess(res, data, 'Settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const validated = updateProfileSchema.parse(req.body);
      const profile = await settingsService.updateProfile(req.user.id, validated);
      return sendSuccess(res, { profile }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req, res, next) {
    try {
      const validated = updatePreferencesSchema.parse(req.body);
      const preferences = await settingsService.updatePreferences(req.user.id, validated);
      return sendSuccess(res, { preferences }, 'Preferences updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateNotifications(req, res, next) {
    try {
      const validated = updateNotificationPreferencesSchema.parse(req.body);
      const preferences = await settingsService.updateNotificationPreferences(req.user.id, validated);
      return sendSuccess(res, { preferences }, 'Notification settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();
