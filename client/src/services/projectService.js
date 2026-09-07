import api from './api';

export const projectService = {
  // Projects
  getProjects: async (params = {}) => {
    const res = await api.get('/projects', { params });
    return res.data;
  },
  getProject: async (id) => {
    const res = await api.get(`/projects/${id}`);
    return res.data?.project;
  },
  createProject: async (data) => {
    const res = await api.post('/projects', data);
    return res.data?.project;
  },
  updateProject: async (id, data) => {
    const res = await api.put(`/projects/${id}`, data);
    return res.data?.project;
  },
  updateProjectStatus: async (id, status) => {
    const res = await api.patch(`/projects/${id}/status`, { status });
    return res.data?.project;
  },
  togglePortfolio: async (id, isPortfolioVisible) => {
    const res = await api.patch(`/projects/${id}/portfolio`, { isPortfolioVisible });
    return res.data?.project;
  },
  deleteProject: async (id) => {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  // Milestones
  getMilestones: async (projectId) => {
    const res = await api.get(`/projects/${projectId}/milestones`);
    return res.data?.milestones;
  },
  createMilestone: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/milestones`, data);
    return res.data?.milestone;
  },
  updateMilestone: async (projectId, milestoneId, data) => {
    const res = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, data);
    return res.data?.milestone;
  },
  updateMilestoneStatus: async (projectId, milestoneId, status) => {
    const res = await api.patch(`/projects/${projectId}/milestones/${milestoneId}/status`, { status });
    return res.data?.milestone;
  },
  deleteMilestone: async (projectId, milestoneId) => {
    const res = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    return res.data;
  },
  createMilestoneTask: async (projectId, milestoneId, data = {}) => {
    const res = await api.post(`/projects/${projectId}/milestones/${milestoneId}/task`, data);
    return res.data?.task;
  },

  // Skills
  addSkill: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/skills`, data);
    return res.data?.projectSkill;
  },
  removeSkill: async (projectId, skillId) => {
    const res = await api.delete(`/projects/${projectId}/skills/${skillId}`);
    return res.data;
  },
};

export default projectService;
