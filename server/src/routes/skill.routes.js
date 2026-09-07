const express = require('express');
const skillController = require('../controllers/skill.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', skillController.listGlobalSkills);
router.post('/', skillController.createGlobalSkill);

module.exports = router;
