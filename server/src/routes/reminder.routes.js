const express = require('express');
const reminderController = require('../controllers/reminder.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', reminderController.listReminders);
router.get('/:id', reminderController.getReminderById);
router.post('/', reminderController.createReminder);
router.put('/:id', reminderController.updateReminder);
router.patch('/:id/enabled', reminderController.toggleReminder);
router.delete('/:id', reminderController.deleteReminder);

module.exports = router;
