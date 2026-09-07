const taskPlanningService = require('../services/planning/taskPlanning.service');
const taskRankingService = require('../services/planning/taskRanking.service');
const { sendSuccess } = require('../utils/response');

class TaskController {
  async getTasks(req, res, next) {
    try {
      const { status, goalId, milestoneId, skillId, due, priority } = req.query;
      const tasks = await taskPlanningService.getTasks(req.user.id, {
        status,
        goalId,
        milestoneId,
        skillId,
        due,
        priority,
      });
      return sendSuccess(res, { tasks }, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await taskPlanningService.getTaskById(req.user.id, taskId);
      return sendSuccess(res, { task }, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createTask(req, res, next) {
    try {
      const task = await taskPlanningService.createTask(req.user.id, req.body);
      return sendSuccess(res, { task }, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const task = await taskPlanningService.updateTask(req.user.id, taskId, req.body);
      return sendSuccess(res, { task }, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
    try {
      const { taskId } = req.params;
      const { status } = req.body;
      const task = await taskPlanningService.updateTaskStatus(req.user.id, taskId, status);
      return sendSuccess(res, { task }, `Task status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const result = await taskPlanningService.deleteTask(req.user.id, taskId);
      return sendSuccess(res, result, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTodayFocusRecommendation(req, res, next) {
    try {
      const recommendation = await taskRankingService.getRecommendedTodayTask(req.user.id);
      return sendSuccess(res, recommendation, 'Today focus recommendation generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();
