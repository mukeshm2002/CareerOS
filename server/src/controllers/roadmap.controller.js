const roadmapService = require('../services/planning/roadmap.service');
const roadmapTemplateService = require('../services/planning/roadmapTemplate.service');
const { sendSuccess } = require('../utils/response');

class RoadmapController {
  async getRoadmapByGoal(req, res, next) {
    try {
      const { goalId } = req.params;
      const roadmap = await roadmapService.getRoadmapByGoalId(req.user.id, goalId);
      return sendSuccess(res, { roadmap }, 'Roadmap retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createRoadmapForGoal(req, res, next) {
    try {
      const { goalId } = req.params;
      const roadmap = await roadmapService.createRoadmap(req.user.id, goalId, req.body);
      return sendSuccess(res, { roadmap }, 'Roadmap created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getRoadmapById(req, res, next) {
    try {
      const { roadmapId } = req.params;
      const roadmap = await roadmapService.getRoadmapById(req.user.id, roadmapId);
      return sendSuccess(res, { roadmap }, 'Roadmap details retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateRoadmap(req, res, next) {
    try {
      const { roadmapId } = req.params;
      const roadmap = await roadmapService.updateRoadmap(req.user.id, roadmapId, req.body);
      return sendSuccess(res, { roadmap }, 'Roadmap updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateRoadmapStatus(req, res, next) {
    try {
      const { roadmapId } = req.params;
      const { status } = req.body;
      const roadmap = await roadmapService.updateRoadmapStatus(req.user.id, roadmapId, status);
      return sendSuccess(res, { roadmap }, `Roadmap status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async addMilestone(req, res, next) {
    try {
      const { roadmapId } = req.params;
      const milestone = await roadmapService.addMilestone(req.user.id, roadmapId, req.body);
      return sendSuccess(res, { milestone }, 'Milestone added successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;
      const milestone = await roadmapService.updateMilestone(req.user.id, milestoneId, req.body);
      return sendSuccess(res, { milestone }, 'Milestone updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateMilestoneStatus(req, res, next) {
    try {
      const { milestoneId } = req.params;
      const { status } = req.body;
      const milestone = await roadmapService.updateMilestoneStatus(req.user.id, milestoneId, status);
      return sendSuccess(res, { milestone }, `Milestone status updated to ${status}`);
    } catch (error) {
      next(error);
    }
  }

  async deleteMilestone(req, res, next) {
    try {
      const { milestoneId } = req.params;
      const result = await roadmapService.deleteMilestone(req.user.id, milestoneId);
      return sendSuccess(res, result, 'Milestone deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async reorderMilestones(req, res, next) {
    try {
      const { roadmapId } = req.params;
      const { orderedMilestoneIds } = req.body;
      const roadmap = await roadmapService.reorderMilestones(req.user.id, roadmapId, orderedMilestoneIds);
      return sendSuccess(res, { roadmap }, 'Milestones reordered successfully');
    } catch (error) {
      next(error);
    }
  }

  async getTemplatePreview(req, res, next) {
    try {
      const { goalType } = req.params;
      const { goalTitle } = req.query;
      const preview = roadmapTemplateService.generatePreview(goalType, goalTitle);
      return sendSuccess(res, { preview }, 'Roadmap template preview generated');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RoadmapController();
