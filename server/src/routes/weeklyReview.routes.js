const express = require('express');
const weeklyReviewController = require('../controllers/weeklyReview.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/weekly/current', weeklyReviewController.getCurrent);
router.get('/weekly/history', weeklyReviewController.getHistory);
router.get('/weekly', weeklyReviewController.getHistory);
router.get('/weekly/:id', weeklyReviewController.getByDate);
router.post('/weekly/draft', weeklyReviewController.saveDraft);
router.post('/weekly', weeklyReviewController.saveDraft);
router.post('/weekly/complete', weeklyReviewController.complete);
router.post('/weekly/:id/complete', weeklyReviewController.complete);

module.exports = router;
