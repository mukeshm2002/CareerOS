const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const todayController = require('../controllers/today.controller');

router.use(requireAuth);

router.get('/', todayController.getTodayContext);
router.get('/recommendation', todayController.getRecommendation);
router.get('/plan', todayController.getDailyPlan);
router.post('/plan', todayController.saveDailyPlan);
router.put('/plan', todayController.saveDailyPlan);
router.post('/plan/confirm', todayController.confirmDailyPlan);
router.post('/plan/close', todayController.closeDailyPlan);

module.exports = router;
