import api from '../../../services/api';

export const goalService = {
  async getGoals(status, growthArea, additionalFilters = {}) {
    let params = {};
    if (typeof status === 'object' && status !== null) {
      params = { ...status };
    } else {
      if (status && status !== 'ALL') params.status = status;
      if (growthArea && growthArea !== 'ALL') params.area = growthArea;
      params = { ...params, ...additionalFilters };
    }
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

  async updateGoalProgress(goalId, progressData) {
    const response = await api.patch(`/goals/${goalId}/progress`, progressData);
    return response.data;
  },

  async updateGoalStatus(goalId, statusPayload) {
    const body = typeof statusPayload === 'string' ? { status: statusPayload } : statusPayload;
    const response = await api.patch(`/goals/${goalId}/status`, body);
    return response.data;
  },

  async deleteGoal(goalId) {
    const response = await api.delete(`/goals/${goalId}`);
    return response.data;
  },

  // Success Criteria
  async addSuccessCriterion(goalId, data) {
    const response = await api.post(`/goals/${goalId}/criteria`, data);
    return response.data;
  },

  async updateSuccessCriterion(goalId, criterionId, data) {
    const response = await api.put(`/goals/${goalId}/criteria/${criterionId}`, data);
    return response.data;
  },

  async toggleSuccessCriterion(goalId, criterionId, isCompleted) {
    const response = await api.patch(`/goals/${goalId}/criteria/${criterionId}/toggle`, { isCompleted });
    return response.data;
  },

  async deleteSuccessCriterion(goalId, criterionId) {
    const response = await api.delete(`/goals/${goalId}/criteria/${criterionId}`);
    return response.data;
  },

  // Goal Check-Ins
  async addCheckIn(goalId, data) {
    const response = await api.post(`/goals/${goalId}/check-ins`, data);
    return response.data;
  },

  async getCheckIns(goalId) {
    const response = await api.get(`/goals/${goalId}/check-ins`);
    return response.data;
  },
};
