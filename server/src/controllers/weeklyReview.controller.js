const weeklyReviewService = require('../services/reviews/weeklyReview.service');
const { sendSuccess } = require('../utils/response');

class WeeklyReviewController {
  async getCurrent(req, res, next) {
    try {
      const data = await weeklyReviewService.getCurrentWeeklyReview(req.user.id);
      return sendSuccess(res, data, 'Current weekly review retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getByDate(req, res, next) {
    try {
      const idOrDate = req.params.id || req.params.weekStartDate;
      const data = await weeklyReviewService.getWeeklyReviewByIdOrDate(req.user.id, idOrDate);
      return sendSuccess(res, data, 'Weekly review retrieved');
    } catch (error) {
      next(error);
    }
  }

  async getHistory(req, res, next) {
    try {
      const data = await weeklyReviewService.getWeeklyReviewHistory(req.user.id);
      return sendSuccess(res, { history: data }, 'Weekly review history retrieved');
    } catch (error) {
      next(error);
    }
  }

  async saveDraft(req, res, next) {
    try {
      const data = await weeklyReviewService.saveWeeklyReviewDraft(req.user.id, req.body);
      return sendSuccess(res, { ...data, review: data }, 'Weekly review draft saved successfully');
    } catch (error) {
      next(error);
    }
  }

  async complete(req, res, next) {
    try {
      const reviewId = req.params.id || req.body.reviewId || req.body.id;
      const data = await weeklyReviewService.completeWeeklyReview(req.user.id, reviewId, req.body);
      return sendSuccess(res, { ...data, review: data }, 'Weekly review completed successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WeeklyReviewController();
