const goalService = require('../services/goal.service');
const { sendSuccess } = require('../utils/response');

class GoalController {
  async listGoals(req, res, next) {
    try {
      const { status, growthArea, area, priority, trackingMethod, search } = req.query;
      const goals = await goalService.listGoals(req.user.id, {
        status,
        growthArea,
        area,
        priority,
        trackingMethod,
        search,
      });
      return sendSuccess(res, { goals, metrics: goals.metrics }, 'Goals retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getGoalById(req, res, next) {
    try {
      const { goalId } = req.params;
      const goal = await goalService.getGoalById(req.user.id, goalId);
      return sendSuccess(res, { goal }, 'Goal retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createGoal(req, res, next) {
    try {
      const goal = await goalService.createGoal(req.user.id, req.body);
      return sendSuccess(res, { goal }, 'Goal created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateGoal(req, res, next) {
    try {
      const { goalId } = req.params;
      const goal = await goalService.updateGoal(req.user.id, goalId, req.body);
      return sendSuccess(res, { goal }, 'Goal updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateGoalProgress(req, res, next) {
    try {
      const { goalId } = req.params;
      const result = await goalService.updateGoalProgress(req.user.id, goalId, req.body);
      return sendSuccess(res, result, 'Goal progress updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateGoalStatus(req, res, next) {
    try {
      const { goalId } = req.params;
      const goal = await goalService.updateGoalStatus(req.user.id, goalId, req.body);
      const statusLabel = typeof req.body === 'string' ? req.body : req.body.status;
      return sendSuccess(res, { goal }, `Goal status updated to ${statusLabel}`);
    } catch (error) {
      next(error);
    }
  }

  async deleteGoal(req, res, next) {
    try {
      const { goalId } = req.params;
      await goalService.deleteGoal(req.user.id, goalId);
      return sendSuccess(res, { id: goalId }, 'Goal deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // SUCCESS CRITERIA CONTROLLERS
  // ==========================================

  async addSuccessCriterion(req, res, next) {
    try {
      const { goalId } = req.params;
      const criterion = await goalService.addSuccessCriterion(req.user.id, goalId, req.body);
      return sendSuccess(res, { criterion }, 'Success criterion added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateSuccessCriterion(req, res, next) {
    try {
      const { goalId, criterionId } = req.params;
      const criterion = await goalService.updateSuccessCriterion(req.user.id, goalId, criterionId, req.body);
      return sendSuccess(res, { criterion }, 'Success criterion updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleSuccessCriterion(req, res, next) {
    try {
      const { goalId, criterionId } = req.params;
      const criterion = await goalService.toggleSuccessCriterion(req.user.id, goalId, criterionId, req.body?.isCompleted);
      return sendSuccess(res, { criterion }, 'Success criterion toggled successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteSuccessCriterion(req, res, next) {
    try {
      const { goalId, criterionId } = req.params;
      await goalService.deleteSuccessCriterion(req.user.id, goalId, criterionId);
      return sendSuccess(res, { id: criterionId }, 'Success criterion deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // GOAL CHECK-IN CONTROLLERS
  // ==========================================

  async addCheckIn(req, res, next) {
    try {
      const { goalId } = req.params;
      const checkIn = await goalService.addCheckIn(req.user.id, goalId, req.body);
      return sendSuccess(res, { checkIn }, 'Check-in recorded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getCheckIns(req, res, next) {
    try {
      const { goalId } = req.params;
      const checkIns = await goalService.getCheckIns(req.user.id, goalId);
      return sendSuccess(res, { checkIns }, 'Check-ins retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GoalController();
