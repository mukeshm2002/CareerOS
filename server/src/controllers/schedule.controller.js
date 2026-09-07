const schedulePlanningService = require('../services/planning/schedulePlanning.service');
const { sendSuccess } = require('../utils/response');

class ScheduleController {
  async getScheduleBlocks(req, res, next) {
    try {
      const { date, startDate, endDate } = req.query;
      const blocks = await schedulePlanningService.getScheduleBlocks(req.user.id, {
        date,
        startDate,
        endDate,
      });
      return sendSuccess(res, { blocks }, 'Schedule blocks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createScheduleBlock(req, res, next) {
    try {
      const result = await schedulePlanningService.createScheduleBlock(req.user.id, req.body);
      return sendSuccess(res, result, 'Schedule block created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateScheduleBlock(req, res, next) {
    try {
      const { blockId } = req.params;
      const block = await schedulePlanningService.updateScheduleBlock(req.user.id, blockId, req.body);
      return sendSuccess(res, { block }, 'Schedule block updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteScheduleBlock(req, res, next) {
    try {
      const { blockId } = req.params;
      const result = await schedulePlanningService.deleteScheduleBlock(req.user.id, blockId);
      return sendSuccess(res, result, 'Schedule block deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async planTaskIntoSchedule(req, res, next) {
    try {
      const { taskId, date } = req.body;
      if (!taskId) {
        const error = new Error('taskId is required to plan into schedule');
        error.statusCode = 400;
        throw error;
      }
      const suggestion = await schedulePlanningService.planTaskIntoSchedule(req.user.id, taskId, date);
      return sendSuccess(res, suggestion, 'Task schedule suggestion generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ScheduleController();
