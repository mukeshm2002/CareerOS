const progressService = require('../services/progress/progress.service');
const { sendSuccess } = require('../utils/response');

class ProgressController {
  async getProgress(req, res, next) {
    try {
      const data = await progressService.getProgress(req.user.id, req.query);
      return sendSuccess(res, data, 'Progress metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req, res, next) {
    try {
      const data = await progressService.getTrends(req.user.id, req.query);
      return sendSuccess(res, data, 'Progress trends retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getGoalProgress(req, res, next) {
    try {
      const { goalId } = req.params;
      const data = await progressService.getGoalProgressDetail(req.user.id, goalId, req.query);
      return sendSuccess(res, data, 'Goal progress details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProgressController();
