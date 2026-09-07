const projectService = require('../services/projects/project.service');
const projectMilestoneService = require('../services/projects/projectMilestone.service');
const {
  projectQuerySchema,
  createProjectSchema,
  updateProjectSchema,
  updateProjectStatusSchema,
  togglePortfolioSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  updateMilestoneStatusSchema,
  addProjectSkillSchema,
  createMilestoneTaskSchema,
} = require('../schemas/project.schema');

class ProjectController {
  // ==========================================
  // PROJECTS
  // ==========================================

  async listProjects(req, res, next) {
    try {
      const query = projectQuerySchema.parse(req.query);
      const result = await projectService.listProjects(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const project = await projectService.getProjectById(req.user.id, req.params.id);
      res.status(200).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const data = createProjectSchema.parse(req.body);
      const project = await projectService.createProject(req.user.id, data);
      res.status(201).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }

  async updateProject(req, res, next) {
    try {
      const data = updateProjectSchema.parse(req.body);
      const project = await projectService.updateProject(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = updateProjectStatusSchema.parse(req.body);
      const project = await projectService.updateStatus(req.user.id, req.params.id, status);
      res.status(200).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }

  async togglePortfolio(req, res, next) {
    try {
      const { isPortfolioVisible } = togglePortfolioSchema.parse(req.body || {});
      const project = await projectService.togglePortfolio(req.user.id, req.params.id, isPortfolioVisible);
      res.status(200).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const result = await projectService.deleteProject(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PROJECT MILESTONES
  // ==========================================

  async listMilestones(req, res, next) {
    try {
      const milestones = await projectMilestoneService.listMilestones(req.user.id, req.params.id);
      res.status(200).json({ success: true, milestones });
    } catch (err) {
      next(err);
    }
  }

  async createMilestone(req, res, next) {
    try {
      const data = createMilestoneSchema.parse(req.body);
      const milestone = await projectMilestoneService.createMilestone(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, milestone });
    } catch (err) {
      next(err);
    }
  }

  async updateMilestone(req, res, next) {
    try {
      const data = updateMilestoneSchema.parse(req.body);
      const milestone = await projectMilestoneService.updateMilestone(
        req.user.id,
        req.params.id,
        req.params.milestoneId,
        data
      );
      res.status(200).json({ success: true, milestone });
    } catch (err) {
      next(err);
    }
  }

  async updateMilestoneStatus(req, res, next) {
    try {
      const { status } = updateMilestoneStatusSchema.parse(req.body);
      const milestone = await projectMilestoneService.updateMilestoneStatus(
        req.user.id,
        req.params.id,
        req.params.milestoneId,
        status
      );
      res.status(200).json({ success: true, milestone });
    } catch (err) {
      next(err);
    }
  }

  async deleteMilestone(req, res, next) {
    try {
      const result = await projectMilestoneService.deleteMilestone(
        req.user.id,
        req.params.id,
        req.params.milestoneId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createMilestoneTask(req, res, next) {
    try {
      const data = createMilestoneTaskSchema.parse(req.body || {});
      const task = await projectMilestoneService.createTaskFromMilestone(
        req.user.id,
        req.params.id,
        req.params.milestoneId,
        data
      );
      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // PROJECT SKILLS
  // ==========================================

  async addSkill(req, res, next) {
    try {
      const data = addProjectSkillSchema.parse(req.body);
      const projectSkill = await projectService.addSkill(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, projectSkill });
    } catch (err) {
      next(err);
    }
  }

  async removeSkill(req, res, next) {
    try {
      const result = await projectService.removeSkill(req.user.id, req.params.id, req.params.skillId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProjectController();
