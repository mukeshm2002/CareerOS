const express = require('express');
const learningController = require('../controllers/learning.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Learning Paths
router.get('/', learningController.listLearningPaths);
router.get('/:id', learningController.getLearningPathById);
router.post('/', learningController.createLearningPath);
router.put('/:id', learningController.updateLearningPath);
router.patch('/:id/status', learningController.updatePathStatus);
router.delete('/:id', learningController.deleteLearningPath);

// Learning Modules
router.post('/:id/modules', learningController.createModule);
router.put('/:id/modules/:moduleId', learningController.updateModule);
router.patch('/:id/modules/:moduleId/status', learningController.updateModuleStatus);
router.delete('/:id/modules/:moduleId', learningController.deleteModule);
router.post('/:id/modules/:moduleId/task', learningController.createModuleTask);

// Create Project from Learning
router.post('/:id/create-project', learningController.createProjectFromLearning);

module.exports = router;
