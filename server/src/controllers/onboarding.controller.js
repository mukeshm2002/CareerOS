const onboardingService = require('../services/onboarding.service');
const { sendSuccess, sendError } = require('../utils/response');

class OnboardingController {
  async getState(req, res, next) {
    try {
      const state = await onboardingService.getOnboardingState(req.user.id);
      return sendSuccess(res, state, 'Onboarding state retrieved');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const profile = await onboardingService.updateDraftProfile(req.user.id, req.body);
      return sendSuccess(res, { profile }, 'Draft profile updated');
    } catch (error) {
      next(error);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const { step } = req.body;
      const progress = await onboardingService.updateProgressStep(req.user.id, step);
      return sendSuccess(res, progress, 'Onboarding progress step updated');
    } catch (error) {
      next(error);
    }
  }

  async complete(req, res, next) {
    try {
      const result = await onboardingService.completeOnboarding(req.user.id, req.body);
      return sendSuccess(res, result, 'CareerOS successfully configured and initialized', 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OnboardingController();
