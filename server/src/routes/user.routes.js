const express = require('express');
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');
const { updateProfileSchema } = require('../validators/user.validator');
const { validate } = require('../validators/auth.validator');

const router = express.Router();

router.use(requireAuth);

router.get('/me', userController.getMyProfile);
router.put('/me', validate(updateProfileSchema), userController.updateMyProfile);

// Legacy aliases for backward compatibility
router.get('/profile', userController.getMyProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateMyProfile);

module.exports = router;
