const express = require('express');
const roadmapController = require('../controllers/roadmap.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/:goalType', roadmapController.getTemplatePreview);

module.exports = router;
