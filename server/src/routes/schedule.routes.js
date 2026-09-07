const express = require('express');
const scheduleController = require('../controllers/schedule.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', scheduleController.getScheduleBlocks);
router.post('/', scheduleController.createScheduleBlock);
router.post('/plan-task', scheduleController.planTaskIntoSchedule);
router.put('/:blockId', scheduleController.updateScheduleBlock);
router.delete('/:blockId', scheduleController.deleteScheduleBlock);

module.exports = router;
