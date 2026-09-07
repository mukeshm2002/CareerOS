import api from './api';

export const evidenceService = {
  getEvidence: async (params = {}) => {
    const res = await api.get('/evidence', { params });
    return res.data;
  },
  getEvidenceById: async (id) => {
    const res = await api.get(`/evidence/${id}`);
    return res.data?.evidence;
  },
  createEvidence: async (data) => {
    const res = await api.post('/evidence', data);
    return res.data?.evidence;
  },
  updateEvidence: async (id, data) => {
    const res = await api.put(`/evidence/${id}`, data);
    return res.data?.evidence;
  },
  deleteEvidence: async (id) => {
    const res = await api.delete(`/evidence/${id}`);
    return res.data;
  },
  linkSkill: async (evidenceId, data) => {
    const res = await api.post(`/evidence/${evidenceId}/skills`, data);
    return res.data?.evidenceSkill;
  },
  unlinkSkill: async (evidenceId, skillId) => {
    const res = await api.delete(`/evidence/${evidenceId}/skills/${skillId}`);
    return res.data;
  },
  assessSkill: async (data) => {
    const res = await api.post('/evidence/assess-skill', data);
    return res.data?.userSkill;
  },
};

export default evidenceService;
