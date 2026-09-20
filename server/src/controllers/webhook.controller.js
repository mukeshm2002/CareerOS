const voiceService = require('../services/reminders/voice/voiceService');

class WebhookController {
  async handleVoiceWebhook(req, res, next) {
    try {
      const { provider } = req.params;
      const result = await voiceService.handleWebhookCallback(provider, req.body, req.headers);
      return res.status(200).json({ success: true, result });
    } catch (error) {
      console.error('[WEBHOOK ERROR]:', error);
      // Telephony providers expect 200 OK so they do not retry webhooks indefinitely
      return res.status(200).json({ success: false, error: error.message });
    }
  }
}

module.exports = new WebhookController();
