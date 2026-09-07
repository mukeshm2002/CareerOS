import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionService } from '../services/executionService';
import { planningService } from '../features/planning/services/planningService';
import {
  SunMedium,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  BatteryCharging,
  Calendar,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  X,
  Check,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Compass,
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

export const MyDayPage = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: todayData, isLoading, isError, refetch } = useQuery({
    queryKey: ['todayContext'],
    queryFn: () => executionService.getToday(),
  });

  const { data: activeFocusData } = useQuery({
    queryKey: ['activeFocusSession'],
    queryFn: () => executionService.getActiveFocusSession(),
    refetchInterval: 5000,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'all-incomplete'],
    queryFn: () => planningService.getTasks({ status: 'TODO' }),
  });

  const { data: reviewData } = useQuery({
    queryKey: ['dailyReview'],
    queryFn: () => executionService.getDailyReview(),
  });

  // Local UI States
  const [showChooseModal, setShowChooseModal] = useState(false);
  const [showSecondaryModal, setShowSecondaryModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
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

  // Timer Local State derived from server timestamps
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
      setShowSecondaryModal(false);
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
      setTimeout(() => setReviewSavedSuccess(false), 3000);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-lg" />
        <div className="h-20 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !todayData?.data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
        <AlertCircle size={36} className="text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">We couldn't load today's execution plan.</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Please check your connection or try again.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
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
  const isPlanConfirmed = plan?.status === 'CONFIRMED' || plan?.status === 'IN_PROGRESS' || plan?.status === 'COMPLETED' || plan?.status === 'CLOSED';
  const secondaryTasks = plan?.secondaryTasks || [];
  const incompleteTasks = tasksData?.data || [];

  const handleStartFocus = () => {
    if (!currentMainTask) return;
    startFocusMutation.mutate({
      taskId: currentMainTask.id,
      dailyPlanId: plan?.id,
      plannedMinutes: currentMainTask.estimatedMinutes || 25,
    });
  };

  const handleAcceptRecommendation = () => {
    if (!recommendation?.recommendedTask) return;
    confirmPlanMutation.mutate({
      mainTaskId: recommendation.recommendedTask.id,
      date: context.date,
    });
  };

  const handleSelectDifferentTask = (taskId) => {
    savePlanMutation.mutate({
      mainTaskId: taskId,
      date: context.date,
      status: 'CONFIRMED',
    });
  };

  const formatTimerDigits = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header (Section 12) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <SunMedium className="text-amber-500" size={22} />
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">MY DAY</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            One focused session moves your career forward.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700 block">
            {context.date}
          </span>
          <span className="text-[11px] text-slate-400">
            Timezone: {context.timezone}
          </span>
        </div>
      </div>

      {/* Daily Status Strip (Section 13) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Career Time Available
          </span>
          <span className="text-lg font-bold text-slate-800">
            {formatMinutes(context.availableCareerMinutes)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Planned Time
          </span>
          <span className="text-lg font-bold text-slate-800">
            {formatMinutes(context.plannedMinutes)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Completed Today
          </span>
          <span className="text-lg font-bold text-emerald-600">
            {formatMinutes(context.completedMinutes)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Day Status
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
              context.dayStatus === 'CLOSED'
                ? 'bg-slate-200 text-slate-700'
                : context.dayStatus === 'IN_PROGRESS'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : context.dayStatus === 'PLANNED'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {context.dayStatus}
          </span>
        </div>
      </div>

      {/* Active Focus Session Widget (Section 18, 19) */}
      {activeSession && (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isTimerPaused ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isTimerPaused ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                {isTimerPaused ? 'Focus Session Paused' : 'Focus Session Active'}
              </span>
            </div>
            <span className="text-xs text-indigo-300 font-mono">
              Started at {new Date(activeSession.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">
                {activeSession.task?.title || 'Focused Deep Work'}
              </h2>
              <p className="text-xs text-indigo-200">
                Planned: {activeSession.plannedMinutes || 25} minutes • Paused: {Math.round((activeSession.totalPausedSeconds || 0) / 60)}m
              </p>
            </div>

            <div className="text-3xl md:text-4xl font-mono font-extrabold text-emerald-300 tracking-wider">
              {formatTimerDigits(secondsLeft)}
              <span className="text-xs text-indigo-200 block font-sans font-normal text-right">
                {secondsLeft === 0 ? 'Target time reached' : 'remaining'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-indigo-800">
            {isTimerPaused ? (
              <button
                onClick={() => resumeFocusMutation.mutate(activeSession.id)}
                disabled={resumeFocusMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition"
              >
                <Play size={14} />
                <span>Resume Session</span>
              </button>
            ) : (
              <button
                onClick={() => pauseFocusMutation.mutate(activeSession.id)}
                disabled={pauseFocusMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition"
              >
                <Pause size={14} />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={() => setShowFinishModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Finish Session</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to cancel this focus session?')) {
                  cancelFocusMutation.mutate(activeSession.id);
                }
              }}
              className="ml-auto text-xs text-indigo-300 hover:text-rose-300 font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Focus Card (Section 14) */}
      <div className="bg-white rounded-2xl border-2 border-brand-500/80 p-6 md:p-7 shadow-card space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full uppercase tracking-wider border border-brand-200">
              Today's Main Focus
            </span>
            {isPlanConfirmed && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Confirmed
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
            Estimated: {currentMainTask?.estimatedMinutes || 30} mins
          </span>
        </div>

        {currentMainTask ? (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              {currentMainTask.title}
            </h2>

            {/* Goal & Milestone context badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              {currentMainTask.goal && (
                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                  Goal: {currentMainTask.goal.title}
                </span>
              )}
              {currentMainTask.milestone && (
                <span className="font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  Milestone: {currentMainTask.milestone.title}
                </span>
              )}
              <span className="text-brand-600 font-bold px-2 py-0.5 rounded bg-brand-50 text-[11px]">
                {currentMainTask.priority} PRIORITY
              </span>
            </div>

            {/* Why This Matters (Section 8, 14) */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles size={14} className="text-brand-600" />
                Why this matters today
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                {recommendation?.explanation?.map((bullet, idx) => (
                  <li key={idx}>{bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          /* Empty State (Section 9) */
          <div className="text-center py-8 space-y-3">
            <ShieldCheck size={40} className="text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">You're clear for today.</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              There are no active career tasks that need your attention.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Link
                to="/app/roadmap"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Review Roadmap
              </Link>
              <Link
                to="/app/tasks"
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl"
              >
                Add Task
              </Link>
            </div>
          </div>
        )}

        {/* Action Buttons (Section 10 & 14) */}
        {currentMainTask && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            {!activeSession ? (
              <button
                onClick={handleStartFocus}
                disabled={startFocusMutation.isPending}
                className="flex items-center gap-2 py-2.5 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-600/30 transition"
              >
                <Play size={14} />
                <span>Start Focus</span>
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                Focus Session Running Above
              </span>
            )}

            {!isPlanConfirmed && (
              <button
                onClick={handleAcceptRecommendation}
                disabled={confirmPlanMutation.isPending}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
              >
                Accept Focus
              </button>
            )}

            <button
              onClick={() => setShowChooseModal(true)}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Choose Another
            </button>

            <Link
              to="/app/schedule"
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition ml-auto"
            >
              View Schedule
            </Link>
          </div>
        )}
      </div>

      {/* Secondary Tasks & Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Secondary Tasks (Section 15: Max 3) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">IF YOU HAVE MORE TIME</h3>
              <p className="text-xs text-slate-500">Secondary tasks (Maximum 3)</p>
            </div>
            <button
              onClick={() => setShowSecondaryModal(true)}
              className="text-xs text-brand-600 hover:text-brand-700 font-semibold"
            >
              Manage ({secondaryTasks.length}/3)
            </button>
          </div>

          {secondaryTasks.length > 0 ? (
            <div className="space-y-2.5">
              {secondaryTasks.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70"
                >
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-slate-800">
                      {sec.task?.title || 'Secondary task'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {sec.task?.estimatedMinutes || 30} min
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <p className="text-xs text-slate-500">No secondary tasks selected for today.</p>
              <button
                onClick={() => setShowSecondaryModal(true)}
                className="text-xs text-brand-600 font-semibold hover:underline"
              >
                + Add Secondary Task
              </button>
            </div>
          )}
        </div>

        {/* Today Timeline (Section 16) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <span>TODAY'S SCHEDULE</span>
            </h3>
            <Link to="/app/schedule" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Open Schedule →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {context.todaySchedule && context.todaySchedule.length > 0 ? (
              context.todaySchedule.map((block, i) => (
                <div key={block.id || i} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 w-12 pt-0.5">
                    {block.startTime}
                  </span>
                  <div className={`flex-1 pl-3 border-l-2 ${block.taskId === currentMainTask?.id ? 'border-brand-500 bg-brand-50/50 rounded-r-lg' : 'border-slate-300'} py-1`}>
                    <p className="font-semibold text-slate-800">{block.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {block.startTime} – {block.endTime} • {block.category}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic py-4 text-center">
                No schedule blocks created for today yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Daily Review Section (Section 23, 24, 25) */}
      <div id="review" className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">END YOUR DAY</h3>
            <p className="text-xs text-slate-500">Reflect, capture blockers, and align tomorrow's priority.</p>
          </div>
          {reviewSavedSuccess && (
            <span className="text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-medium flex items-center gap-1">
              <Check size={13} /> Review Saved
            </span>
          )}
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">What did you complete today?</label>
            <input
              type="text"
              value={completedSummary}
              onChange={(e) => setCompletedSummary(e.target.value)}
              placeholder="e.g. Completed JWT Authentication endpoint tests"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">What did you learn?</label>
            <input
              type="text"
              value={learnedSummary}
              onChange={(e) => setLearnedSummary(e.target.value)}
              placeholder="e.g. Refresh token rotation prevents replay attacks"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Anything blocking you?</label>
            <input
              type="text"
              value={blockerSummary}
              onChange={(e) => setBlockerSummary(e.target.value)}
              placeholder="e.g. Need to configure CORS header for cross-origin cookie cookies"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Tomorrow's ONE Main Task (Section 26)</label>
              <select
                value={tomorrowTaskId}
                onChange={(e) => setTomorrowTaskId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">-- Select Tomorrow's Priority --</option>
                {incompleteTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} ({task.estimatedMinutes || 30}m)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Energy Today</label>
              <div className="flex items-center gap-1.5 pt-1">
                {ENERGY_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setEnergyLevel(opt.value)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition ${
                      energyLevel === opt.value
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
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
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition shadow-sm"
          >
            Close Day
          </button>
        </div>
      </div>

      {/* MODAL: Choose Another Main Task */}
      {showChooseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Choose Today's Main Focus</h3>
              <button onClick={() => setShowChooseModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select any active task to establish as today's confirmed focus priority.
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {incompleteTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => handleSelectDifferentTask(t.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    t.id === currentMainTask?.id
                      ? 'border-brand-500 bg-brand-50/60'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">{t.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.priority} • {t.estimatedMinutes || 30} mins
                    </p>
                  </div>
                  {t.id === currentMainTask?.id && (
                    <Check size={16} className="text-brand-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Manage Secondary Tasks (Max 3) */}
      {showSecondaryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Manage Secondary Tasks (Max 3)</h3>
              <button onClick={() => setShowSecondaryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Pick up to 3 support tasks. CareerOS limits secondary tasks to prevent daily burnout.
            </p>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {incompleteTasks
                .filter((t) => t.id !== currentMainTask?.id)
                .map((t) => {
                  const isSelected = secondaryTasks.some((st) => st.taskId === t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => {
                        let newIds = secondaryTasks.map((st) => st.taskId);
                        if (isSelected) {
                          newIds = newIds.filter((id) => id !== t.id);
                        } else {
                          if (newIds.length >= 3) {
                            alert('Maximum 3 secondary tasks allowed.');
                            return;
                          }
                          newIds.push(t.id);
                        }
                        savePlanMutation.mutate({
                          mainTaskId: currentMainTask?.id,
                          secondaryTaskIds: newIds,
                          date: context.date,
                        });
                      }}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50/60'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{t.title}</p>
                        <p className="text-[11px] text-slate-400">{t.estimatedMinutes || 30} mins</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSecondaryModal(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Finish Focus Session (Section 21) */}
      {showFinishModal && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">FOCUS COMPLETE</h3>
              <button onClick={() => setShowFinishModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">{activeSession.task?.title || 'Focus Session'}</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Planned: {activeSession.plannedMinutes} min
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Did you finish the task?</label>
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="taskOutcome"
                    value="COMPLETED"
                    checked={taskOutcome === 'COMPLETED'}
                    onChange={(e) => setTaskOutcome(e.target.value)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Yes, completed</span>
                    <p className="text-[11px] text-slate-400">Marks task as completed in your roadmap</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="taskOutcome"
                    value="NOT_YET"
                    checked={taskOutcome === 'NOT_YET'}
                    onChange={(e) => setTaskOutcome(e.target.value)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Not yet</span>
                    <p className="text-[11px] text-slate-400">Logs session time, task remains incomplete</p>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="radio"
                    name="taskOutcome"
                    value="BLOCKED"
                    checked={taskOutcome === 'BLOCKED'}
                    onChange={(e) => setTaskOutcome(e.target.value)}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <div>
                    <span className="font-semibold text-slate-800">Blocked</span>
                    <p className="text-[11px] text-slate-400">Mark task as blocked</p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Optional session note</label>
              <input
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="What did you achieve or where did you stop?"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Back
              </button>
              <button
                onClick={() =>
                  finishFocusMutation.mutate({
                    sessionId: activeSession.id,
                    data: {
                      taskOutcome,
                      notes: sessionNotes,
                    },
                  })
                }
                disabled={finishFocusMutation.isPending}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
