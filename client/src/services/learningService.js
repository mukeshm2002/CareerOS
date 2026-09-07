import api from './api';

export const learningService = {
  // Learning Paths
  getLearningPaths: async (params = {}) => {
    const res = await api.get('/learning', { params });
    return res.data;
  },
  getLearningPath: async (id) => {
    const res = await api.get(`/learning/${id}`);
    return res.data?.path;
  },
  createLearningPath: async (data) => {
    const res = await api.post('/learning', data);
    return res.data?.path;
  },
  updateLearningPath: async (id, data) => {
    const res = await api.put(`/learning/${id}`, data);
    return res.data?.path;
  },
  updatePathStatus: async (id, status) => {
    const res = await api.patch(`/learning/${id}/status`, { status });
    return res.data?.path;
  },
  deleteLearningPath: async (id) => {
    const res = await api.delete(`/learning/${id}`);
    return res.data;
  },

  // Modules
  createModule: async (pathId, data) => {
    const res = await api.post(`/learning/${pathId}/modules`, data);
    return res.data?.module;
  },
  updateModule: async (pathId, moduleId, data) => {
    const res = await api.put(`/learning/${pathId}/modules/${moduleId}`, data);
    return res.data?.module;
  },
  updateModuleStatus: async (pathId, moduleId, status) => {
    const res = await api.patch(`/learning/${pathId}/modules/${moduleId}/status`, { status });
    return res.data?.module;
  },
  deleteModule: async (pathId, moduleId) => {
    const res = await api.delete(`/learning/${pathId}/modules/${moduleId}`);
    return res.data;
  },
  createModuleTask: async (pathId, moduleId, data = {}) => {
    const res = await api.post(`/learning/${pathId}/modules/${moduleId}/task`, data);
    return res.data?.task;
  },
  createProjectFromLearning: async (pathId, data) => {
    const res = await api.post(`/learning/${pathId}/create-project`, data);
    return res.data?.project;
  },
};

export default learningService;
