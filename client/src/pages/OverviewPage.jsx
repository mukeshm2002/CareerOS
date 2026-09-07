import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { executionService } from '../services/executionService';
import {
  Sparkles,
  ArrowRight,
  Play,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Layers,
  TrendingUp,
  AlertCircle,
  Award,
  Zap,
  Briefcase,
} from 'lucide-react';

function formatMinutes(min) {
  if (!min || min <= 0) return '0m';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export const OverviewPage = () => {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => executionService.getDashboard(),
  });

  if (isLoading) {
    return (
      <div className="space-y-7 animate-pulse">
        <div className="h-12 w-72 bg-slate-200 rounded-xl" />
        <div className="h-44 bg-slate-100 rounded-2xl" />
        <div className="h-60 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="h-48 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !dashboardData?.data) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-4">
        <AlertCircle size={36} className="text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">We couldn't load your career overview.</h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Please check your connection and try again.
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

  const d = dashboardData.data;
  const user = d.user;
  const primaryGoal = d.primaryGoal;
  const currentRoadmap = d.currentRoadmap;
  const activeFocus = d.activeFocusSession;
  const todayPlan = d.todayPlan;
  const recommendation = d.recommendation;
  const currentTask = todayPlan?.mainTask || recommendation?.recommendedTask;
  const weekly = d.weeklyExecution;
  const careerCheck = d.careerCheck;
  const opportunities = d.opportunities;

  return (
    <div className="space-y-7 pb-12">
      {/* Overview Greeting (Section 29) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
            {user.greeting}, {user.firstName}.
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Here's where you are and what matters today.
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700 block">{d.date}</span>
          <span className="text-[11px] text-slate-400">Time: {user.currentTime} • {user.timezone}</span>
        </div>
      </div>

      {/* Career Mission Card (Section 30) */}
      {primaryGoal ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-7 shadow-card hover:border-slate-300 transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active Mission
                </span>
                <span className="text-xs text-slate-400 font-medium">{primaryGoal.priority} Priority</span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900">
                {primaryGoal.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {primaryGoal.targetDate && (
                  <span>
                    Target: <strong className="text-slate-700">{primaryGoal.targetDate}</strong>
                  </span>
                )}
                {primaryGoal.daysRemaining !== null && (
                  <span>
                    <strong className="text-slate-700">{primaryGoal.daysRemaining}</strong> days remaining
                  </span>
                )}
                {primaryGoal.milestonesTotal > 0 && (
                  <span>
                    <strong className="text-slate-700">{primaryGoal.milestonesCompleted}</strong> of{' '}
                    <strong className="text-slate-700">{primaryGoal.milestonesTotal}</strong> milestones complete
                  </span>
                )}
                <span>
                  Stage: <strong className="text-brand-600">{primaryGoal.currentStage}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <div className="text-right">
                <div className="text-2xl font-extrabold text-brand-600">{primaryGoal.progress}%</div>
                <div className="text-[11px] font-medium text-slate-400">Roadmap Progress</div>
              </div>
              <Link
                to="/app/roadmap"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition"
              >
                <span>View Roadmap</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, primaryGoal.progress))}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-3">
          <Compass size={36} className="text-brand-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Career Mission Set</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Define your primary goal to anchor your daily focus and milestone roadmap.
          </p>
          <Link
            to="/app/goals"
            className="inline-block px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
          >
            Create Goal
          </Link>
        </div>
      )}

      {/* TODAY'S MAIN FOCUS (Section 31 & 36) */}
      <div className="bg-white rounded-2xl border-2 border-brand-500/80 p-6 md:p-7 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
              <Sparkles size={16} />
            </div>
            <span className="text-xs font-bold text-brand-600 tracking-wide uppercase">
              Today's Main Focus
            </span>
          </div>

          {activeFocus ? (
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              Session In Progress
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
              {currentTask ? `${currentTask.estimatedMinutes || 30} mins estimated` : 'No task'}
            </span>
          )}
        </div>

        {currentTask ? (
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-bold text-slate-900">
              {currentTask.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {recommendation?.summaryReason || 'Top recommended priority for today.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {currentTask.goal && (
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                  Goal: {currentTask.goal.title}
                </span>
              )}
              {currentTask.milestone && (
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                  Stage: {currentTask.milestone.title}
                </span>
              )}
              <span className="text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded text-[11px]">
                {currentTask.priority}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2">
            You're clear for today. There are no pending career tasks that require attention.
          </p>
        )}

        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
          {activeFocus ? (
            <Link
              to="/app/today"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
            >
              <Play size={14} />
              <span>Return to Focus Session</span>
            </Link>
          ) : (
            <button
              onClick={() => navigate('/app/today')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm shadow-brand-600/30"
            >
              <Play size={14} />
              <span>Open My Day</span>
            </button>
          )}

          <Link
            to="/app/today"
            className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            My Day Workspace
          </Link>
        </div>
      </div>

      {/* Grid: Schedule & Career Check (Section 36) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Schedule Card (Section 33) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" />
              <span>TODAY'S SCHEDULE</span>
            </h3>
            <Link to="/app/schedule" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
              View Schedule →
            </Link>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {d.todaySchedule && d.todaySchedule.length > 0 ? (
              d.todaySchedule.map((slot, index) => (
                <div key={slot.id || index} className="flex items-start gap-3 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 w-11 pt-0.5">{slot.startTime}</span>
                  <div className={`flex-1 pl-3 border-l-2 ${slot.taskId === currentTask?.id ? 'border-brand-500 bg-brand-50/40 rounded-r' : 'border-slate-300'} py-0.5`}>
                    <p className="font-semibold text-slate-800">{slot.title}</p>
                    <p className="text-[10px] text-slate-400">{slot.category}</p>
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

        {/* Career Check Section (Section 32) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">CAREER CHECK</h3>
              <p className="text-xs text-slate-500">Live operational status across career areas</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Live Factual Records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Goals */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Goals</span>
                <span className="font-bold text-brand-600">{careerCheck.goals.progress}%</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {careerCheck.goals.primaryGoalTitle || 'No active goal'}
              </p>
              <div className="pt-1 text-[11px] flex justify-between text-slate-400">
                <span>Active goals: {careerCheck.goals.activeCount}</span>
                <span className="font-semibold text-emerald-600">{careerCheck.goals.status}</span>
              </div>
            </div>

            {/* Roadmaps */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Roadmap</span>
                <span className="font-bold text-brand-600">{currentRoadmap?.progress || 0}%</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Stage: {careerCheck.roadmaps.currentStage}
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                {careerCheck.roadmaps.milestonesSummary}
              </div>
            </div>

            {/* Skills */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Skills Readiness</span>
                <span className="font-bold text-brand-600">{careerCheck.skills.readinessScore}%</span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Top Gap: <strong className="text-slate-700">{careerCheck.skills.topGapName}</strong>
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                Priority: {careerCheck.skills.topGapPriority}
              </div>
            </div>

            {/* Tasks & Schedule */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Today's Execution</span>
                <span className="font-bold text-emerald-600">
                  {formatMinutes(careerCheck.schedule.completedMinutes)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                Active tasks: {careerCheck.tasks.activeCount} • Completed today: {careerCheck.tasks.completedTodayCount}
              </p>
              <div className="pt-1 text-[11px] text-slate-400">
                Planned: {formatMinutes(careerCheck.schedule.plannedMinutes)}
              </div>
            </div>

            {/* Job Search (Section 38) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Job Search</span>
                {careerCheck?.jobSearch?.activeCount ? (
                  <span className="font-bold text-brand-600">{careerCheck.jobSearch.activeCount} active</span>
                ) : (
                  <span className="text-[11px] text-slate-400">0 active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {careerCheck?.jobSearch?.nextAction
                  ? `Next · ${careerCheck.jobSearch.nextAction}`
                  : careerCheck?.jobSearch?.status || 'No immediate action'}
              </p>
            </div>

            {/* Freelancing (Section 38) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Freelancing</span>
                {careerCheck?.freelancing?.activeCount ? (
                  <span className="font-bold text-brand-600">{careerCheck.freelancing.activeCount} active</span>
                ) : (
                  <span className="text-[11px] text-slate-400">0 active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {careerCheck?.freelancing?.nextAction
                  ? `Next · ${careerCheck.freelancing.nextAction}`
                  : careerCheck?.freelancing?.status || 'No immediate action'}
              </p>
            </div>

            {/* Projects (Section 57) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Projects</span>
                {careerCheck?.projects?.activeCount !== undefined ? (
                  <span className="font-bold text-brand-600">
                    {careerCheck.projects.activeCount} active
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">0 active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {careerCheck?.projects?.summary || careerCheck?.projects?.status || 'Not configured yet'}
              </p>
            </div>

            {/* Learning (Section 57) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Learning</span>
                {careerCheck?.learning?.activePathsCount !== undefined ? (
                  <span className="font-bold text-brand-600">
                    {careerCheck.learning.activePathsCount} active
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">0 active</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate">
                {careerCheck?.learning?.summary || careerCheck?.learning?.status || 'Not configured yet'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Current Roadmap & This Week (Section 36) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Roadmap Card (Section 35) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">CURRENT ROADMAP</h3>
            <Link to="/app/roadmap" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">
              View All Milestones →
            </Link>
          </div>

          {currentRoadmap ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">{currentRoadmap.title}</span>
                <span className="font-semibold text-slate-500">
                  {currentRoadmap.milestonesCompleted} / {currentRoadmap.milestonesTotal} milestones
                </span>
              </div>

              {currentRoadmap.currentMilestone && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-600" />
                    <span className="font-bold text-slate-800">
                      Current Stage: {currentRoadmap.currentMilestone.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {currentRoadmap.currentMilestone.completedTasks} of {currentRoadmap.currentMilestone.totalTasks} tasks complete
                  </p>
                  {currentRoadmap.nextTask && (
                    <p className="text-[11px] text-slate-700 pt-1 border-t border-slate-200/50">
                      <span className="font-medium text-slate-500">Next:</span> {currentRoadmap.nextTask.title}
                    </p>
                  )}
                </div>
              )}

              <Link
                to="/app/roadmap"
                className="inline-block w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-center font-semibold rounded-xl text-xs transition"
              >
                Continue Roadmap
              </Link>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">
              No active roadmap. Go to Goals to generate one.
            </p>
          )}
        </div>

        {/* This Week Quick Progress Card (Section 34) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">THIS WEEK</h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {weekly?.weekStart} to {weekly?.weekEnd}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block font-medium">Focus Sessions</span>
              <span className="text-2xl font-extrabold text-slate-800">{weekly?.focusSessionsCount || 0}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block font-medium">Focused Time</span>
              <span className="text-2xl font-extrabold text-brand-600">{formatMinutes(weekly?.focusedMinutes || 0)}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block font-medium">Tasks Completed</span>
              <span className="text-2xl font-extrabold text-emerald-600">{weekly?.tasksCompletedCount || 0}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[11px] text-slate-400 block font-medium">Active Days</span>
              <span className="text-2xl font-extrabold text-slate-800">{weekly?.activeDaysCount || 0}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <Link to="/app/progress" className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1">
              View Detailed Progress →
            </Link>
            <Link to="/app/reviews" className="text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1">
              Weekly Review →
            </Link>
          </div>
        </div>
      </div>

      {/* Opportunities Summary Card (Section 37) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase size={18} className="text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-wider">OPPORTUNITIES</h3>
          </div>
          <Link
            to="/app/opportunities"
            className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
          >
            <span>View Opportunities</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Jobs */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-800 text-sm block">Jobs</span>
            <p className="text-slate-600">
              <strong className="text-slate-900">{opportunities?.jobs?.activeCount || 0}</strong> active
            </p>
            <p className="text-slate-500 text-[11px]">
              {opportunities?.jobs?.interviewsCount || 0} interviews scheduled
            </p>
          </div>

          {/* Freelance */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-800 text-sm block">Freelance</span>
            <p className="text-slate-600">
              <strong className="text-slate-900">{opportunities?.freelance?.activeCount || 0}</strong> active
            </p>
            <p className="text-slate-500 text-[11px]">
              {opportunities?.freelance?.proposalsCount || 0} proposal due / sent
            </p>
          </div>

          {/* Follow-ups Due */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
            <span className="font-bold text-slate-800 text-sm block">Follow-ups Due</span>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {opportunities?.followUpsDue || 0}
            </p>
            <p className="text-slate-400 text-[11px]">
              {opportunities?.followUpsDue > 0 ? 'Requires recruiter/client outreach' : 'All follow-ups current'}
            </p>
          </div>
        </div>
      </div>

      {/* Proof of Work & Learning Section (Section 56) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proof of Work Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900 tracking-wider">PROOF OF WORK</h3>
            </div>
            <Link
              to="/app/projects"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
            >
              <span>View Projects</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-xs text-slate-500 block">Active Projects</span>
              <span className="text-xl font-bold text-slate-900 mt-0.5 block">{d.activeProjects || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-xs text-slate-500 block">Portfolio</span>
              <span className="text-xl font-bold text-amber-600 mt-0.5 block">{d.portfolioProjects || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-xs text-slate-500 block">Evidence</span>
              <span className="text-xl font-bold text-cyan-600 mt-0.5 block">{d.evidenceCount || 0}</span>
            </div>
          </div>

          {d.proofOfWork?.nextProjectTask && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex items-center justify-between">
              <span className="text-slate-500">Next Project Task:</span>
              <span className="font-semibold text-slate-800">{d.proofOfWork.nextProjectTask}</span>
            </div>
          )}
        </div>

        {/* Learning Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 tracking-wider">LEARNING</h3>
            </div>
            <Link
              to="/app/learning"
              className="text-xs text-brand-600 hover:text-brand-700 font-bold inline-flex items-center gap-1"
            >
              <span>View Curriculum</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Active Paths:</span>
              <span className="font-bold text-slate-900">{d.activeLearningPaths || 0}</span>
            </div>
            {d.learning?.activePathTitle && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Current Track:</span>
                <span className="font-semibold text-slate-800">{d.learning.activePathTitle}</span>
              </div>
            )}
            {d.nextLearningModule && (
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-slate-500">Next Module:</span>
                <span className="font-bold text-indigo-600">{d.nextLearningModule}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
