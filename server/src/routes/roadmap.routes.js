const express = require('express');
const roadmapController = require('../controllers/roadmap.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Direct Roadmap Routes
router.get('/:roadmapId', roadmapController.getRoadmapById);
router.put('/:roadmapId', roadmapController.updateRoadmap);
router.patch('/:roadmapId/status', roadmapController.updateRoadmapStatus);
router.post('/:roadmapId/milestones', roadmapController.addMilestone);
router.post('/:roadmapId/milestones/reorder', roadmapController.reorderMilestones);

module.exports = router;
