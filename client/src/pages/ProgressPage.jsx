import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { progressReviewService } from '../services/progressReviewService';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Award,
  Zap,
  Flame,
  Target,
  BarChart2,
  Filter,
  ShieldAlert,
  ArrowUpRight,
  BookOpen,
  Code,
  Briefcase,
  Users,
  Send,
  HelpCircle,
  Layers,
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

export const ProgressPage = () => {
  const [period, setPeriod] = useState('THIS_WEEK');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Fetch unified progress data
  const { data: progressData, isLoading, isError, refetch } = useQuery({
    queryKey: ['progress-data', period, customStart, customEnd],
    queryFn: () => {
      const params = { period };
      if (period === 'CUSTOM' && customStart && customEnd) {
        params.startDate = customStart;
        params.endDate = customEnd;
      }
      return progressReviewService.getProgress(params);
    },
  });

  // Fetch 8-week trend data
  const { data: trendsData } = useQuery({
    queryKey: ['progress-trends'],
    queryFn: () => progressReviewService.getTrends(8),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (isError || !progressData?.data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
        <AlertCircle size={32} className="text-rose-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Failed to load execution progress</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          We encountered an error calculating your progress metrics. Please verify your connection.
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

  const p = progressData.data;
  const metrics = p.metrics || {};
  const consistency = p.consistency || {};
  const goalProgress = p.goalProgress || [];
  const skillAssessments = p.skillAssessments || [];
  const blockers = p.blockers || {};
  const categoryBreakdown = p.categoryBreakdown || [];
  const completedTasks = p.completedTasks || [];
  const trends = trendsData?.data?.trend || [];

  // Planned vs actual calculation
  const plannedMinutes = metrics.plannedMinutes || 0;
  const actualMinutes = metrics.totalFocusMinutes || 0;
  const timeDifference = actualMinutes - plannedMinutes;

  return (
    <div className="space-y-7 pb-16">
      {/* Header & Period Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 text-brand-600 rounded-xl">
              <TrendingUp size={20} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Progress & Evidence Engine
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Factual career execution, deliberate practice time, and verified skill upgrades.
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 text-xs font-semibold">
          {[
            { key: 'THIS_WEEK', label: 'This Week' },
            { key: 'LAST_WEEK', label: 'Last Week' },
            { key: 'THIS_MONTH', label: 'This Month' },
            { key: 'LAST_30_DAYS', label: 'Last 30 Days' },
            { key: 'CUSTOM', label: 'Custom' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                period === tab.key
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Picker if Custom selected */}
      {period === 'CUSTOM' && (
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Start Date:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">End Date:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="p-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Dates will be evaluated in your profile timezone ({p.timezone || 'UTC'}).
          </span>
        </div>
      )}

      {/* Hero Factual Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Focus Time */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Deliberate Work</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatMinutes(metrics.totalFocusMinutes)}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.focusSessionsCompleted || 0} completed focus sessions
          </p>
        </div>

        {/* Tasks Completed */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tasks Completed</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.tasksCompleted || 0}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.milestonesCompleted || 0} milestone stages finished
          </p>
        </div>

        {/* Active Days */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Execution</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics.activeDays || 0} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Days with deliberate logged focus
          </p>
        </div>

        {/* Consistency Streak */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Consistency</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Flame size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {consistency.currentStreak || 0} <span className="text-xs font-normal text-slate-400">days</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Longest record: {consistency.longestStreak || 0} active days
          </p>
        </div>
      </div>

      {/* Planned vs Actual Comparison & Main Focus Follow-Through */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Planned vs Actual Focus */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Target size={16} className="text-brand-600" />
              Planned vs Actual Career Time
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Period Total</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Planned</span>
              <span className="text-xl font-extrabold text-slate-700">
                {formatMinutes(plannedMinutes)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Actual Executed</span>
              <span className="text-xl font-extrabold text-brand-600">
                {formatMinutes(actualMinutes)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-slate-500">Execution Variance:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded ${
                timeDifference >= 0
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {timeDifference >= 0 ? `+${formatMinutes(timeDifference)} surplus` : `${formatMinutes(Math.abs(timeDifference))} deficit`}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                plannedMinutes > 0 && actualMinutes >= plannedMinutes ? 'bg-emerald-500' : 'bg-brand-600'
              }`}
              style={{
                width: `${
                  plannedMinutes > 0 ? Math.min(100, Math.round((actualMinutes / plannedMinutes) * 100)) : actualMinutes > 0 ? 100 : 0
                }%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Target derived from confirmed daily plans. Gaps indicate overambitious planning or unexpected schedule demands.
          </p>
        </div>

        {/* Daily Focus Discipline */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Award size={16} className="text-emerald-600" />
              Main Focus Follow-Through
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Priority Discipline</span>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Confirmed Daily Plans</span>
              <span className="text-xl font-extrabold text-slate-700">
                {metrics.dailyPlansConfirmed || 0}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block">Main Tasks Finished</span>
              <span className="text-xl font-extrabold text-emerald-600">
                {metrics.mainFocusCompleted || 0}
              </span>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Primary Execution Rate:</span>
              <span className="font-bold text-slate-900">
                {metrics.dailyPlansConfirmed > 0
                  ? `${Math.round((metrics.mainFocusCompleted / metrics.dailyPlansConfirmed) * 100)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${
                    metrics.dailyPlansConfirmed > 0
                      ? Math.round((metrics.mainFocusCompleted / metrics.dailyPlansConfirmed) * 100)
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Measures completion of the single #1 priority selected during morning confirmation.
          </p>
        </div>
      </div>

      {/* 8-Week Trend Trajectory */}
      {trends.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 size={16} className="text-brand-600" />
                8-Week Execution Trajectory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Weekly focus volume and completion consistency over past cycles.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">Factual Trend</span>
          </div>

          {/* Clean Interactive SVG Bar / Trend Chart */}
          <div className="space-y-4">
            <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-3 bg-slate-50/70 rounded-xl border border-slate-200/60">
              {trends.map((t, idx) => {
                const maxMinutes = Math.max(...trends.map((tr) => tr.focusMinutes), 180);
                const heightPercent = Math.max(8, Math.round((t.focusMinutes / maxMinutes) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] font-bold text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatMinutes(t.focusMinutes)}
                    </span>
                    <div
                      className="w-full max-w-[36px] bg-brand-600/80 group-hover:bg-brand-600 rounded-t-lg transition-all"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[10px] font-semibold text-slate-400 truncate w-full text-center">
                      {t.weekLabel}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-brand-600" />
                Deliberate Focus Hours
              </span>
              <span>• Max in window: {formatMinutes(Math.max(...trends.map((t) => t.focusMinutes), 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Goal Attribution & Roadmap Progress */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers size={16} className="text-brand-600" />
          Goal Attribution & Milestone Movement
        </h3>

        {goalProgress.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalProgress.map((g) => (
              <div
                key={g.goalId}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{g.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                    {g.type}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-white p-2.5 rounded-lg border border-slate-200/50">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Focus Time</span>
                    <span className="font-bold text-slate-800">{formatMinutes(g.focusMinutes)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tasks Finished</span>
                    <span className="font-bold text-slate-800">{g.tasksCompleted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Milestones</span>
                    <span className="font-bold text-emerald-600">+{g.milestonesCompleted}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            No focus time or completed tasks attributed to goals in this period.
          </p>
        )}
      </div>

      {/* Skill Assessment Movement */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Verified Skill Assessment Changes
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold">Evidence-backed Upgrades</span>
        </div>

        {skillAssessments.length > 0 ? (
          <div className="space-y-3">
            {skillAssessments.map((sa) => (
              <div
                key={sa.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{sa.skillName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sa.assessmentType === 'PROJECT_EVIDENCE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {sa.assessmentType === 'PROJECT_EVIDENCE' ? 'Project Evidence' : 'Self Assessment'}
                    </span>
                  </div>
                  {sa.evidence && (
                    <p className="text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">Evidence:</span> {sa.evidence}
                    </p>
                  )}
                  {sa.notes && (
                    <p className="text-[11px] text-slate-400 italic">{sa.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-slate-400">Lvl {sa.previousLevel}</span>
                      <span className="text-brand-600">→</span>
                      <span className="text-emerald-700">Lvl {sa.newLevel}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {formatDateLabel(sa.changedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">
            No skill assessment changes logged in this period. Upgrade your skills with project proof in the Skills workspace.
          </p>
        )}
      </div>

      {/* Blockers & Friction Analysis */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert size={16} className="text-rose-600" />
            Blockers & Friction Points
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {blockers.blockedTasksCount || 0} active blocked tasks
          </span>
        </div>

        {blockers.blockedTasks?.length > 0 || blockers.reviewBlockers?.length > 0 ? (
          <div className="space-y-3">
            {blockers.blockedTasks?.map((bt) => (
              <div
                key={bt.id}
                className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900">{bt.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                    BLOCKED
                  </span>
                </div>
                {bt.description && (
                  <p className="text-[11px] text-rose-800">{bt.description}</p>
                )}
              </div>
            ))}

            {blockers.reviewBlockers?.map((rb, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1"
              >
                <span className="text-[10px] font-semibold text-slate-400 block">
                  Daily Review ({formatDateLabel(rb.date)})
                </span>
                <p className="text-slate-700">{rb.blockerSummary}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/60 text-xs text-emerald-800 text-center">
            Zero blocked tasks or friction points recorded in this window. Clean execution trajectory.
          </div>
        )}
      </div>

      {/* Completed Tasks List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Completed Work Breakdown</h3>

        {completedTasks.length > 0 ? (
          <div className="space-y-2">
            {completedTasks.slice(0, 8).map((ct) => (
              <div
                key={ct.id}
                className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800">{ct.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-medium">
                    {ct.taskType}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <span>{formatMinutes(ct.actualMinutes)}</span> •{' '}
                  <span>{formatDateLabel(ct.completedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No completed tasks in this window.</p>
        )}
      </div>
    </div>
  );
};
