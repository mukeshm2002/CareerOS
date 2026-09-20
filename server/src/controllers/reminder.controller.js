const reminderService = require('../services/reminders/reminder.service');
const {
  createReminderSchema,
  updateReminderSchema,
  snoozeReminderSchema,
  updateReminderSettingsSchema,
} = require('../schemas/reminder.schema');
const { sendSuccess } = require('../utils/response');

class ReminderController {
  async listReminders(req, res, next) {
    try {
      const data = await reminderService.listReminders(req.user.id, req.query);
      return sendSuccess(res, data, 'Reminders retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getReminderById(req, res, next) {
    try {
      const { id } = req.params;
      const reminder = await reminderService.getReminderById(req.user.id, id);
      return sendSuccess(res, { reminder }, 'Reminder retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createReminder(req, res, next) {
    try {
      const validated = createReminderSchema.parse(req.body);
      const reminder = await reminderService.createReminder(req.user.id, validated);
      return sendSuccess(res, { reminder }, 'Reminder created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateReminder(req, res, next) {
    try {
      const { id } = req.params;
      const validated = updateReminderSchema.parse(req.body);
      const reminder = await reminderService.updateReminder(req.user.id, id, validated);
      return sendSuccess(res, { reminder }, 'Reminder updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async snoozeReminder(req, res, next) {
    try {
      const { id } = req.params;
      const { minutes } = snoozeReminderSchema.parse(req.body || {});
      const reminder = await reminderService.snoozeReminder(req.user.id, id, minutes);
      return sendSuccess(res, { reminder }, `Reminder snoozed for ${minutes} minutes`);
    } catch (error) {
      next(error);
    }
  }

  async cancelReminder(req, res, next) {
    try {
      const { id } = req.params;
      const reminder = await reminderService.cancelReminder(req.user.id, id);
      return sendSuccess(res, { reminder }, 'Reminder cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleReminder(req, res, next) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;
      const reminder = await reminderService.toggleReminder(req.user.id, id, enabled);
      return sendSuccess(res, { reminder }, `Reminder ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      next(error);
    }
  }

  async deleteReminder(req, res, next) {
    try {
      const { id } = req.params;
      const result = await reminderService.deleteReminder(req.user.id, id);
      return sendSuccess(res, result, 'Reminder deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req, res, next) {
    try {
      const data = await reminderService.getReminderSettings(req.user.id);
      return sendSuccess(res, data, 'Reminder settings retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req, res, next) {
    try {
      const validated = updateReminderSettingsSchema.parse(req.body);
      const data = await reminderService.updateReminderSettings(req.user.id, validated);
      return sendSuccess(res, data, 'Reminder settings updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReminderController();
