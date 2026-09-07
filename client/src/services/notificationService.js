import api from './api';

export const notificationService = {
  listNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data?.data || res.data;
  },

  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data?.data || res.data;
  },

  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data?.data || res.data;
  },

  markAllAsRead: async () => {
    const res = await api.post('/notifications/read-all');
    return res.data?.data || res.data;
  },

  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data?.data || res.data;
  },
};
