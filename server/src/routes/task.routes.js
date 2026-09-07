const express = require('express');
const taskController = require('../controllers/task.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', taskController.getTasks);
router.get('/recommendation/today', taskController.getTodayFocusRecommendation);
router.get('/:taskId', taskController.getTaskById);
router.post('/', taskController.createTask);
router.put('/:taskId', taskController.updateTask);
router.patch('/:taskId/status', taskController.updateTaskStatus);
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;
