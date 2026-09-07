import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '../services/onboardingService';
import { useAuthStore } from '../../../store/authStore';

export const ONBOARDING_QUERY_KEY = ['onboarding', 'state'];

export const useOnboarding = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  const stateQuery = useQuery({
    queryKey: ONBOARDING_QUERY_KEY,
    queryFn: async () => {
      const response = await onboardingService.getOnboardingState();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => onboardingService.updateDraftProfile(data),
    onSuccess: (response) => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: response.data?.profile || prev.profile,
        };
      });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: (step) => onboardingService.updateProgressStep(step),
    onSuccess: (response) => {
      queryClient.setQueryData(ONBOARDING_QUERY_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentStep: response.data?.currentStep || prev.currentStep,
        };
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (payload) => onboardingService.completeOnboarding(payload),
    onSuccess: (response) => {
      if (response.data?.user) {
        updateUser(response.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  return {
    onboardingState: stateQuery.data,
    isLoading: stateQuery.isLoading,
    isError: stateQuery.isError,
    error: stateQuery.error,
    updateProfile: updateProfileMutation.mutateAsync,
    updateStep: updateStepMutation.mutateAsync,
    completeOnboarding: completeMutation.mutateAsync,
    isCompleting: completeMutation.isPending,
  };
};
