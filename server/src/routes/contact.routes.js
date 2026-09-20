const express = require('express');
const contactController = require('../controllers/contact.controller');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/phone', contactController.getPhoneContact);
router.post('/phone/verification/start', contactController.startVerification);
router.post('/phone/verification/confirm', contactController.confirmVerification);
router.delete('/phone', contactController.deletePhoneContact);

module.exports = router;
