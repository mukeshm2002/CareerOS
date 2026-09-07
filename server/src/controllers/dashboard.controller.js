const dashboardService = require('../services/dashboard/dashboard.service');
const { dateQuerySchema } = require('../schemas/dailyExecution.schema');

const getDashboard = async (req, res, next) => {
  try {
    const validatedQuery = dateQuerySchema.parse(req.query);
    const dashboardData = await dashboardService.getDashboardData(req.user.id, validatedQuery.date);
    res.status(200).json({ success: true, data: dashboardData });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
};
