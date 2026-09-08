const pushService = require('../services/push/push.service');
const { sendSuccess } = require('../utils/response');

class PushController {
  async getStatus(req, res, next) {
    try {
      const status = await pushService.getStatus(req.user.id);
      return sendSuccess(res, status, 'Push subscription status retrieved');
    } catch (error) {
      next(error);
    }
  }

  async subscribe(req, res, next) {
    try {
      const { endpoint, keys, userAgent } = req.body;
      const ua = userAgent || req.headers['user-agent'] || null;
      const result = await pushService.subscribe(req.user.id, { endpoint, keys, userAgent: ua });
      return sendSuccess(res, result, 'Successfully subscribed to push notifications', 201);
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      const result = await pushService.unsubscribe(req.user.id, endpoint);
      return sendSuccess(res, result, 'Successfully unsubscribed from push notifications');
    } catch (error) {
      next(error);
    }
  }

  async listSubscriptions(req, res, next) {
    try {
      const subscriptions = await pushService.listSubscriptions(req.user.id);
      return sendSuccess(res, subscriptions, 'Registered notification devices retrieved');
    } catch (error) {
      next(error);
    }
  }

  async deleteSubscription(req, res, next) {
    try {
      const { id } = req.params;
      const result = await pushService.deleteSubscription(req.user.id, id);
      return sendSuccess(res, result, 'Device subscription removed');
    } catch (error) {
      next(error);
    }
  }

  async sendTest(req, res, next) {
    try {
      const result = await pushService.sendTestNotification(req.user.id);
      return sendSuccess(res, result, 'Test push notification dispatched');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PushController();
