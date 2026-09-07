import api from '../../../services/api';

export const planningService = {
  // Roadmap
  async getRoadmapByGoal(goalId) {
    const response = await api.get(`/goals/${goalId}/roadmap`);
    return response.data;
  },

  async createRoadmap(goalId, data) {
    const response = await api.post(`/goals/${goalId}/roadmap`, data);
    return response.data;
  },

  async getRoadmapById(roadmapId) {
    const response = await api.get(`/roadmaps/${roadmapId}`);
    return response.data;
  },

  async updateRoadmap(roadmapId, data) {
    const response = await api.put(`/roadmaps/${roadmapId}`, data);
    return response.data;
  },

  async updateRoadmapStatus(roadmapId, status) {
    const response = await api.patch(`/roadmaps/${roadmapId}/status`, { status });
    return response.data;
  },

  async addMilestone(roadmapId, data) {
    const response = await api.post(`/roadmaps/${roadmapId}/milestones`, data);
    return response.data;
  },

  async updateMilestone(milestoneId, data) {
    const response = await api.put(`/milestones/${milestoneId}`, data);
    return response.data;
  },

  async updateMilestoneStatus(milestoneId, status) {
    const response = await api.patch(`/milestones/${milestoneId}/status`, { status });
    return response.data;
  },

  async deleteMilestone(milestoneId) {
    const response = await api.delete(`/milestones/${milestoneId}`);
    return response.data;
  },

  async reorderMilestones(roadmapId, orderedMilestoneIds) {
    const response = await api.post(`/roadmaps/${roadmapId}/milestones/reorder`, { orderedMilestoneIds });
    return response.data;
  },

  async getTemplatePreview(goalType, goalTitle) {
    const response = await api.get(`/roadmap-templates/${goalType}`, {
      params: { goalTitle },
    });
    return response.data;
  },

  // Skills
  async getGlobalSkills(search) {
    const response = await api.get('/skills', { params: { search } });
    return response.data;
  },

  async getUserSkills() {
    const response = await api.get('/user-skills');
    return response.data;
  },

  async upsertUserSkill(data) {
    const response = await api.post('/user-skills', data);
    return response.data;
  },

  async updateUserSkill(id, data) {
    const response = await api.put(`/user-skills/${id}`, data);
    return response.data;
  },

  async deleteUserSkill(id) {
    const response = await api.delete(`/user-skills/${id}`);
    return response.data;
  },

  async getSkillGapsAndReadiness() {
    const response = await api.get('/user-skills/gaps');
    return response.data;
  },

  async getSkillAssessmentHistory(id) {
    const response = await api.get(`/user-skills/${id}/history`);
    return response.data;
  },

  // Tasks
  async getTasks(filters = {}) {
    const response = await api.get('/tasks', { params: filters });
    return response.data;
  },

  async getTaskById(taskId) {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  async createTask(data) {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  async updateTask(taskId, data) {
    const response = await api.put(`/tasks/${taskId}`, data);
    return response.data;
  },

  async updateTaskStatus(taskId, status) {
    const response = await api.patch(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  async deleteTask(taskId) {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  async getTodayFocusRecommendation() {
    const response = await api.get('/tasks/recommendation/today');
    return response.data;
  },

  // Schedule
  async getScheduleBlocks(params = {}) {
    const response = await api.get('/schedule', { params });
    return response.data;
  },

  async createScheduleBlock(data) {
    const response = await api.post('/schedule', data);
    return response.data;
  },

  async updateScheduleBlock(blockId, data) {
    const response = await api.put(`/schedule/${blockId}`, data);
    return response.data;
  },

  async deleteScheduleBlock(blockId) {
    const response = await api.delete(`/schedule/${blockId}`);
    return response.data;
  },

  async planTaskIntoSchedule(taskId, date) {
    const response = await api.post('/schedule/plan-task', { taskId, date });
    return response.data;
  },
};
