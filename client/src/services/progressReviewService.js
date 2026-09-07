import api from './api';

export const progressReviewService = {
  // Progress Endpoints
  async getProgress(params = {}) {
    const res = await api.get('/progress', { params });
    return res.data;
  },

  async getTrends(weeks = 8) {
    const res = await api.get('/progress/trends', { params: { weeks } });
    return res.data;
  },

  async getConsistency() {
    const res = await api.get('/progress/consistency');
    return res.data;
  },

  async getSkillsHistory() {
    const res = await api.get('/progress/skills/history');
    return res.data;
  },

  // Weekly Review Endpoints
  async getCurrentWeeklyReview(date) {
    const res = await api.get('/reviews/weekly/current', { params: date ? { date } : {} });
    return res.data;
  },

  async saveWeeklyReviewDraft(data) {
    const res = await api.post('/reviews/weekly/draft', data);
    return res.data;
  },

  async completeWeeklyReview(data) {
    const res = await api.post('/reviews/weekly/complete', data);
    return res.data;
  },

  async getWeeklyReviewHistory(limit = 12) {
    const res = await api.get('/reviews/weekly/history', { params: { limit } });
    return res.data;
  },

  async getWeeklyReviewById(id) {
    const res = await api.get(`/reviews/weekly/${id}`);
    return res.data;
  },
};
