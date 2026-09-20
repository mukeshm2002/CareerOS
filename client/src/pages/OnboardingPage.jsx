import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useOnboarding } from '../features/onboarding/hooks/useOnboarding';
import { EythuBrand } from '../components/common/VazhariLogo';
import {
  Briefcase,
  MessageSquare,
  Activity,
  Check,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

const GROWTH_AREAS = [
  {
    id: 'CAREER',
    title: 'Career',
    subtitle: 'Advance in your role, build portfolio projects, and grow your income.',
    icon: Briefcase,
  },
  {
    id: 'COMMUNICATION',
    title: 'Communication',
    subtitle: 'English speaking confidence, clear writing, and presentation skills.',
    icon: MessageSquare,
  },
  {
    id: 'HEALTH',
    title: 'Health',
    subtitle: 'Daily walking, regular exercise, better sleep, and sustained energy.',
    icon: Activity,
  },
];

const DYNAMIC_PRIORITIES = {
  CAREER: [
    {
      id: 'career_role',
      area: 'CAREER',
      type: 'JOB_SWITCH',
      title: 'Advance to a better role / job switch',
      desc: 'Target higher responsibility and compensation.',
    },
    {
      id: 'career_skills',
      area: 'CAREER',
      type: 'SKILL_MASTERY',
      title: 'Master core technical skills',
      desc: 'Close capability gaps and build deep expertise.',
    },
    {
      id: 'career_projects',
      area: 'CAREER',
      type: 'PORTFOLIO',
      title: 'Build impactful projects & portfolio',
      desc: 'Create tangible proof of high-quality work.',
    },
    {
      id: 'career_freelance',
      area: 'CAREER',
      type: 'FREELANCING',
      title: 'Start freelancing or consulting',
      desc: 'Establish independent client revenue.',
    },
  ],
  COMMUNICATION: [
    {
      id: 'comm_speaking',
      area: 'COMMUNICATION',
      type: 'IMPROVE_SPOKEN_ENGLISH',
      title: '10-minute English speaking practice',
      desc: 'Build fluency and reduce hesitation in daily speech.',
    },
    {
      id: 'comm_confidence',
      area: 'COMMUNICATION',
      type: 'SPEAK_MORE_CONFIDENTLY',
      title: 'Speak with confidence in meetings',
      desc: 'Express ideas clearly without second-guessing.',
    },
    {
      id: 'comm_writing',
      area: 'COMMUNICATION',
      type: 'IMPROVE_WRITING',
      title: 'Clear professional writing',
      desc: 'Craft concise emails, proposals, and documents.',
    },
    {
      id: 'comm_interview',
      area: 'COMMUNICATION',
      type: 'IMPROVE_INTERVIEW_COMMUNICATION',
      title: 'Interview & presentation prep',
      desc: 'Articulate thoughts crisply under evaluation.',
    },
  ],
  HEALTH: [
    {
      id: 'health_walk',
      area: 'HEALTH',
      type: 'WALKING_STEPS',
      title: 'Daily 20-minute walk',
      desc: 'Clear mental fog and maintain daily physical movement.',
    },
    {
      id: 'health_exercise',
      area: 'HEALTH',
      type: 'BUILD_EXERCISE_HABIT',
      title: 'Consistent exercise routine',
      desc: 'Build strength and cardiovascular fitness.',
    },
    {
      id: 'health_sleep',
      area: 'HEALTH',
      type: 'IMPROVE_SLEEP',
      title: 'Consistent sleep & evening wind-down',
      desc: 'Wake up refreshed with regular sleep timing.',
    },
    {
      id: 'health_energy',
      area: 'HEALTH',
      type: 'RELAXATION_STRESS_ROUTINE',
      title: 'Stress reduction & daily energy',
      desc: 'Maintain stamina without midday exhaustion.',
    },
  ],
};

const COMMITMENT_OPTIONS = [
  {
    minutes: 30,
    title: '30 min / day',
    pace: '3.5 hours per week',
    desc: 'Low friction, ideal for steady daily consistency.',
  },
  {
    minutes: 45,
    title: '45 min / day',
    badge: 'Recommended',
    pace: '5.25 hours per week',
    desc: 'Balanced pace for career execution and balance.',
  },
  {
    minutes: 60,
    title: '60 min / day',
    pace: '7 hours per week',
    desc: 'Fast-track your skills and primary goals.',
  },
  {
    minutes: 90,
    title: '90 min / day',
    pace: '10.5 hours per week',
    desc: 'Deep focus immersion for rapid progress.',
  },
];

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const { onboardingState, completeOnboarding, isCompleting } = useOnboarding();

  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1 State: Areas to improve (multi-select)
  const [selectedAreas, setSelectedAreas] = useState(['CAREER', 'COMMUNICATION']);

  // Step 2 State: Priorities selected
  const [selectedPriorities, setSelectedPriorities] = useState(['career_role', 'comm_speaking']);

  // Step 3 State: Daily Commitment
  const [dailyCommitment, setDailyCommitment] = useState(45);

  const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';

  useEffect(() => {
    if (onboardingState?.onboardingCompleted) {
      navigate('/app', { replace: true });
    }
  }, [onboardingState, navigate]);

  const toggleArea = (areaId) => {
    if (selectedAreas.includes(areaId)) {
      if (selectedAreas.length === 1) return; // Keep at least one
      setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
      // Remove any priorities belonging to this area
      const availablePriorities = Object.entries(DYNAMIC_PRIORITIES)
        .filter(([key]) => key !== areaId)
        .flatMap(([, items]) => items.map((i) => i.id));
      setSelectedPriorities(selectedPriorities.filter((pId) => availablePriorities.includes(pId)));
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
      // Pre-select first priority from added area
      const firstItem = DYNAMIC_PRIORITIES[areaId]?.[0];
      if (firstItem && !selectedPriorities.includes(firstItem.id)) {
        setSelectedPriorities([...selectedPriorities, firstItem.id]);
      }
    }
  };

  const togglePriority = (priorityId) => {
    if (selectedPriorities.includes(priorityId)) {
      if (selectedPriorities.length === 1) return; // Keep at least one
      setSelectedPriorities(selectedPriorities.filter((id) => id !== priorityId));
    } else {
      setSelectedPriorities([...selectedPriorities, priorityId]);
    }
  };

  // Compile active priorities for Step 2
  const activePriorityOptions = selectedAreas.flatMap((area) => DYNAMIC_PRIORITIES[area] || []);

  const handleFinish = async () => {
    setErrorMessage('');
    try {
      // Build goals array conforming to onboarding validator
      const allPriorities = Object.values(DYNAMIC_PRIORITIES).flat();
      const chosen = allPriorities.filter((p) => selectedPriorities.includes(p.id));

      const goals = chosen.map((item) => ({
        title: item.title,
        description: item.desc,
        type: item.type,
        priority: 'HIGH',
        targetDate: '2026-12-31',
        targetRole: 'Software Professional',
        targetSalary: '100,000 / yr',
        salaryCurrency: 'USD',
      }));

      // Fallback if none matched
      if (goals.length === 0) {
        goals.push({
          title: 'Advance my career and daily momentum',
          type: 'JOB_SWITCH',
          priority: 'HIGH',
          targetDate: '2026-12-31',
          targetRole: 'Software Professional',
          targetSalary: '100,000 / yr',
          salaryCurrency: 'USD',
        });
      }

      const payload = {
        situation: 'WORKING_PROFESSIONAL',
        currentRole: 'Professional',
        targetRole: 'Senior Professional',
        experienceLevel: 'MID_LEVEL',
        timezone: detectedTimezone,
        availableCareerMinutes: dailyCommitment,
        goals,
        skills: [
          { name: 'Core Focus', category: 'TECHNICAL', selfRating: 4 },
          { name: 'Communication', category: 'COMMUNICATION', selfRating: 3 },
        ],
      };

      const result = await completeOnboarding(payload);
      if (result?.success) {
        if (user) {
          updateUser({
            ...user,
            onboardingCompleted: true,
          });
        }
        navigate('/app/today', { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to complete setup. Please try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-[#F8FAFC] flex flex-col justify-between p-4 sm:p-8 select-none">
      {/* Top Header */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between py-2">
        <EythuBrand size="sm" variant="icon-wordmark" />
        <span className="text-[11px] font-medium text-[#64748B]">
          Step {step} of 4
        </span>
      </header>

      {/* Main Form Container */}
      <div className="max-w-md mx-auto w-full my-auto py-4">
        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[#F87171] text-xs">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: What do you want to improve? */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#F8FAFC]">
                What do you want to improve?
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Select the areas of your life you want to develop. You can change these anytime.
              </p>
            </div>

            <div className="space-y-2.5">
              {GROWTH_AREAS.map((area) => {
                const isSelected = selectedAreas.includes(area.id);
                const Icon = area.icon;

                return (
                  <div
                    key={area.id}
                    onClick={() => toggleArea(area.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#151D2B] border-[#FF7A00]/60'
                        : 'bg-[#111827] border-[#253044] hover:border-[#33435C]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#FF7A00]/15 text-[#FF7A00]'
                            : 'bg-[#151D2B] text-[#94A3B8]'
                        }`}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-sm font-semibold text-[#F8FAFC]">{area.title}</h3>
                        <p className="text-xs text-[#94A3B8] leading-relaxed">{area.subtitle}</p>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? 'bg-[#FF7A00] text-white'
                          : 'border border-[#253044] bg-[#0B0F17]'
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* STEP 2: What matters most right now? */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#F8FAFC]">
                What matters most right now?
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Pick the primary goals to build your daily focus around.
              </p>
            </div>

            <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
              {activePriorityOptions.map((priority) => {
                const isSelected = selectedPriorities.includes(priority.id);

                return (
                  <div
                    key={priority.id}
                    onClick={() => togglePriority(priority.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#151D2B] border-[#FF7A00]/60'
                        : 'bg-[#111827] border-[#253044] hover:border-[#33435C]'
                    }`}
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A00]">
                          {priority.area}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#F8FAFC]">{priority.title}</h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">{priority.desc}</p>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 mt-1 transition-colors ${
                        isSelected
                          ? 'bg-[#FF7A00] text-white'
                          : 'border border-[#253044] bg-[#0B0F17]'
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-12 px-4 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-medium transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-12 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Set a realistic weekly commitment */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#F8FAFC]">
                Set a realistic weekly commitment.
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Small, consistent actions compound faster than sporadic bursts.
              </p>
            </div>

            <div className="space-y-2.5">
              {COMMITMENT_OPTIONS.map((opt) => {
                const isSelected = dailyCommitment === opt.minutes;

                return (
                  <div
                    key={opt.minutes}
                    onClick={() => setDailyCommitment(opt.minutes)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#151D2B] border-[#FF7A00]/60'
                        : 'bg-[#111827] border-[#253044] hover:border-[#33435C]'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-[#F8FAFC]">{opt.title}</h4>
                        {opt.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF7A00] bg-[#FF7A00]/15 px-2 py-0.5 rounded-full">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] font-medium">{opt.pace}</p>
                      <p className="text-xs text-[#64748B]">{opt.desc}</p>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'border-2 border-[#FF7A00] bg-[#FF7A00]'
                          : 'border border-[#253044] bg-[#0B0F17]'
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="h-12 px-4 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] text-sm font-medium transition cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex-1 h-12 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
              >
                <span>Review Workspace</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Your EYTHU workspace is ready */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
                <ShieldCheck size={20} strokeWidth={2.2} />
              </div>
              <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#F8FAFC]">
                Your EYTHU workspace is ready.
              </h1>
              <p className="text-sm text-[#94A3B8]">
                Here is your customized setup for daily progress:
              </p>
            </div>

            {/* Summary card */}
            <div className="p-4 rounded-xl bg-[#111827] border border-[#253044] space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#253044]">
                <span className="text-[#64748B] uppercase font-semibold text-[10px] tracking-wider">
                  Growth Areas
                </span>
                <div className="flex items-center gap-1.5">
                  {selectedAreas.map((area) => (
                    <span
                      key={area}
                      className="px-2 py-0.5 rounded-md bg-[#151D2B] border border-[#253044] text-[#F8FAFC] font-medium text-[11px]"
                    >
                      {area.charAt(0) + area.slice(1).toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-[#253044]">
                <span className="text-[#64748B] uppercase font-semibold text-[10px] tracking-wider">
                  Daily Commitment
                </span>
                <span className="text-[#FF7A00] font-semibold text-xs flex items-center gap-1">
                  <Clock size={12} />
                  {dailyCommitment} min / day
                </span>
              </div>

              <div>
                <span className="text-[#64748B] uppercase font-semibold text-[10px] tracking-wider block mb-1.5">
                  Selected Priorities ({selectedPriorities.length})
                </span>
                <ul className="space-y-1 text-[#94A3B8]">
                  {selectedPriorities.slice(0, 3).map((pId) => {
                    const found = Object.values(DYNAMIC_PRIORITIES).flat().find((p) => p.id === pId);
                    return (
                      <li key={pId} className="flex items-center gap-2 text-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                        <span className="truncate text-[#F8FAFC]">{found?.title || pId}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleFinish}
                disabled={isCompleting}
                className="w-full h-12 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isCompleting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enter EYTHU Workspace</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-2 text-center text-xs text-[#64748B] hover:text-[#94A3B8] transition"
              >
                Adjust commitments
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Creator endorsement */}
      <footer className="text-center text-xs text-[#64748B] py-2">
        EYTHU — A product by TamZode Technology
      </footer>
    </div>
  );
};
