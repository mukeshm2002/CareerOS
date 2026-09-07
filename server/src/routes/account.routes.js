const express = require('express');
const accountController = require('../controllers/account.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/change-password', accountController.changePassword);

module.exports = router;
