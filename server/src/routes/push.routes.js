const express = require('express');
const rateLimit = require('express-rate-limit');
const pushController = require('../controllers/push.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Rate limiter for test push notifications (max 5 test pushes per 10 minutes)
const testPushLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many test notifications requested. Please wait before testing again.',
  },
});

// All push endpoints require authentication
router.use(requireAuth);

router.get('/status', pushController.getStatus);
router.post('/subscribe', pushController.subscribe);
router.delete('/unsubscribe', pushController.unsubscribe);
router.get('/subscriptions', pushController.listSubscriptions);
router.delete('/subscriptions/:id', pushController.deleteSubscription);
router.post('/test', testPushLimiter, pushController.sendTest);

module.exports = router;
