const express = require('express');
const evidenceController = require('../controllers/evidence.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', evidenceController.listEvidence);
router.post('/assess-skill', evidenceController.assessSkill);
router.get('/:id', evidenceController.getEvidenceById);
router.post('/', evidenceController.createEvidence);
router.put('/:id', evidenceController.updateEvidence);
router.delete('/:id', evidenceController.deleteEvidence);

// Evidence Skills
router.post('/:id/skills', evidenceController.linkSkill);
router.delete('/:id/skills/:skillId', evidenceController.unlinkSkill);

module.exports = router;
