import api from './api';

export const executionService = {
  // Today & Daily Plan
  async getToday(date) {
    const res = await api.get('/today', { params: date ? { date } : {} });
    return res.data;
  },

  async getRecommendation(date) {
    const res = await api.get('/today/recommendation', { params: date ? { date } : {} });
    return res.data;
  },

  async savePlan(data) {
    const res = await api.post('/today/plan', data);
    return res.data;
  },

  async confirmPlan(data) {
    const res = await api.post('/today/plan/confirm', data);
    return res.data;
  },

  async closePlan(data) {
    const res = await api.post('/today/plan/close', data);
    return res.data;
  },

  // Focus Session
  async getActiveFocusSession() {
    const res = await api.get('/focus/active');
    return res.data;
  },

  async startFocusSession(data) {
    const res = await api.post('/focus/start', data);
    return res.data;
  },

  async pauseFocusSession(sessionId, data) {
    const res = await api.post(`/focus/${sessionId}/pause`, data || {});
    return res.data;
  },

  async resumeFocusSession(sessionId, data) {
    const res = await api.post(`/focus/${sessionId}/resume`, data || {});
    return res.data;
  },

  async finishFocusSession(sessionId, data) {
    const res = await api.post(`/focus/${sessionId}/finish`, data || {});
    return res.data;
  },

  async cancelFocusSession(sessionId) {
    const res = await api.post(`/focus/${sessionId}/cancel`);
    return res.data;
  },

  async getFocusHistory(limit) {
    const res = await api.get('/focus/history', { params: limit ? { limit } : {} });
    return res.data;
  },

  // Daily Review
  async getDailyReview(date) {
    const res = await api.get('/daily-review', { params: date ? { date } : {} });
    return res.data;
  },

  async saveDailyReview(data) {
    const res = await api.post('/daily-review', data);
    return res.data;
  },

  // Dashboard
  async getDashboard(date) {
    const res = await api.get('/dashboard', { params: date ? { date } : {} });
    return res.data;
  },
};
