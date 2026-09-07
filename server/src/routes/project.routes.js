const express = require('express');
const projectController = require('../controllers/project.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Projects
router.get('/', projectController.listProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.patch('/:id/status', projectController.updateStatus);
router.patch('/:id/portfolio', projectController.togglePortfolio);
router.delete('/:id', projectController.deleteProject);

// Project Milestones
router.get('/:id/milestones', projectController.listMilestones);
router.post('/:id/milestones', projectController.createMilestone);
router.put('/:id/milestones/:milestoneId', projectController.updateMilestone);
router.patch('/:id/milestones/:milestoneId/status', projectController.updateMilestoneStatus);
router.delete('/:id/milestones/:milestoneId', projectController.deleteMilestone);
router.post('/:id/milestones/:milestoneId/task', projectController.createMilestoneTask);

// Project Skills
router.post('/:id/skills', projectController.addSkill);
router.delete('/:id/skills/:skillId', projectController.removeSkill);

module.exports = router;
