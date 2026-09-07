import { create } from 'zustand';

const storedAccessToken = localStorage.getItem('careeros_access_token');
const storedRefreshToken = localStorage.getItem('careeros_refresh_token');
const storedUser = localStorage.getItem('careeros_user');

export const useAuthStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  isAuthenticated: !!storedAccessToken,
  isLoading: false,

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('careeros_access_token', accessToken);
    localStorage.setItem('careeros_refresh_token', refreshToken);
    localStorage.setItem('careeros_user', JSON.stringify(user));

    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateUser: (updatedUser) => {
    const mergedUser = { ...updatedUser };
    localStorage.setItem('careeros_user', JSON.stringify(mergedUser));
    set({ user: mergedUser });
  },

  clearAuth: () => {
    localStorage.removeItem('careeros_access_token');
    localStorage.removeItem('careeros_refresh_token');
    localStorage.removeItem('careeros_user');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),
}));
