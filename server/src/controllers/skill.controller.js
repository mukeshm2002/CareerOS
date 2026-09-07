const skillGapService = require('../services/planning/skillGap.service');
const { sendSuccess } = require('../utils/response');

class SkillController {
  async listGlobalSkills(req, res, next) {
    try {
      const { search } = req.query;
      const skills = await skillGapService.getGlobalSkills(search);
      return sendSuccess(res, { skills }, 'Skills retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async createGlobalSkill(req, res, next) {
    try {
      const { name, category, description } = req.body;
      const skill = await skillGapService.getOrCreateGlobalSkill(name, category, description);
      return sendSuccess(res, { skill }, 'Skill created / resolved successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async listUserSkills(req, res, next) {
    try {
      const userSkills = await skillGapService.getUserSkills(req.user.id);
      return sendSuccess(res, { userSkills }, 'User skills retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async upsertUserSkill(req, res, next) {
    try {
      const userSkill = await skillGapService.upsertUserSkill(req.user.id, req.body);
      return sendSuccess(res, { userSkill }, 'Skill assessment saved successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateUserSkill(req, res, next) {
    try {
      const { id } = req.params;
      const userSkill = await skillGapService.updateUserSkill(req.user.id, id, req.body);
      return sendSuccess(res, { userSkill }, 'Skill assessment updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteUserSkill(req, res, next) {
    try {
      const { id } = req.params;
      const result = await skillGapService.deleteUserSkill(req.user.id, id);
      return sendSuccess(res, result, 'Skill assessment deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getSkillGapsAndReadiness(req, res, next) {
    try {
      const report = await skillGapService.calculateGapsAndReadiness(req.user.id);
      return sendSuccess(res, report, 'Skill gap analysis and readiness calculated');
    } catch (error) {
      next(error);
    }
  }

  async getSkillAssessmentHistory(req, res, next) {
    try {
      const { id } = req.params;
      const history = await skillGapService.getSkillAssessmentHistory(req.user.id, id);
      return sendSuccess(res, { history }, 'Skill assessment history retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getAllSkillHistory(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 50;
      const history = await skillGapService.getAllSkillHistory(req.user.id, limit);
      return sendSuccess(res, { history }, 'All skill assessment history retrieved');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SkillController();
