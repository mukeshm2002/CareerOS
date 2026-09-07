import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { StepProgressBar } from '../features/onboarding/components/StepProgressBar';
import { Step1Welcome } from '../features/onboarding/components/Step1Welcome';
import { Step2Situation } from '../features/onboarding/components/Step2Situation';
import { Step3Goals } from '../features/onboarding/components/Step3Goals';
import { Step4GoalDetails } from '../features/onboarding/components/Step4GoalDetails';
import { Step5Routine } from '../features/onboarding/components/Step5Routine';
import { Step6Skills } from '../features/onboarding/components/Step6Skills';
import { Step7Review } from '../features/onboarding/components/Step7Review';
import { AlertCircle } from 'lucide-react';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const {
    onboardingState,
    isLoading: isServerLoading,
    updateStep,
    updateProfile,
    completeOnboarding,
    isCompleting,
  } = useOnboarding();

  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Detect local IANA timezone
  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  // Draft form data
  const [situation, setSituation] = useState('WORKING_PROFESSIONAL');
  const [selectedGoals, setSelectedGoals] = useState([
    {
      type: 'JOB_SWITCH',
      title: 'Get a better-paying Software Developer role',
      priority: 'HIGH',
      targetDate: '2026-12-31',
      targetRole: 'Full Stack Developer',
      targetSalary: '120,000 / yr',
      salaryCurrency: 'USD',
      description: 'Advance to a higher tier development position.',
    },
    {
      type: 'FREELANCING',
      title: 'Start Freelancing',
      priority: 'HIGH',
      targetDate: '2026-12-31',
      targetRole: 'Freelance Backend Engineer',
      targetSalary: '3,000 / mo',
      salaryCurrency: 'USD',
      description: 'Acquire direct freelance tech clients.',
    },
  ]);

  const [routine, setRoutine] = useState({
    wakeTime: '06:00',
    workStartTime: '08:00',
    workEndTime: '19:00',
    personalStartTime: '19:00',
    personalEndTime: '20:00',
    sleepTime: '22:30',
    availableCareerMinutes: 140,
  });

  const [profile, setProfile] = useState({
    currentRole: 'Software Developer',
    targetRole: 'Full Stack Developer',
    experienceLevel: 'MID_LEVEL',
    timezone: detectedTimezone,
    careerMission: 'Get a better-paying Software Developer role and start freelancing',
  });

  const [skills, setSkills] = useState([
    { name: 'Java', category: 'TECHNICAL', selfRating: 4 },
    { name: 'Spring Boot', category: 'TECHNICAL', selfRating: 3 },
    { name: 'React', category: 'TECHNICAL', selfRating: 3 },
    { name: 'SQL / PostgreSQL', category: 'TECHNICAL', selfRating: 3 },
    { name: 'DSA', category: 'TECHNICAL', selfRating: 2 },
  ]);

  // Sync server onboarding state on initial load
  useEffect(() => {
    if (onboardingState) {
      if (onboardingState.onboardingCompleted) {
        navigate('/app', { replace: true });
        return;
      }

      if (onboardingState.currentStep && onboardingState.currentStep > 1) {
        setStep(onboardingState.currentStep);
      }

      if (onboardingState.profile) {
        const p = onboardingState.profile;
        if (p.currentSituation) setSituation(p.currentSituation);
        if (p.currentRole || p.targetRole || p.experienceLevel) {
          setProfile((prev) => ({
            ...prev,
            currentRole: p.currentRole || prev.currentRole,
            targetRole: p.targetRole || prev.targetRole,
            experienceLevel: p.experienceLevel || prev.experienceLevel,
            timezone: p.timezone || detectedTimezone,
            careerMission: p.careerMission || prev.careerMission,
          }));
        }
        if (p.wakeTime || p.workStartTime || p.availableCareerMinutes) {
          setRoutine((prev) => ({
            ...prev,
            wakeTime: p.wakeTime || prev.wakeTime,
            workStartTime: p.workStartTime || prev.workStartTime,
            workEndTime: p.workEndTime || prev.workEndTime,
            personalStartTime: p.personalStartTime || prev.personalStartTime,
            personalEndTime: p.personalEndTime || prev.personalEndTime,
            sleepTime: p.sleepTime || prev.sleepTime,
            availableCareerMinutes: p.availableCareerMinutes || prev.availableCareerMinutes,
          }));
        }
      }

      // Recover server-persisted onboarding draft (goals, skills, etc.)
      const draft = onboardingState.onboardingDraft || onboardingState.profile?.onboardingDraft;
      if (draft) {
        if (Array.isArray(draft.goals) && draft.goals.length > 0) {
          setSelectedGoals(draft.goals);
        }
        if (Array.isArray(draft.skills) && draft.skills.length > 0) {
          setSkills(draft.skills);
        }
        if (draft.situation) setSituation(draft.situation);
      }
    }
  }, [onboardingState, navigate, detectedTimezone]);

  // Navigate to step and persist draft to backend
  const goToStep = async (nextStep) => {
    setErrorMessage('');
    setStep(nextStep);
    try {
      await updateStep(nextStep);

      // Persist draft state to backend so closing browser resumes with all data
      await updateProfile({
        currentSituation: situation,
        currentRole: profile.currentRole,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        timezone: profile.timezone || detectedTimezone,
        wakeTime: routine.wakeTime,
        workStartTime: routine.workStartTime,
        workEndTime: routine.workEndTime,
        personalStartTime: routine.personalStartTime,
        personalEndTime: routine.personalEndTime,
        sleepTime: routine.sleepTime,
        availableCareerMinutes: routine.availableCareerMinutes,
        careerMission: profile.careerMission,
        onboardingDraft: {
          situation,
          goals: selectedGoals,
          skills,
          routine,
          profile,
        },
      });
    } catch {
      // Allow graceful transition even if background save lags
    }
  };

  const handleToggleGoal = (opt) => {
    const exists = selectedGoals.some((g) => g.type === opt.key);
    if (exists) {
      setSelectedGoals(selectedGoals.filter((g) => g.type !== opt.key));
    } else {
      setSelectedGoals([
        ...selectedGoals,
        {
          type: opt.key,
          title: opt.title,
          priority: 'HIGH',
          targetDate: '2026-12-31',
          targetRole: profile.targetRole || 'Software Professional',
          targetSalary: '100,000 / yr',
          salaryCurrency: 'USD',
          description: '',
        },
      ]);
    }
  };

  const handleUpdateGoal = (index, updates) => {
    setSelectedGoals(
      selectedGoals.map((g, i) => (i === index ? { ...g, ...updates } : g))
    );
  };

  const handleComplete = async () => {
    setErrorMessage('');
    try {
      const payload = {
        situation,
        currentRole: profile.currentRole,
        targetRole: profile.targetRole,
        experienceLevel: profile.experienceLevel,
        timezone: profile.timezone || detectedTimezone,
        wakeTime: routine.wakeTime,
        workStartTime: routine.workStartTime,
        workEndTime: routine.workEndTime,
        personalStartTime: routine.personalStartTime,
        personalEndTime: routine.personalEndTime,
        sleepTime: routine.sleepTime,
        availableCareerMinutes: routine.availableCareerMinutes,
        careerMission: profile.careerMission,
        goals: selectedGoals,
        skills,
      };

      const result = await completeOnboarding(payload);
      if (result?.success) {
        if (user) {
          updateUser({
            ...user,
            onboardingCompleted: true,
          });
        }
        navigate('/app', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete onboarding. Please review your entries.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 md:p-8">
      {/* Top Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-brand-500/30">
            C
          </div>
          <span className="font-bold text-slate-900 tracking-tight">CareerOS</span>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          Personal Career Operating System
        </span>
      </header>

      {/* Main Container Card */}
      <div className="max-w-2xl mx-auto w-full bg-white border border-slate-200/80 rounded-2xl shadow-card p-6 md:p-10 my-4">
        {step > 1 && <StepProgressBar currentStep={step} totalSteps={7} />}

        {errorMessage && (
          <div className="mb-4 flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 1 && <Step1Welcome onNext={() => goToStep(2)} />}

        {step === 2 && (
          <Step2Situation
            value={situation}
            onChange={(val) => setSituation(val)}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        )}

        {step === 3 && (
          <Step3Goals
            selectedGoals={selectedGoals}
            onToggleGoal={handleToggleGoal}
            onNext={() => goToStep(4)}
            onBack={() => goToStep(2)}
          />
        )}

        {step === 4 && (
          <Step4GoalDetails
            goals={selectedGoals}
            onUpdateGoal={handleUpdateGoal}
            onNext={() => goToStep(5)}
            onBack={() => goToStep(3)}
          />
        )}

        {step === 5 && (
          <Step5Routine
            routine={routine}
            onChange={(updates) => setRoutine((r) => ({ ...r, ...updates }))}
            onNext={() => goToStep(6)}
            onBack={() => goToStep(4)}
          />
        )}

        {step === 6 && (
          <Step6Skills
            profile={profile}
            skills={skills}
            onUpdateProfile={(updates) => setProfile((p) => ({ ...p, ...updates }))}
            onUpdateSkills={(newSkills) => setSkills(newSkills)}
            onNext={() => goToStep(7)}
            onBack={() => goToStep(5)}
          />
        )}

        {step === 7 && (
          <Step7Review
            situation={situation}
            goals={selectedGoals}
            routine={routine}
            profile={profile}
            skills={skills}
            isSubmitting={isCompleting}
            onSubmit={handleComplete}
            onBack={() => goToStep(6)}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        CareerOS © 2026 • Your Personal Career Operating System
      </footer>
    </div>
  );
};
