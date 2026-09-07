const focusSessionService = require('../services/focus/focusSession.service');
const {
  startFocusSchema,
  pauseFocusSchema,
  resumeFocusSchema,
  finishFocusSchema,
} = require('../schemas/dailyExecution.schema');

const getActiveSession = async (req, res, next) => {
  try {
    const session = await focusSessionService.getActiveSession(req.user.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const startSession = async (req, res, next) => {
  try {
    const validatedData = startFocusSchema.parse(req.body);
    const session = await focusSessionService.startSession(req.user.id, validatedData);
    res.status(201).json({ success: true, data: { ...session, session } });
  } catch (error) {
    next(error);
  }
};

const pauseSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const validatedData = pauseFocusSchema.parse(req.body || {});
    const session = await focusSessionService.pauseSession(req.user.id, sessionId, validatedData.pauseTimestamp);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const resumeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const validatedData = resumeFocusSchema.parse(req.body || {});
    const session = await focusSessionService.resumeSession(req.user.id, sessionId, validatedData.resumeTimestamp);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const finishSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const validatedData = finishFocusSchema.parse(req.body || {});
    const session = await focusSessionService.finishSession(req.user.id, sessionId, validatedData);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const cancelSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const session = await focusSessionService.cancelSession(req.user.id, sessionId);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const history = await focusSessionService.getHistory(req.user.id, limit);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveSession,
  startSession,
  pauseSession,
  resumeSession,
  finishSession,
  cancelSession,
  getHistory,
};
