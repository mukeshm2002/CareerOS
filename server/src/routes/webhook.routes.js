const express = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Webhook endpoints are called by external telephony carriers (Twilio, etc.) without user JWT cookies
router.post('/voice/:provider', webhookController.handleVoiceWebhook);

module.exports = router;
