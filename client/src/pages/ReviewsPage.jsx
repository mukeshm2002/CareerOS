import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressReviewService } from '../services/progressReviewService';
import { planningService } from '../features/planning/services/planningService';
import {
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Target,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  Save,
  Check,
  History,
  TrendingUp,
  FileText,
  ChevronRight,
  Lock,
} from 'lucide-react';

function formatMinutes(min) {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function formatDateLabel(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const ReviewsPage = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: currentReviewData, isLoading, isError, refetch } = useQuery({
    queryKey: ['weekly-review-current'],
    queryFn: () => progressReviewService.getCurrentWeeklyReview(),
  });

  const { data: historyData } = useQuery({
    queryKey: ['weekly-review-history'],
    queryFn: () => progressReviewService.getWeeklyReviewHistory(12),
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'review-selection'],
    queryFn: () => planningService.getTasks({ status: 'TODO' }),
  });

  // State
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [wins, setWins] = useState('');
  const [challenges, setChallenges] = useState('');
  const [learnings, setLearnings] = useState('');
  const [continueDoing, setContinueDoing] = useState('');
  const [stopDoing, setStopDoing] = useState('');
  const [startDoing, setStartDoing] = useState('');
  const [nextGoalId, setNextGoalId] = useState('');
  const [nextTaskId, setNextTaskId] = useState('');
  const [plannedMinutes, setPlannedMinutes] = useState(300);
  const [notes, setNotes] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Hydrate form when review loads or changes
  useEffect(() => {
    if (currentReviewData?.data?.review && !selectedReviewId) {
      const r = currentReviewData.data.review;
      setWins(r.wins || '');
      setChallenges(r.challenges || '');
      setLearnings(r.learnings || '');
      setContinueDoing(r.continueDoing || '');
      setStopDoing(r.stopDoing || '');
      setStartDoing(r.startDoing || '');
      setNextGoalId(r.nextWeekMainGoalId || '');
      setNextTaskId(r.nextWeekMainTaskId || '');
      setPlannedMinutes(r.plannedCareerMinutes || 300);
      setNotes(r.notes || '');
    }
  }, [currentReviewData, selectedReviewId]);

  // Mutations
  const draftMutation = useMutation({
    mutationFn: (data) => progressReviewService.saveWeeklyReviewDraft(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review-current'] });
      setSaveSuccessMsg('Draft saved successfully');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (data) => progressReviewService.completeWeeklyReview(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-review-current'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-review-history'] });
      setSaveSuccessMsg('Weekly Review Completed! Next week commitments locked in.');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 bg-slate-200 rounded-xl" />
        <div className="h-44 bg-slate-100 rounded-2xl" />
        <div className="h-96 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !currentReviewData?.data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle size={32} className="text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Failed to load weekly review</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          We encountered an issue preparing your weekly review context. Please retry.
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

  const payload = currentReviewData.data;
  const currentReview = payload.review || {};
  const isCompleted = currentReview.status === 'COMPLETED';
  const metrics = payload.metrics || {};
  const adaptations = payload.adaptations || [];
  const goals = payload.goals || [];
  const availableTasks = tasksData?.data?.tasks || [];
  const pastReviews = historyData?.data?.history || [];

  const handleSaveDraft = (e) => {
    e?.preventDefault();
    draftMutation.mutate({
      reviewId: currentReview.id,
      weekStartDate: currentReview.weekStartDate,
      weekEndDate: currentReview.weekEndDate,
      wins,
      challenges,
      learnings,
      continueDoing,
      stopDoing,
      startDoing,
      nextWeekMainGoalId: nextGoalId || null,
      nextWeekMainTaskId: nextTaskId || null,
      plannedCareerMinutes: Number(plannedMinutes) || 0,
      notes,
    });
  };

  const handleCompleteReview = (e) => {
    e?.preventDefault();
    completeMutation.mutate({
      reviewId: currentReview.id,
      weekStartDate: currentReview.weekStartDate,
      weekEndDate: currentReview.weekEndDate,
      wins,
      challenges,
      learnings,
      continueDoing,
      stopDoing,
      startDoing,
      nextWeekMainGoalId: nextGoalId || null,
      nextWeekMainTaskId: nextTaskId || null,
      plannedCareerMinutes: Number(plannedMinutes) || 0,
      notes,
    });
  };

  return (
    <div className="space-y-7 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <RotateCcw size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Weekly Review & Adaptation
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Evaluate past execution, inspect honest metrics, and adapt your plan for next week.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-bold px-3 py-1 rounded-xl border ${
              isCompleted
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isCompleted ? '✓ COMPLETED' : 'DRAFT IN PROGRESS'}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {formatDateLabel(currentReview.weekStartDate)} – {formatDateLabel(currentReview.weekEndDate)}
          </span>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Factual Week at a Glance */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-600" />
            Your Week at a Glance (Factual Ground Truth)
          </h2>
          <span className="text-[11px] text-slate-400">Zero Vanity Score</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-400 block font-medium">Deliberate Work</span>
            <span className="text-2xl font-black text-brand-600">
              {formatMinutes(metrics.totalFocusMinutes)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {metrics.focusSessionsCompleted || 0} sessions completed
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-400 block font-medium">Tasks Completed</span>
            <span className="text-2xl font-black text-emerald-600">
              {metrics.tasksCompleted || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {metrics.milestonesCompleted || 0} milestone stages
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-400 block font-medium">Active Days</span>
            <span className="text-2xl font-black text-slate-800">
              {metrics.activeDays || 0} / 7
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Days with focused work
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-400 block font-medium">Focus Follow-Through</span>
            <span className="text-2xl font-black text-indigo-600">
              {metrics.mainFocusCompleted || 0} / {metrics.dailyPlansConfirmed || 0}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Main priorities finished
            </span>
          </div>
        </div>

        {/* Planned vs Executed Difference */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 rounded-xl text-xs text-slate-600 border border-slate-200/50">
          <span>
            Target planned time:{' '}
            <strong className="text-slate-800">{formatMinutes(metrics.plannedMinutes)}</strong> • Actual executed:{' '}
            <strong className="text-brand-600">{formatMinutes(metrics.totalFocusMinutes)}</strong>
          </span>
          <span
            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
              metrics.differenceMinutes >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {metrics.differenceMinutes >= 0
              ? `+${formatMinutes(metrics.differenceMinutes)} surplus`
              : `${formatMinutes(Math.abs(metrics.differenceMinutes))} deficit`}
          </span>
        </div>
      </div>

      {/* Deterministic Adaptation Recommendations */}
      {adaptations.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              Deterministic Adaptation Recommendations
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">Rule-Based Insight</span>
          </div>
          <p className="text-xs text-slate-500">
            Based directly on your actual execution metrics and friction points this week:
          </p>

          <div className="space-y-3">
            {adaptations.map((a, idx) => (
              <div
                key={idx}
                className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/70 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 text-sm">{a.title}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    {a.type}
                  </span>
                </div>
                <p className="text-amber-900">{a.message}</p>
                <p className="text-[11px] font-semibold text-amber-800 pt-1">
                  Action: {a.action}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review & Adaptation Workspace Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Main Form (Left 8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Reflection Questions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
            <h2 className="text-sm font-bold text-slate-900">1. Weekly Reflection</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  What went well this week? (Wins & Tangible Output)
                </label>
                <textarea
                  rows={3}
                  value={wins}
                  onChange={(e) => setWins(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Completed JWT refresh token rotation, maintained morning focus discipline 4 days..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  What friction or blockers slowed you down? (Challenges)
                </label>
                <textarea
                  rows={3}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Cloud deployment was blocked by DNS propagation, fatigue on Thursday evening..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  What did you learn or discover? (Learnings)
                </label>
                <textarea
                  rows={3}
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Learned PostgreSQL advisory locks for concurrent execution safety..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Adaptation Decisions */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
            <h2 className="text-sm font-bold text-slate-900">2. Behavior Adaptation</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Continue Doing (What worked that should stay?)
                </label>
                <input
                  type="text"
                  value={continueDoing}
                  onChange={(e) => setContinueDoing(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Morning 90-minute focus session before checking emails..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Stop Doing / Reduce (What is wasting career energy?)
                </label>
                <input
                  type="text"
                  value={stopDoing}
                  onChange={(e) => setStopDoing(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Stop jumping to next task when current task encounters friction..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Start Doing (New adjustment for next week)
                </label>
                <input
                  type="text"
                  value={startDoing}
                  onChange={(e) => setStartDoing(e.target.value)}
                  disabled={isCompleted}
                  placeholder="e.g. Schedule blocked task reviews immediately at 10 AM on Monday..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Next Week Direction */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
            <h2 className="text-sm font-bold text-slate-900">3. Next Week Commitments</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Primary Goal for Next Week
                </label>
                <select
                  value={nextGoalId}
                  onChange={(e) => setNextGoalId(e.target.value)}
                  disabled={isCompleted}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 font-medium"
                >
                  <option value="">-- Select Goal --</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Target Career Work Time (Minutes)
                </label>
                <input
                  type="number"
                  step={30}
                  min={30}
                  max={2400}
                  value={plannedMinutes}
                  onChange={(e) => setPlannedMinutes(e.target.value)}
                  disabled={isCompleted}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 font-medium"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Equivalent to {formatMinutes(Number(plannedMinutes))}
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-800 block mb-1">
                  Main Starting Priority Task (Monday Kickoff)
                </label>
                <select
                  value={nextTaskId}
                  onChange={(e) => setNextTaskId(e.target.value)}
                  disabled={isCompleted}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-1 focus:ring-brand-500 focus:outline-none disabled:bg-slate-100 font-medium"
                >
                  <option value="">-- Select Main Task --</option>
                  {availableTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.priority})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200/80 shadow-card">
            <div>
              {isCompleted ? (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                  <Lock size={15} />
                  <span>This review has been completed and metrics are snapshotted.</span>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Completing will snapshot this week's factual metrics permanently.
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              {!isCompleted && (
                <button
                  onClick={handleSaveDraft}
                  disabled={draftMutation.isPending}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Save size={14} />
                  Save Draft
                </button>
              )}

              {!isCompleted && (
                <button
                  onClick={handleCompleteReview}
                  disabled={completeMutation.isPending}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 size={14} />
                  Complete Review & Commit Plan
                </button>
              )}
            </div>
          </div>
        </div>

        {/* History Sidebar (Right 4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History size={16} className="text-brand-600" />
              Past Completed Reviews
            </h3>

            {pastReviews.length > 0 ? (
              <div className="space-y-2.5">
                {pastReviews.map((r) => {
                  const snap = r.metricsSnapshot || {};
                  return (
                    <div
                      key={r.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 hover:border-slate-300 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {formatDateLabel(r.weekStartDate)} – {formatDateLabel(r.weekEndDate)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          {snap.focusMinutes ? formatMinutes(snap.focusMinutes) : 'Completed'}
                        </span>
                      </div>

                      {snap.focusSessionsCompleted !== undefined && (
                        <div className="text-[11px] text-slate-500">
                          {snap.focusSessionsCompleted} sessions • {snap.tasksCompleted || 0} tasks • {snap.activeDays || 0} active days
                        </div>
                      )}

                      {r.wins && (
                        <p className="text-[11px] text-slate-600 truncate">
                          <span className="font-medium text-slate-700">Win:</span> {r.wins}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">
                No past completed weekly reviews yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
