const goalService = require('../services/goal.service');
const { sendSuccess, sendError } = require('../utils/response');

class GoalController {
  async listGoals(req, res, next) {
    try {
      const { status } = req.query;
      const goals = await goalService.listGoals(req.user.id, { status });
      return sendSuccess(res, { goals }, 'Goals retrieved successfully');
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

  async updateGoalStatus(req, res, next) {
    try {
      const { goalId } = req.params;
      const { status } = req.body;
      const goal = await goalService.updateGoalStatus(req.user.id, goalId, status);
      return sendSuccess(res, { goal }, `Goal status updated to ${status}`);
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
}

module.exports = new GoalController();
