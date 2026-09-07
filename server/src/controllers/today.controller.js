const todayService = require('../services/today/today.service');
const dailyPlanService = require('../services/today/dailyPlan.service');
const { dateQuerySchema, savePlanSchema, confirmPlanSchema, closePlanSchema } = require('../schemas/dailyExecution.schema');

const getTodayContext = async (req, res, next) => {
  try {
    const validatedQuery = dateQuerySchema.parse(req.query);
    const context = await todayService.getTodayContext(req.user.id, validatedQuery.date);
    res.status(200).json({ success: true, data: context });
  } catch (error) {
    next(error);
  }
};

const getRecommendation = async (req, res, next) => {
  try {
    const validatedQuery = dateQuerySchema.parse(req.query);
    const recommendation = await todayService.getRecommendation(req.user.id, validatedQuery.date);
    res.status(200).json({ success: true, data: recommendation });
  } catch (error) {
    next(error);
  }
};

const getDailyPlan = async (req, res, next) => {
  try {
    const validatedQuery = dateQuerySchema.parse(req.query);
    const plan = await dailyPlanService.getPlan(req.user.id, validatedQuery.date);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const saveDailyPlan = async (req, res, next) => {
  try {
    const validatedData = savePlanSchema.parse(req.body);
    const plan = await dailyPlanService.savePlan(req.user.id, validatedData.date, validatedData);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const confirmDailyPlan = async (req, res, next) => {
  try {
    const validatedData = confirmPlanSchema.parse(req.body);
    const plan = await dailyPlanService.confirmPlan(req.user.id, validatedData.date, validatedData);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const closeDailyPlan = async (req, res, next) => {
  try {
    const validatedData = closePlanSchema.parse(req.body);
    const plan = await dailyPlanService.closePlan(req.user.id, validatedData.date);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayContext,
  getRecommendation,
  getDailyPlan,
  saveDailyPlan,
  confirmDailyPlan,
  closeDailyPlan,
};
