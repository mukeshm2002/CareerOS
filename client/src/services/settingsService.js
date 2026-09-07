import api from './api';

export const settingsService = {
  getSettings: async () => {
    const res = await api.get('/settings');
    return res.data?.data || res.data;
  },

  updateProfile: async (profileData) => {
    const res = await api.put('/settings/profile', profileData);
    return res.data?.data || res.data;
  },

  updatePreferences: async (preferencesData) => {
    const res = await api.put('/settings/preferences', preferencesData);
    return res.data?.data || res.data;
  },

  updateNotifications: async (notificationData) => {
    const res = await api.put('/settings/notifications', notificationData);
    return res.data?.data || res.data;
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await api.post('/account/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data?.data || res.data;
  },

  logoutAll: async () => {
    const res = await api.post('/auth/logout-all');
    return res.data?.data || res.data;
  },
};
