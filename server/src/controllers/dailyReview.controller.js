const dailyReviewService = require('../services/today/dailyReview.service');
const { dateQuerySchema, saveReviewSchema } = require('../schemas/dailyExecution.schema');

const getDailyReview = async (req, res, next) => {
  try {
    const validatedQuery = dateQuerySchema.parse(req.query);
    const review = await dailyReviewService.getReview(req.user.id, validatedQuery.date);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

const saveDailyReview = async (req, res, next) => {
  try {
    const validatedData = saveReviewSchema.parse(req.body);
    const review = await dailyReviewService.saveReview(req.user.id, validatedData.date, validatedData);
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDailyReview,
  saveDailyReview,
};
