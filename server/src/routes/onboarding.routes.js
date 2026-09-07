const express = require('express');
const onboardingController = require('../controllers/onboarding.controller');
const { requireAuth } = require('../middleware/auth');
const {
  updateOnboardingProfileSchema,
  updateOnboardingProgressSchema,
  completeOnboardingSchema,
} = require('../validators/onboarding.validator');
const { validate } = require('../validators/auth.validator');

const router = express.Router();

// Require authentication for all onboarding routes
router.use(requireAuth);

router.get('/', onboardingController.getState);
router.put('/profile', validate(updateOnboardingProfileSchema), onboardingController.updateProfile);
router.put('/progress', validate(updateOnboardingProgressSchema), onboardingController.updateProgress);
router.post('/complete', validate(completeOnboardingSchema), onboardingController.complete);

module.exports = router;
