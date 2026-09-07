const express = require('express');
const skillController = require('../controllers/skill.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', skillController.listUserSkills);
router.post('/', skillController.upsertUserSkill);
router.get('/history', skillController.getAllSkillHistory);
router.get('/gaps', skillController.getSkillGapsAndReadiness);
router.get('/:id/history', skillController.getSkillAssessmentHistory);
router.put('/:id', skillController.updateUserSkill);
router.delete('/:id', skillController.deleteUserSkill);

module.exports = router;
