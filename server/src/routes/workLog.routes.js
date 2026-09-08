const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const workLogController = require('../controllers/workLog.controller');

router.use(requireAuth);

router.get('/today', workLogController.getTodayWorkLog);
router.put('/today', workLogController.upsertTodayWorkLog);
router.get('/stats', workLogController.getWorkLogStats);
router.get('/', workLogController.listWorkLogs);
router.get('/:date', workLogController.getWorkLogByDate);

module.exports = router;
