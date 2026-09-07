const express = require('express');
const settingsController = require('../controllers/settings.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', settingsController.getSettings);
router.put('/profile', settingsController.updateProfile);
router.put('/preferences', settingsController.updatePreferences);
router.put('/notifications', settingsController.updateNotifications);

module.exports = router;
