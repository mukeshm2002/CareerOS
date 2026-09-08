const workLogService = require('../services/workLogs/workLog.service');
const {
  upsertWorkLogSchema,
  workLogDateParamSchema,
  workLogHistoryQuerySchema,
} = require('../schemas/workLog.schema');

const getTodayWorkLog = async (req, res, next) => {
  try {
    const result = await workLogService.getToday(req.user.id);
    res.status(200).json({
      success: true,
      data: result.workLog,
      date: result.date,
      timezone: result.timezone,
    });
  } catch (error) {
    next(error);
  }
};

const upsertTodayWorkLog = async (req, res, next) => {
  try {
    const validatedData = upsertWorkLogSchema.parse(req.body);
    const result = await workLogService.upsertToday(req.user.id, validatedData);
    res.status(200).json({
      success: true,
      data: result.workLog,
      date: result.date,
      timezone: result.timezone,
      message: 'Work note saved successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getWorkLogByDate = async (req, res, next) => {
  try {
    const { date } = workLogDateParamSchema.parse(req.params);
    const result = await workLogService.getByDate(req.user.id, date);
    res.status(200).json({
      success: true,
      data: result.workLog,
      date: result.date,
    });
  } catch (error) {
    next(error);
  }
};

const listWorkLogs = async (req, res, next) => {
  try {
    const query = workLogHistoryQuerySchema.parse(req.query);
    const result = await workLogService.listHistory(req.user.id, query);
    res.status(200).json({
      success: true,
      data: result.workLogs,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getWorkLogStats = async (req, res, next) => {
  try {
    const stats = await workLogService.getStats(req.user.id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTodayWorkLog,
  upsertTodayWorkLog,
  getWorkLogByDate,
  listWorkLogs,
  getWorkLogStats,
};
