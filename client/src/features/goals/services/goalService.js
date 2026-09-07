import api from '../../../services/api';

export const goalService = {
  async getGoals(status) {
    const params = status ? { status } : {};
    const response = await api.get('/goals', { params });
    return response.data;
  },

  async getGoalById(goalId) {
    const response = await api.get(`/goals/${goalId}`);
    return response.data;
  },

  async createGoal(goalData) {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  async updateGoal(goalId, goalData) {
    const response = await api.put(`/goals/${goalId}`, goalData);
    return response.data;
  },

  async updateGoalStatus(goalId, status) {
    const response = await api.patch(`/goals/${goalId}/status`, { status });
    return response.data;
  },

  async deleteGoal(goalId) {
    const response = await api.delete(`/goals/${goalId}`);
    return response.data;
  },
};
