const express = require('express');
const reminderController = require('../controllers/reminder.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Settings routes (must precede /:id)
router.get('/settings', reminderController.getSettings);
router.patch('/settings', reminderController.updateSettings);

// CRUD routes
router.get('/', reminderController.listReminders);
router.get('/:id', reminderController.getReminderById);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.patch('/:id/enabled', reminderController.toggleReminder);
router.post('/:id/snooze', reminderController.snoozeReminder);
router.post('/:id/cancel', reminderController.cancelReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
