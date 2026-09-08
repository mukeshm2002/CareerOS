import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { executionService } from '../services/executionService';
import { planningService } from '../features/planning/services/planningService';
import { workLogService } from '../services/workLogService';
import { QuickNoteSheet } from '../components/workLog/QuickNoteSheet';
import { useAuthStore } from '../store/authStore';
import {
  SunMedium,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  X,
  Check,
  RotateCcw,
  Target,
  ListTodo,
  TrendingUp,
  Moon,
  ChevronRight,
  ShieldCheck,
  FileText,
  Edit3,
  Plus,
} from 'lucide-react';

const ENERGY_OPTIONS = [
  { value: 'VERY_LOW', label: 'Very Low' },
  { value: 'LOW', label: 'Low' },
  { value: 'OKAY', label: 'Okay' },
  { value: 'GOOD', label: 'Good' },
  { value: 'HIGH', label: 'High' },
];

function formatMinutes(min) {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatTimerDigits(totalSec) {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const MyDayPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Queries
  const {
    data: todayData,
    isLoading: isTodayLoading,
    isError: isTodayError,
    refetch: refetchToday,
  } = useQuery({
    queryKey: ['todayContext'],
    queryFn: () => executionService.getToday(),
  });

  const { data: activeFocusData } = useQuery({
    queryKey: ['activeFocusSession'],
    queryFn: () => executionService.getActiveFocusSession(),
    refetchInterval: 4000,
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => executionService.getDashboard(),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'all-incomplete'],
    queryFn: () => planningService.getTasks({ status: 'TODO' }),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['dailyReview'],
    queryFn: () => executionService.getDailyReview(),
  });

  const { data: workLogData } = useQuery({
    queryKey: ['workLog', 'today'],
    queryFn: () => workLogService.getToday(),
  });

  // Modals & UI States
  const [showChooseModal, setShowChooseModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showNoteSheet, setShowNoteSheet] = useState(false);
  const [taskOutcome, setTaskOutcome] = useState('NOT_YET');
  const [sessionNotes, setSessionNotes] = useState('');

  // Daily Review Form State
  const [completedSummary, setCompletedSummary] = useState('');
  const [learnedSummary, setLearnedSummary] = useState('');
  const [blockerSummary, setBlockerSummary] = useState('');
  const [tomorrowTaskId, setTomorrowTaskId] = useState('');
  const [energyLevel, setEnergyLevel] = useState('OKAY');
  const [reviewSavedSuccess, setReviewSavedSuccess] = useState(false);

  // Sync Review Data when loaded
  useEffect(() => {
    if (reviewData?.data) {
      const r = reviewData.data;
      if (r.completedSummary) setCompletedSummary(r.completedSummary);
      if (r.learnedSummary || r.learnings) setLearnedSummary(r.learnedSummary || r.learnings);
      if (r.blockerSummary || r.blockers) setBlockerSummary(r.blockerSummary || r.blockers);
      if (r.tomorrowMainTaskId) setTomorrowTaskId(r.tomorrowMainTaskId);
      if (r.energyLevel) setEnergyLevel(r.energyLevel);
    }
  }, [reviewData]);

  // Work Log (Phase 2B Step 1)
  const currentWorkLog = workLogData?.data ?? todayData?.data?.todayWorkLog ?? null;
  const hasWorkNote = Boolean(
    currentWorkLog && (
      currentWorkLog.workedOn?.trim() ||
      currentWorkLog.learned?.trim() ||
      currentWorkLog.blockers?.trim() ||
      currentWorkLog.nextStep?.trim()
    )
  );

  // Derived Active Session and Timer
  const activeSession = activeFocusData?.data || todayData?.data?.activeFocusSession;
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  useEffect(() => {
    if (!activeSession || activeSession.status === 'COMPLETED' || activeSession.status === 'CANCELLED') {
      setSecondsLeft(0);
      return;
    }

    const isPaused = activeSession.status === 'PAUSED';
    setIsTimerPaused(isPaused);

    const calcRemaining = () => {
      const now = isPaused && activeSession.pausedAt ? new Date(activeSession.pausedAt).getTime() : Date.now();
      const started = new Date(activeSession.startedAt).getTime();
      const totalPauseMs = (activeSession.totalPausedSeconds || 0) * 1000;
      const plannedMs = (activeSession.plannedMinutes || 25) * 60 * 1000;
      const elapsedActiveMs = Math.max(0, now - started - totalPauseMs);
      const remainingSec = Math.max(0, Math.floor((plannedMs - elapsedActiveMs) / 1000));
      setSecondsLeft(remainingSec);
    };

    calcRemaining();
    if (!isPaused) {
      const interval = setInterval(calcRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [activeSession]);

  // Mutations
  const confirmPlanMutation = useMutation({
    mutationFn: (data) => executionService.confirmPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: (data) => executionService.savePlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setShowChooseModal(false);
    },
  });

  const startFocusMutation = useMutation({
    mutationFn: (data) => executionService.startFocusSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['activeFocusSession'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const pauseFocusMutation = useMutation({
    mutationFn: (sessionId) => executionService.pauseFocusSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFocusSession'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
    },
  });

  const resumeFocusMutation = useMutation({
    mutationFn: (sessionId) => executionService.resumeFocusSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFocusSession'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
    },
  });

  const finishFocusMutation = useMutation({
    mutationFn: ({ sessionId, data }) => executionService.finishFocusSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFocusSession'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowFinishModal(false);
    },
  });

  const cancelFocusMutation = useMutation({
    mutationFn: (sessionId) => executionService.cancelFocusSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeFocusSession'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const saveReviewMutation = useMutation({
    mutationFn: (data) => executionService.saveDailyReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyReview'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setReviewSavedSuccess(true);
      setTimeout(() => {
        setReviewSavedSuccess(false);
        setShowReviewModal(false);
      }, 1200);
    },
  });

  // Mobile Loading Skeletons
  if (isTodayLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto animate-pulse">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-36 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-56 bg-slate-200/70 dark:bg-slate-800/70 rounded-2xl" />
        <div className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-40 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
        <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
      </div>
    );
  }

  // Mobile Error State
  if (isTodayError || !todayData?.data) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 dark:bg-[#EF4444]/10 border border-rose-200 dark:border-[#EF4444]/30 text-rose-600 dark:text-[#F87171] flex items-center justify-center mx-auto shadow-xs">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">We couldn't load today.</h2>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-xs mx-auto">
          Please check your connection and try loading your day again.
        </p>
        <button
          onClick={() => refetchToday()}
          className="h-11 px-6 bg-[#6C5CE7] hover:bg-[#5B4CE0] dark:bg-[#8B7CF6] dark:hover:bg-[#A294FF] active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const context = todayData.data;
  const plan = context.todayPlan;
  const recommendation = context.recommendation;
  const currentMainTask = plan?.mainTask || recommendation?.recommendedTask;
  const secondaryTasks = plan?.secondaryTasks || [];
  const incompleteTasks = tasksData?.data || [];
  const weekly = dashboardData?.data?.weeklyExecution;

  // Up Next candidates: secondary tasks first, then fallback to other incomplete tasks
  const upNextList = [];
  if (secondaryTasks.length > 0) {
    secondaryTasks.forEach((st) => {
      if (st.task && st.task.id !== currentMainTask?.id) {
        upNextList.push(st.task);
      }
    });
  }
  if (upNextList.length < 3 && incompleteTasks.length > 0) {
    incompleteTasks.forEach((t) => {
      if (
        t.id !== currentMainTask?.id &&
        !upNextList.some((existing) => existing.id === t.id) &&
        upNextList.length < 3
      ) {
        upNextList.push(t);
      }
    });
  }

  // Schedule list
  const scheduleItems = (context.todaySchedule || []).slice(0, 4);

  // Time & Greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDateFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const firstName = user?.fullName?.split(' ')[0] || 'there';

  const handleStartFocus = () => {
    if (!currentMainTask) return;
    startFocusMutation.mutate({
      taskId: currentMainTask.id,
      dailyPlanId: plan?.id,
      plannedMinutes: currentMainTask.estimatedMinutes || 25,
    });
  };

  const handleSelectDifferentTask = (taskId) => {
    savePlanMutation.mutate({
      mainTaskId: taskId,
      date: context.date,
      status: 'CONFIRMED',
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6 max-w-xl lg:max-w-4xl mx-auto">
      {/* 1. Greeting & Date Header (Section 10) */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-[13px] sm:text-sm text-slate-500 dark:text-[#94A3B8] font-normal">
          {todayDateFormatted}
        </p>
        <p className="text-sm text-slate-600 dark:text-[#CBD5E1] pt-0.5">
          Focus on one meaningful career action.
        </p>
      </div>

      {/* 2. Today's Main Focus Card — Hero Component (Section 11, 12, 13) */}
      <div className="bg-white dark:bg-[#121829] rounded-[18px] border border-[#6C5CE7]/30 dark:border-[#8B7CF6]/40 p-5 sm:p-6 shadow-xs transition-all">
        {/* State A: Active Focus In Progress (Section 14) */}
        {activeSession ? (
          <div className="space-y-5 text-center py-2">
            <div className="flex items-center justify-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isTimerPaused ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isTimerPaused ? 'bg-[#F59E0B]' : 'bg-[#22C55E]'
                  }`}
                />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1]">
                {isTimerPaused ? 'Focus Paused' : 'Focused'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-[22px] font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug max-w-md mx-auto">
                {activeSession.task?.title || 'Deep Focus Session'}
              </h2>
              {activeSession.task?.goal && (
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
                  {activeSession.task.goal.title}
                </p>
              )}
            </div>

            {/* Large Center-Aligned Timer (44-52px tabular numbers) */}
            <div className="py-2">
              <div className="text-[46px] sm:text-[52px] font-medium font-mono tracking-tight tabular-nums text-slate-900 dark:text-[#F8FAFC] leading-none">
                {formatTimerDigits(secondsLeft)}
              </div>
              <span className="text-xs text-slate-400 dark:text-[#94A3B8] mt-2 block">
                Planned: {activeSession.plannedMinutes || 25} min
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {isTimerPaused ? (
                <button
                  onClick={() => resumeFocusMutation.mutate(activeSession.id)}
                  disabled={resumeFocusMutation.isPending}
                  className="h-[48px] px-6 rounded-xl bg-[#16A34A] hover:bg-[#15803d] dark:bg-[#22C55E] active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
                >
                  <Play size={16} strokeWidth={2} />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={() => pauseFocusMutation.mutate(activeSession.id)}
                  disabled={pauseFocusMutation.isPending}
                  className="h-[48px] px-6 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#181F34] dark:hover:bg-[#1D2540] active:scale-95 text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs flex items-center gap-2 border border-slate-200 dark:border-[#28324A] transition"
                >
                  <Pause size={16} strokeWidth={2} />
                  <span>Pause</span>
                </button>
              )}

              <button
                onClick={() => setShowFinishModal(true)}
                className="h-[48px] px-6 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD8] active:bg-[#4C3FC7] dark:bg-[#8B7CF6] dark:hover:bg-[#9D91FF] active:scale-95 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition"
              >
                <CheckCircle2 size={16} strokeWidth={2} />
                <span>Finish Session</span>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Cancel this focus session?')) {
                    cancelFocusMutation.mutate(activeSession.id);
                  }
                }}
                className="h-[48px] px-4 rounded-xl text-slate-400 hover:text-[#EF4444] dark:hover:text-[#F87171] text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : currentMainTask ? (
          /* State B: Ready to Focus */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6C5CE7] dark:text-[#8B7CF6] uppercase tracking-wider bg-[#EFEDFF] dark:bg-[#272344] px-3 py-1 rounded-full border border-[#6C5CE7]/20 dark:border-[#8B7CF6]/30">
                <Target size={14} strokeWidth={2} />
                TODAY'S FOCUS
              </span>
              <button
                onClick={() => setShowChooseModal(true)}
                className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] dark:text-[#8B7CF6] dark:hover:text-[#9D91FF] font-medium py-1 px-2 rounded-lg hover:bg-brand-50 dark:hover:bg-[#272344] transition-colors"
              >
                Change focus
              </button>
            </div>

            <div className="space-y-2.5">
              <h2 className="text-xl sm:text-[22px] font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug">
                {currentMainTask.title}
              </h2>

              {/* Maximum 3 metadata chips: Goal, Duration, Priority/Due */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {currentMainTask.goal && (
                  <span className="font-medium text-slate-700 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#181F34] px-2.5 py-1 rounded-lg">
                    {currentMainTask.goal.title}
                  </span>
                )}
                <span className="font-medium text-slate-600 dark:text-[#CBD5E1] bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Clock size={12} className="text-slate-400 dark:text-[#94A3B8]" />
                  {currentMainTask.estimatedMinutes || 30} min
                </span>
                <span className="font-semibold text-[#6C5CE7] dark:text-[#8B7CF6] bg-[#EFEDFF] dark:bg-[#272344] px-2.5 py-1 rounded-lg">
                  {currentMainTask.priority || 'HIGH'} PRIORITY
                </span>
              </div>
            </div>

            {/* Primary Action Button (50-52px height, full width on mobile) */}
            <div className="pt-2">
              <button
                onClick={handleStartFocus}
                disabled={startFocusMutation.isPending}
                className="w-full h-[52px] rounded-[14px] bg-[#6C5CE7] hover:bg-[#5B4BD8] active:bg-[#4C3FC7] dark:bg-[#8B7CF6] dark:hover:bg-[#9D91FF] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition duration-200"
              >
                <Play size={17} strokeWidth={2} />
                <span>Start Focus</span>
              </button>
            </div>
          </div>
        ) : (
          /* State C: No Focus Selected (Empty State) */
          <div className="text-center py-6 space-y-3">
            <ShieldCheck size={36} className="text-[#22C55E] dark:text-[#34D399] mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-[#F8FAFC]">You're clear for today.</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-xs mx-auto">
                Choose one meaningful task for today.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setShowChooseModal(true)}
                className="h-11 px-5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD8] active:bg-[#4C3FC7] dark:bg-[#8B7CF6] dark:hover:bg-[#9D91FF] text-white text-xs font-semibold shadow-xs transition"
              >
                Choose Focus
              </button>
              <Link
                to="/app/goals"
                className="h-11 px-4 rounded-xl bg-slate-100 dark:bg-[#181F34] hover:bg-slate-200 dark:hover:bg-[#1D2540] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold flex items-center transition"
              >
                View Plan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 3. Up Next (Section 15) & Schedule Grid on Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Up Next Card */}
        <div className="bg-white dark:bg-[#121829] rounded-2xl border border-slate-200/80 dark:border-[#28324A] p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-[#64748B] uppercase tracking-wider">
              UP NEXT
            </h3>
            <Link
              to="/app/tasks"
              className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] dark:text-[#8B7CF6] dark:hover:text-[#9D91FF] font-semibold flex items-center gap-0.5 hover:underline"
            >
              View all tasks
              <ChevronRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {upNextList.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-[#28324A]">
              {upNextList.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectDifferentTask(t.id)}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className="h-3.5 w-3.5 rounded-full border border-slate-300 dark:border-slate-600 group-hover:border-[#6C5CE7] dark:group-hover:border-[#8B7CF6] shrink-0 transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC] truncate group-hover:text-[#6C5CE7] dark:group-hover:text-[#8B7CF6] transition-colors">{t.title}</p>
                      <p className="text-xs text-slate-400 dark:text-[#94A3B8] truncate mt-0.5">
                        {t.goal?.title || 'Career Task'} · {t.estimatedMinutes || 30} min
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 dark:text-[#94A3B8] shrink-0">
                    {t.estimatedMinutes || 30}m
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-[#64748B] italic py-2">No upcoming tasks queued.</p>
          )}
        </div>

        {/* 4. Today's Schedule (Section 16) */}
        <div className="bg-white dark:bg-[#121829] rounded-2xl border border-slate-200/80 dark:border-[#28324A] p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-[#64748B] uppercase tracking-wider">
              TODAY'S SCHEDULE
            </h3>
            <Link
              to="/app/schedule"
              className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] dark:text-[#8B7CF6] dark:hover:text-[#9D91FF] font-semibold flex items-center gap-0.5 hover:underline"
            >
              Schedule
              <ChevronRight size={14} strokeWidth={2} />
            </Link>
          </div>

          {scheduleItems.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-[#28324A]">
              {scheduleItems.map((block, idx) => (
                <div
                  key={block.id}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-[#94A3B8] w-16 shrink-0">
                    {block.startTime}
                  </span>
                  <span className={`h-2 w-2 rounded-full shrink-0 ${idx === 0 ? 'bg-[#6C5CE7] dark:bg-[#8B7CF6]' : 'bg-slate-300 dark:bg-slate-700'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 dark:text-[#F8FAFC] truncate">{block.title}</p>
                  </div>
                  <span className="text-[11px] text-slate-400 dark:text-[#64748B] font-medium shrink-0">
                    {block.category || 'Career'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-[#64748B] italic py-2">No scheduled time blocks today.</p>
          )}
        </div>
      </div>

      {/* 5. Quick Weekly Progress (Section 17) */}
      <div className="bg-white dark:bg-[#121829] rounded-2xl border border-slate-200/80 dark:border-[#28324A] p-4 sm:p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-400 dark:text-[#64748B] uppercase tracking-wider">
            THIS WEEK
          </h3>
          <Link
            to="/app/progress"
            className="text-xs text-[#6C5CE7] hover:text-[#5B4BD8] dark:text-[#8B7CF6] dark:hover:text-[#9D91FF] font-semibold flex items-center gap-0.5 hover:underline"
          >
            View progress
            <ChevronRight size={14} strokeWidth={2} />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center pt-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181F34] border border-slate-100 dark:border-[#28324A]">
            <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC] block">
              {formatMinutes(weekly?.totalFocusMinutes || 0)}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5 block">
              Focused
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181F34] border border-slate-100 dark:border-[#28324A]">
            <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC] block">
              {weekly?.tasksCompleted || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5 block">
              Tasks
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181F34] border border-slate-100 dark:border-[#28324A]">
            <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-[#F8FAFC] block">
              {weekly?.activeDays || 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5 block">
              Active days
            </span>
          </div>
        </div>
      </div>

      {/* 5b. Today's Notes / Career Journal (Phase 2B Step 1) */}
      <div className="bg-white dark:bg-[#121829] border border-slate-200/80 dark:border-[#28324A] rounded-2xl p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#6C5CE7] dark:text-[#8B7CF6]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#CBD5E1]">
              Today's Notes
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/app/work-log"
              className="text-xs font-medium text-slate-500 dark:text-[#94A3B8] hover:text-[#6C5CE7] dark:hover:text-[#8B7CF6] flex items-center gap-0.5 transition"
            >
              <span>Journal</span>
              <ChevronRight size={13} />
            </Link>
            {hasWorkNote && (
              <button
                type="button"
                onClick={() => setShowNoteSheet(true)}
                className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#181F34] dark:hover:bg-[#28324A] text-slate-700 dark:text-[#F8FAFC] font-semibold text-xs transition flex items-center gap-1.5"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>

        {!hasWorkNote ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
              What did you work on today?
            </p>
            <button
              type="button"
              onClick={() => setShowNoteSheet(true)}
              className="h-10 px-4 rounded-xl bg-[#6C5CE7] hover:bg-[#5A4AD1] text-white font-semibold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus size={14} />
              <span>+ Add today's note</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1 text-xs divide-y divide-slate-100 dark:divide-[#28324A]/40">
            {currentWorkLog.workedOn && (
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
                  Worked on
                </span>
                <p className="text-slate-800 dark:text-[#F8FAFC] font-medium whitespace-pre-line">
                  {currentWorkLog.workedOn}
                </p>
              </div>
            )}
            {currentWorkLog.learned && (
              <div className="pt-2 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
                  Learned
                </span>
                <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line">
                  {currentWorkLog.learned}
                </p>
              </div>
            )}
            {currentWorkLog.blockers && (
              <div className="pt-2 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 dark:text-rose-400/80 block">
                  Blockers
                </span>
                <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line">
                  {currentWorkLog.blockers}
                </p>
              </div>
            )}
            {currentWorkLog.nextStep && (
              <div className="pt-2 space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#8B7CF6] block">
                  Next
                </span>
                <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line">
                  {currentWorkLog.nextStep}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Daily Review / End Day Card (Section 18 — Calm feel) */}
      <div className="bg-[#F4F2FF] dark:bg-[#181F34] border border-slate-200/80 dark:border-[#28324A] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Moon size={16} className="text-[#6C5CE7] dark:text-[#8B7CF6]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6C5CE7] dark:text-[#8B7CF6]">
              END YOUR DAY
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#CBD5E1]">
            Review what you accomplished and choose tomorrow's main focus.
          </p>
        </div>

        <button
          onClick={() => setShowReviewModal(true)}
          className="h-11 px-5 rounded-xl bg-white dark:bg-[#121829] border border-slate-200 dark:border-[#28324A] text-slate-800 dark:text-[#F8FAFC] font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#1D2540] active:scale-95 transition shrink-0 shadow-xs"
        >
          Daily Review
        </button>
      </div>

      {/* MODAL: Choose Main Focus Task */}
      {showChooseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#121829] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[#28324A] p-5 shadow-2xl space-y-4 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-[#28324A] rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#28324A] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Choose Today's Main Focus</h3>
              <button
                onClick={() => setShowChooseModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
              Select any active task to establish as today's anchor priority.
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {incompleteTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectDifferentTask(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between min-h-[48px] ${
                    t.id === currentMainTask?.id
                      ? 'border-[#6C5CE7] bg-[#EFEDFF] dark:border-[#8B7CF6] dark:bg-[#272344]'
                      : 'border-slate-200 dark:border-[#28324A] hover:border-slate-300 dark:hover:border-[#37435E] bg-slate-50/50 dark:bg-[#181F34]/50'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] truncate">{t.title}</p>
                    <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                      {t.priority} • {t.estimatedMinutes || 30} mins
                    </p>
                  </div>
                  {t.id === currentMainTask?.id && <Check size={16} className="text-[#6C5CE7] dark:text-[#8B7CF6]" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finish Focus Session */}
      {showFinishModal && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#121829] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[#28324A] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-[#28324A] rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#28324A] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Finish Focus Session</h3>
              <button
                onClick={() => setShowFinishModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">{activeSession.task?.title}</h4>
              <p className="text-xs text-slate-400 dark:text-[#94A3B8]">Did you finish this task?</p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#28324A] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#181F34] transition min-h-[48px]">
                <input
                  type="radio"
                  name="taskOutcome"
                  value="COMPLETED"
                  checked={taskOutcome === 'COMPLETED'}
                  onChange={(e) => setTaskOutcome(e.target.value)}
                  className="text-[#6C5CE7] dark:text-[#8B7CF6] focus:ring-[#6C5CE7]"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] block">Yes, completed</span>
                  <span className="text-[11px] text-slate-400 dark:text-[#94A3B8]">Marks task as completed</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-[#28324A] cursor-pointer hover:bg-slate-50 dark:hover:bg-[#181F34] transition min-h-[48px]">
                <input
                  type="radio"
                  name="taskOutcome"
                  value="NOT_YET"
                  checked={taskOutcome === 'NOT_YET'}
                  onChange={(e) => setTaskOutcome(e.target.value)}
                  className="text-[#6C5CE7] dark:text-[#8B7CF6] focus:ring-[#6C5CE7]"
                />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] block">Not yet</span>
                  <span className="text-[11px] text-slate-400 dark:text-[#94A3B8]">Logs session, task stays open</span>
                </div>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-[#CBD5E1] block mb-1">
                Optional note
              </label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you get done?"
                className="w-full h-11 px-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#8B7CF6]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#28324A]">
              <button
                onClick={() => setShowFinishModal(false)}
                className="h-11 px-4 rounded-xl text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#181F34] text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() =>
                  finishFocusMutation.mutate({
                    sessionId: activeSession.id,
                    data: { taskOutcome, notes: sessionNotes },
                  })
                }
                disabled={finishFocusMutation.isPending}
                className="h-11 px-5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD8] active:bg-[#4C3FC7] dark:bg-[#8B7CF6] dark:hover:bg-[#9D91FF] text-white text-xs font-semibold shadow-xs transition"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Daily Review */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-white dark:bg-[#121829] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[#28324A] p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-slate-200 dark:bg-[#28324A] rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#28324A] pb-3">
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-[#6C5CE7] dark:text-[#8B7CF6]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Daily Review</h3>
              </div>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {reviewSavedSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-[#22C55E]/10 border border-emerald-200 dark:border-[#22C55E]/30 rounded-xl text-xs font-semibold text-emerald-700 dark:text-[#22C55E] flex items-center gap-2">
                <Check size={16} />
                <span>Daily review saved successfully!</span>
              </div>
            )}

            <div className="space-y-3.5 overflow-y-auto flex-1 pr-1 text-xs">
              {/* Contextual Daily Work Notes (Phase 2B Step 1) */}
              {hasWorkNote && (
                <div className="p-3.5 bg-violet-50/70 dark:bg-[#7C6CF2]/10 border border-violet-200/80 dark:border-[#7C6CF2]/30 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#8B7CF6] flex items-center gap-1.5">
                      <FileText size={12} />
                      <span>TODAY'S WORK</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewModal(false);
                        setShowNoteSheet(true);
                      }}
                      className="text-[10px] font-semibold text-[#6C5CE7] dark:text-[#8B7CF6] hover:underline"
                    >
                      Edit Note
                    </button>
                  </div>
                  {currentWorkLog.workedOn && (
                    <div className="text-slate-700 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Worked on: </span>
                      <span>{currentWorkLog.workedOn}</span>
                    </div>
                  )}
                  {currentWorkLog.learned && (
                    <div className="text-slate-700 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Learned: </span>
                      <span>{currentWorkLog.learned}</span>
                    </div>
                  )}
                  {currentWorkLog.blockers && (
                    <div className="text-slate-700 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Blocker: </span>
                      <span>{currentWorkLog.blockers}</span>
                    </div>
                  )}
                  {currentWorkLog.nextStep && (
                    <div className="text-slate-700 dark:text-[#CBD5E1]">
                      <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">Next: </span>
                      <span>{currentWorkLog.nextStep}</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                  What did you complete today?
                </label>
                <input
                  type="text"
                  value={completedSummary}
                  onChange={(e) => setCompletedSummary(e.target.value)}
                  placeholder="e.g. Finished JWT authentication tests"
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#8B7CF6]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                  What did you learn?
                </label>
                <input
                  type="text"
                  value={learnedSummary}
                  onChange={(e) => setLearnedSummary(e.target.value)}
                  placeholder="e.g. Refresh token rotation prevents replay attacks"
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#8B7CF6]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                  Anything blocking you?
                </label>
                <input
                  type="text"
                  value={blockerSummary}
                  onChange={(e) => setBlockerSummary(e.target.value)}
                  placeholder="e.g. Need CORS headers configured"
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#8B7CF6]"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                  Tomorrow's ONE Main Task
                </label>
                <select
                  value={tomorrowTaskId}
                  onChange={(e) => setTomorrowTaskId(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#6C5CE7] dark:focus:ring-[#8B7CF6]"
                >
                  <option value="">-- Select Priority --</option>
                  {incompleteTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.estimatedMinutes || 30}m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-[#CBD5E1] block mb-1">Energy Today</label>
                <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                  {ENERGY_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setEnergyLevel(opt.value)}
                      className={`h-10 px-1 rounded-xl text-[11px] font-semibold transition ${
                        energyLevel === opt.value
                          ? 'bg-[#6C5CE7] dark:bg-[#8B7CF6] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#181F34] hover:bg-slate-200 dark:hover:bg-[#28324A] text-slate-600 dark:text-[#CBD5E1]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#28324A]">
              <button
                onClick={() =>
                  saveReviewMutation.mutate({
                    completedSummary,
                    learnedSummary,
                    blockerSummary,
                    tomorrowMainTaskId: tomorrowTaskId || null,
                    energyLevel,
                    closeDay: false,
                  })
                }
                disabled={saveReviewMutation.isPending}
                className="h-11 px-4 rounded-xl text-slate-700 dark:text-[#CBD5E1] bg-slate-100 dark:bg-[#181F34] hover:bg-slate-200 dark:hover:bg-[#28324A] text-xs font-semibold"
              >
                Save Draft
              </button>

              <button
                onClick={() =>
                  saveReviewMutation.mutate({
                    completedSummary,
                    learnedSummary,
                    blockerSummary,
                    tomorrowMainTaskId: tomorrowTaskId || null,
                    energyLevel,
                    closeDay: true,
                  })
                }
                disabled={saveReviewMutation.isPending}
                className="h-11 px-5 rounded-xl bg-[#6C5CE7] hover:bg-[#5B4BD8] active:bg-[#4C3FC7] dark:bg-[#8B7CF6] dark:hover:bg-[#9D91FF] text-white text-xs font-semibold shadow-xs transition"
              >
                Close Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Note Sheet / Modal for Work Notes (Phase 2B Step 1) */}
      <QuickNoteSheet
        isOpen={showNoteSheet}
        onClose={() => setShowNoteSheet(false)}
        initialData={currentWorkLog}
        onSaveSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['todayContext'] });
          queryClient.invalidateQueries({ queryKey: ['workLog', 'today'] });
          queryClient.invalidateQueries({ queryKey: ['workLog', 'history'] });
          queryClient.invalidateQueries({ queryKey: ['workLog', 'stats'] });
        }}
      />
    </div>
  );
};
