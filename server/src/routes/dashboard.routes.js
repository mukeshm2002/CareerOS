const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboard.controller');

router.use(requireAuth);

router.get('/', dashboardController.getDashboard);

module.exports = router;
