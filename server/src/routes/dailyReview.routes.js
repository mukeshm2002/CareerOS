const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const dailyReviewController = require('../controllers/dailyReview.controller');

router.use(requireAuth);

router.get('/', dailyReviewController.getDailyReview);
router.post('/', dailyReviewController.saveDailyReview);
router.put('/', dailyReviewController.saveDailyReview);

module.exports = router;
