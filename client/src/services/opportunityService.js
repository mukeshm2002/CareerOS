import api from './api';

export const opportunityService = {
  // Jobs
  getJobs: async (params = {}) => {
    const res = await api.get('/opportunities/jobs', { params });
    return res.data;
  },
  getJob: async (id) => {
    const res = await api.get(`/opportunities/jobs/${id}`);
    return res.data?.job;
  },
  createJob: async (data) => {
    const res = await api.post('/opportunities/jobs', data);
    return res.data?.job;
  },
  updateJob: async (id, data) => {
    const res = await api.put(`/opportunities/jobs/${id}`, data);
    return res.data?.job;
  },
  updateJobStatus: async (id, data) => {
    const res = await api.patch(`/opportunities/jobs/${id}/status`, data);
    return res.data?.job;
  },
  addJobActivity: async (id, data) => {
    const res = await api.post(`/opportunities/jobs/${id}/activity`, data);
    return res.data?.activity;
  },
  createJobTask: async (id, data) => {
    const res = await api.post(`/opportunities/jobs/${id}/task`, data);
    return res.data?.task;
  },
  toggleJobArchive: async (id) => {
    const res = await api.patch(`/opportunities/jobs/${id}/archive`);
    return res.data?.job;
  },
  deleteJob: async (id) => {
    const res = await api.delete(`/opportunities/jobs/${id}`);
    return res.data;
  },

  // Freelance
  getFreelance: async (params = {}) => {
    const res = await api.get('/opportunities/freelance', { params });
    return res.data;
  },
  getFreelanceById: async (id) => {
    const res = await api.get(`/opportunities/freelance/${id}`);
    return res.data?.freelance;
  },
  createFreelance: async (data) => {
    const res = await api.post('/opportunities/freelance', data);
    return res.data?.freelance;
  },
  updateFreelance: async (id, data) => {
    const res = await api.put(`/opportunities/freelance/${id}`, data);
    return res.data?.freelance;
  },
  updateFreelanceStatus: async (id, data) => {
    const res = await api.patch(`/opportunities/freelance/${id}/status`, data);
    return res.data?.freelance;
  },
  addFreelanceActivity: async (id, data) => {
    const res = await api.post(`/opportunities/freelance/${id}/activity`, data);
    return res.data?.activity;
  },
  createFreelanceTask: async (id, data) => {
    const res = await api.post(`/opportunities/freelance/${id}/task`, data);
    return res.data?.task;
  },
  toggleFreelanceArchive: async (id) => {
    const res = await api.patch(`/opportunities/freelance/${id}/archive`);
    return res.data?.freelance;
  },
  deleteFreelance: async (id) => {
    const res = await api.delete(`/opportunities/freelance/${id}`);
    return res.data;
  },

  // Internships
  getInternships: async (params = {}) => {
    const res = await api.get('/opportunities/internships', { params });
    return res.data;
  },
  getInternshipById: async (id) => {
    const res = await api.get(`/opportunities/internships/${id}`);
    return res.data?.internship;
  },
  createInternship: async (data) => {
    const res = await api.post('/opportunities/internships', data);
    return res.data?.internship;
  },
  updateInternship: async (id, data) => {
    const res = await api.put(`/opportunities/internships/${id}`, data);
    return res.data?.internship;
  },
  updateInternshipStatus: async (id, data) => {
    const res = await api.patch(`/opportunities/internships/${id}/status`, data);
    return res.data?.internship;
  },
  addInternshipActivity: async (id, data) => {
    const res = await api.post(`/opportunities/internships/${id}/activity`, data);
    return res.data?.activity;
  },
  createInternshipTask: async (id, data) => {
    const res = await api.post(`/opportunities/internships/${id}/task`, data);
    return res.data?.task;
  },
  toggleInternshipArchive: async (id) => {
    const res = await api.patch(`/opportunities/internships/${id}/archive`);
    return res.data?.internship;
  },
  deleteInternship: async (id) => {
    const res = await api.delete(`/opportunities/internships/${id}`);
    return res.data;
  },

  // Metrics
  getMetrics: async () => {
    const res = await api.get('/opportunities/metrics');
    return res.data?.metrics;
  },

  // Goals for linking
  getGoals: async () => {
    const res = await api.get('/goals');
    return res.data?.goals || res.data?.data || [];
  },
};
