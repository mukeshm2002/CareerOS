const learningService = require('../services/learning/learning.service');
const {
  learningPathQuerySchema,
  createLearningPathSchema,
  updateLearningPathSchema,
  updateLearningPathStatusSchema,
  createLearningModuleSchema,
  updateLearningModuleSchema,
  updateLearningModuleStatusSchema,
  createModuleTaskSchema,
  createProjectFromLearningSchema,
} = require('../schemas/learning.schema');

class LearningController {
  // ==========================================
  // LEARNING PATHS
  // ==========================================

  async listLearningPaths(req, res, next) {
    try {
      const query = learningPathQuerySchema.parse(req.query);
      const result = await learningService.listLearningPaths(req.user.id, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async getLearningPathById(req, res, next) {
    try {
      const path = await learningService.getLearningPathById(req.user.id, req.params.id);
      res.status(200).json({ success: true, path });
    } catch (err) {
      next(err);
    }
  }

  async createLearningPath(req, res, next) {
    try {
      const data = createLearningPathSchema.parse(req.body);
      const path = await learningService.createLearningPath(req.user.id, data);
      res.status(201).json({ success: true, path });
    } catch (err) {
      next(err);
    }
  }

  async updateLearningPath(req, res, next) {
    try {
      const data = updateLearningPathSchema.parse(req.body);
      const path = await learningService.updateLearningPath(req.user.id, req.params.id, data);
      res.status(200).json({ success: true, path });
    } catch (err) {
      next(err);
    }
  }

  async updatePathStatus(req, res, next) {
    try {
      const { status } = updateLearningPathStatusSchema.parse(req.body);
      const path = await learningService.updatePathStatus(req.user.id, req.params.id, status);
      res.status(200).json({ success: true, path });
    } catch (err) {
      next(err);
    }
  }

  async deleteLearningPath(req, res, next) {
    try {
      const result = await learningService.deleteLearningPath(req.user.id, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // LEARNING MODULES
  // ==========================================

  async createModule(req, res, next) {
    try {
      const data = createLearningModuleSchema.parse(req.body);
      const module = await learningService.createModule(req.user.id, req.params.id, data);
      res.status(201).json({ success: true, module });
    } catch (err) {
      next(err);
    }
  }

  async updateModule(req, res, next) {
    try {
      const data = updateLearningModuleSchema.parse(req.body);
      const module = await learningService.updateModule(
        req.user.id,
        req.params.id,
        req.params.moduleId,
        data
      );
      res.status(200).json({ success: true, module });
    } catch (err) {
      next(err);
    }
  }

  async updateModuleStatus(req, res, next) {
    try {
      const { status } = updateLearningModuleStatusSchema.parse(req.body);
      const module = await learningService.updateModuleStatus(
        req.user.id,
        req.params.id,
        req.params.moduleId,
        status
      );
      res.status(200).json({ success: true, module });
    } catch (err) {
      next(err);
    }
  }

  async deleteModule(req, res, next) {
    try {
      const result = await learningService.deleteModule(
        req.user.id,
        req.params.id,
        req.params.moduleId
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async createModuleTask(req, res, next) {
    try {
      const data = createModuleTaskSchema.parse(req.body || {});
      const task = await learningService.createTaskFromModule(
        req.user.id,
        req.params.id,
        req.params.moduleId,
        data
      );
      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }

  async createProjectFromLearning(req, res, next) {
    try {
      const data = createProjectFromLearningSchema.parse(req.body);
      const project = await learningService.createProjectFromLearning(
        req.user.id,
        req.params.id,
        data
      );
      res.status(201).json({ success: true, project });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LearningController();
