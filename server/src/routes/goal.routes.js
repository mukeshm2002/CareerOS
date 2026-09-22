const express = require('express');
const goalController = require('../controllers/goal.controller');
const { requireAuth } = require('../middleware/auth');
const {
  createGoalSchema,
  updateGoalSchema,
  updateGoalStatusSchema,
  updateGoalProgressSchema,
  successCriterionSchema,
  goalCheckInSchema,
} = require('../validators/goal.validator');
const { validate } = require('../validators/auth.validator');

const roadmapController = require('../controllers/roadmap.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', goalController.listGoals);
router.get('/:goalId', goalController.getGoalById);
router.post('/', validate(createGoalSchema), goalController.createGoal);
router.put('/:goalId', validate(updateGoalSchema), goalController.updateGoal);
router.patch('/:goalId/progress', validate(updateGoalProgressSchema), goalController.updateGoalProgress);
router.patch('/:goalId/status', validate(updateGoalStatusSchema), goalController.updateGoalStatus);
router.delete('/:goalId', goalController.deleteGoal);

// Success Criteria
router.post('/:goalId/criteria', validate(successCriterionSchema), goalController.addSuccessCriterion);
router.put('/:goalId/criteria/:criterionId', goalController.updateSuccessCriterion);
router.patch('/:goalId/criteria/:criterionId/toggle', goalController.toggleSuccessCriterion);
router.delete('/:goalId/criteria/:criterionId', goalController.deleteSuccessCriterion);

// Check-ins
router.post('/:goalId/check-ins', validate(goalCheckInSchema), goalController.addCheckIn);
router.get('/:goalId/check-ins', goalController.getCheckIns);

// Goal Roadmap Endpoints
router.get('/:goalId/roadmap', roadmapController.getRoadmapByGoal);
router.post('/:goalId/roadmap', roadmapController.createRoadmapForGoal);

module.exports = router;
