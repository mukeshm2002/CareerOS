import api from './api';

export const workLogService = {
  /**
   * Get today's work log for authenticated user
   */
  async getToday() {
    const response = await api.get('/work-logs/today');
    return response.data;
  },

  /**
   * Save or update today's work log
   * @param {Object} data - { workedOn, learned, blockers, nextStep, date }
   */
  async saveToday(data) {
    const response = await api.put('/work-logs/today', data);
    return response.data;
  },

  /**
   * Get work log for a specific local date (YYYY-MM-DD)
   */
  async getByDate(date) {
    const response = await api.get(`/work-logs/${date}`);
    return response.data;
  },

  /**
   * List historical work logs with pagination
   */
  async listHistory(params = { page: 1, limit: 20 }) {
    const response = await api.get('/work-logs', { params });
    return response.data;
  },

  /**
   * Get factual work log consistency stats
   */
  async getStats() {
    const response = await api.get('/work-logs/stats');
    return response.data;
  },
};
