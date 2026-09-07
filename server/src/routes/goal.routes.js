const express = require('express');
const goalController = require('../controllers/goal.controller');
const { requireAuth } = require('../middleware/auth');
const {
  createGoalSchema,
  updateGoalSchema,
  updateGoalStatusSchema,
} = require('../validators/goal.validator');
const { validate } = require('../validators/auth.validator');

const roadmapController = require('../controllers/roadmap.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', goalController.listGoals);
router.get('/:goalId', goalController.getGoalById);
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.put('/:goalId', validate(updateGoalSchema), goalController.updateGoal);
router.patch('/:goalId/status', validate(updateGoalStatusSchema), goalController.updateGoalStatus);
router.delete('/:goalId', goalController.deleteGoal);

// Goal Roadmap Endpoints (Section 6)
router.get('/:goalId/roadmap', roadmapController.getRoadmapByGoal);
router.post('/:goalId/roadmap', roadmapController.createRoadmapForGoal);

module.exports = router;
