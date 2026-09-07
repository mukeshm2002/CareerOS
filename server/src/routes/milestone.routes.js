const express = require('express');
const roadmapController = require('../controllers/roadmap.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.put('/:milestoneId', roadmapController.updateMilestone);
router.patch('/:milestoneId/status', roadmapController.updateMilestoneStatus);
router.delete('/:milestoneId', roadmapController.deleteMilestone);

module.exports = router;
