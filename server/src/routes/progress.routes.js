const express = require('express');
const progressController = require('../controllers/progress.controller');
const skillController = require('../controllers/skill.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', progressController.getProgress);
router.get('/trends', progressController.getTrends);
router.get('/skills/history', skillController.getAllSkillHistory);
router.get('/goals/:goalId', progressController.getGoalProgress);

module.exports = router;
