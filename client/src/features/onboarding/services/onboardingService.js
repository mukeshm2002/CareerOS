import api from '../../../services/api';

export const onboardingService = {
  async getOnboardingState() {
    const response = await api.get('/onboarding');
    return response.data;
  },

  async updateDraftProfile(profileData) {
    const response = await api.put('/onboarding/profile', profileData);
    return response.data;
  },

  async updateProgressStep(step) {
    const response = await api.put('/onboarding/progress', { step });
    return response.data;
  },

  async completeOnboarding(payload) {
    const response = await api.post('/onboarding/complete', payload);
    return response.data;
  },
};
