import api from './api';

export const reminderService = {
  listReminders: async (params = {}) => {
    const res = await api.get('/reminders', { params });
    return res.data?.data || res.data;
  },

  getReminderById: async (id) => {
    const res = await api.get(`/reminders/${id}`);
    return res.data?.data || res.data;
  },

  createReminder: async (data) => {
    const res = await api.post('/reminders', data);
    return res.data?.data || res.data;
  },

  updateReminder: async (id, data) => {
    const res = await api.put(`/reminders/${id}`, data);
    return res.data?.data || res.data;
  },

  snoozeReminder: async (id, minutes = 10) => {
    const res = await api.post(`/reminders/${id}/snooze`, { minutes });
    return res.data?.data || res.data;
  },

  cancelReminder: async (id) => {
    const res = await api.post(`/reminders/${id}/cancel`);
    return res.data?.data || res.data;
  },

  toggleReminder: async (id, enabled) => {
    const res = await api.patch(`/reminders/${id}/enabled`, { enabled });
    return res.data?.data || res.data;
  },

  deleteReminder: async (id) => {
    const res = await api.delete(`/reminders/${id}`);
    return res.data?.data || res.data;
  },

  getSettings: async () => {
    const res = await api.get('/reminders/settings');
    return res.data?.data || res.data;
  },

  updateSettings: async (data) => {
    const res = await api.patch('/reminders/settings', data);
    return res.data?.data || res.data;
  },
};
