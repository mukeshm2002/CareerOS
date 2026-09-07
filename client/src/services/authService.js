import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async logout(refreshToken) {
    try {
      const response = await api.post('/auth/logout', { refreshToken });
      return response.data;
    } catch {
      // Allow silent logout failure if server is unreachable
      return { success: true };
    }
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
