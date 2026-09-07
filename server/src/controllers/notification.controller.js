const notificationService = require('../services/reminders/notification.service');
const { sendSuccess } = require('../utils/response');

class NotificationController {
  async listNotifications(req, res, next) {
    try {
      const data = await notificationService.listNotifications(req.user.id, req.query);
      return sendSuccess(res, data, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const data = await notificationService.getUnreadCount(req.user.id);
      return sendSuccess(res, data, 'Unread notification count retrieved');
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(req.user.id, id);
      return sendSuccess(res, { notification }, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const result = await notificationService.deleteNotification(req.user.id, id);
      return sendSuccess(res, result, 'Notification deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
