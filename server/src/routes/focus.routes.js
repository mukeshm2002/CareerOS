const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const focusController = require('../controllers/focus.controller');

router.use(requireAuth);

router.get('/active', focusController.getActiveSession);
router.post('/start', focusController.startSession);
router.post('/:sessionId/pause', focusController.pauseSession);
router.post('/:sessionId/resume', focusController.resumeSession);
router.post('/:sessionId/finish', focusController.finishSession);
router.post('/:sessionId/cancel', focusController.cancelSession);
router.get('/history', focusController.getHistory);

module.exports = router;
