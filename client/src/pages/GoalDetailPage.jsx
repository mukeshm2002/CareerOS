import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { planningService } from '../features/planning/services/planningService';
import {
  ArrowLeft,
  Target,
  Calendar,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
  Archive,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Sliders,
  Milestone,
  ListTodo,
  Clock,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  RotateCw,
  Check,
} from 'lucide-react';

export const GoalDetailPage = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Active Modals State
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Form states
  const [newCriterionTitle, setNewCriterionTitle] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // CheckIn Form
  const [checkInConfidence, setCheckInConfidence] = useState('ON_TRACK');
  const [checkInWell, setCheckInWell] = useState('');
  const [checkInObstacles, setCheckInObstacles] = useState('');
  const [checkInAdjustments, setCheckInAdjustments] = useState('');

  // Progress Update Form
  const [numericCurrent, setNumericCurrent] = useState('');
  const [manualPercent, setManualPercent] = useState(0);

  // Pause Form
  const [pauseReason, setPauseReason] = useState('');
  const [resumeDate, setResumeDate] = useState('');

  // Abandon Form
  const [abandonReason, setAbandonReason] = useState('');

  // Complete Form
  const [completionReflection, setCompletionReflection] = useState('');
  const [completionLearnings, setCompletionLearnings] = useState('');

  // Edit Goal Form
  const [editTitle, setEditTitle] = useState('');
  const [editWhy, setEditWhy] = useState('');
  const [editOutcome, setEditOutcome] = useState('');
  const [editPriority, setEditPriority] = useState('MEDIUM');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Query Goal
  const {
    data: goalData,
    isLoading: goalLoading,
    isError: goalError,
    error,
  } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalService.getGoalById(goalId),
    enabled: !!goalId,
  });

  // Query Roadmap
  const { data: roadmapData, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap', goalId],
    queryFn: () => planningService.getRoadmapByGoal(goalId),
    enabled: !!goalId,
  });

  const goal = goalData?.data?.goal;
  const roadmap = roadmapData?.data?.roadmap || goal?.roadmaps?.[0];

  const refreshGoal = () => {
    queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['roadmap', goalId] });
  };

  // Mutations
  const statusMutation = useMutation({
    mutationFn: (payload) => goalService.updateGoalStatus(goalId, payload),
    onSuccess: () => {
      refreshGoal();
      setShowPauseModal(false);
      setShowCompleteModal(false);
      setShowAbandonModal(false);
      setIsMoreMenuOpen(false);
    },
  });

  const progressMutation = useMutation({
    mutationFn: (payload) => goalService.updateGoalProgress(goalId, payload),
    onSuccess: () => {
      refreshGoal();
      setShowProgressModal(false);
    },
  });

  const editGoalMutation = useMutation({
    mutationFn: (payload) => goalService.updateGoal(goalId, payload),
    onSuccess: () => {
      refreshGoal();
      setShowEditModal(false);
      setIsMoreMenuOpen(false);
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (payload) => goalService.addCheckIn(goalId, payload),
    onSuccess: () => {
      refreshGoal();
      setShowCheckInModal(false);
      setCheckInWell('');
      setCheckInObstacles('');
      setCheckInAdjustments('');
    },
  });

  // Success Criteria Mutations
  const addCriterionMutation = useMutation({
    mutationFn: (title) => goalService.addSuccessCriterion(goalId, { title }),
    onSuccess: () => {
      refreshGoal();
      setNewCriterionTitle('');
    },
  });

  const toggleCriterionMutation = useMutation({
    mutationFn: ({ criterionId, isCompleted }) =>
      goalService.toggleSuccessCriterion(goalId, criterionId, isCompleted),
    onSuccess: () => refreshGoal(),
  });

  const deleteCriterionMutation = useMutation({
    mutationFn: (criterionId) => goalService.deleteSuccessCriterion(goalId, criterionId),
    onSuccess: () => refreshGoal(),
  });

  // Task Mutations
  const createTaskMutation = useMutation({
    mutationFn: (title) =>
      planningService.createTask({
        title,
        goalId,
        growthArea: goal?.growthArea || 'CAREER',
        status: 'TODO',
      }),
    onSuccess: () => {
      refreshGoal();
      setNewTaskTitle('');
      setShowNewTaskModal(false);
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => planningService.updateTaskStatus(taskId, status),
    onSuccess: () => refreshGoal(),
  });

  const createRoadmapMutation = useMutation({
    mutationFn: () => planningService.createRoadmap(goalId, { useTemplate: true }),
    onSuccess: () => refreshGoal(),
  });

  if (goalLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="h-6 w-6 border-2 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (goalError || !goal) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-[#F87171] text-xs flex items-center gap-2 mb-4">
          <AlertCircle size={15} />
          <span>{error?.response?.data?.message || 'Goal not found.'}</span>
        </div>
        <Link
          to="/app/goals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7A3B]"
        >
          <ArrowLeft size={13} />
          <span>Back to Goals</span>
        </Link>
      </div>
    );
  }

  const successCriteria = goal.successCriteria || [];
  const completedCriteriaCount = successCriteria.filter((c) => c.isCompleted).length;

  const milestones = roadmap?.milestones || [];
  const completedMilestonesCount = milestones.filter((m) => m.status === 'COMPLETED').length;

  const tasks = goal.tasks || [];

  const formattedTargetDate = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No deadline';

  const openEditModal = () => {
    setEditTitle(goal.title);
    setEditWhy(goal.why || '');
    setEditOutcome(goal.desiredOutcome || '');
    setEditPriority(goal.priority || 'MEDIUM');
    setEditTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
    setShowEditModal(true);
    setIsMoreMenuOpen(false);
  };

  const openProgressModal = () => {
    setNumericCurrent(goal.currentValue ?? goal.startValue ?? 0);
    setManualPercent(goal.manualProgress ?? goal.progress ?? 0);
    setShowProgressModal(true);
  };

  // Render Contextual Primary Action Button
  const renderPrimaryAction = () => {
    switch (goal.trackingMethod) {
      case 'NUMBER_TARGET':
        return (
          <button
            type="button"
            onClick={openProgressModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <TrendingUp size={14} />
            <span>Update Value</span>
          </button>
        );
      case 'MANUAL':
      case 'ROUTINE':
        return (
          <button
            type="button"
            onClick={openProgressModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Sliders size={14} />
            <span>Update Progress</span>
          </button>
        );
      case 'TASKS':
        return (
          <button
            type="button"
            onClick={() => setShowNewTaskModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Task</span>
          </button>
        );
      case 'MILESTONES':
      default:
        if (roadmap) {
          return (
            <Link
              to="/app/roadmap"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <Milestone size={14} />
              <span>Continue Roadmap</span>
            </Link>
          );
        }
        return (
          <button
            type="button"
            onClick={() => createRoadmapMutation.mutate()}
            disabled={createRoadmapMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>{createRoadmapMutation.isPending ? 'Creating...' : 'Create Roadmap'}</span>
          </button>
        );
    }
  };

  const hasRelatedGrowth =
    (goal.skills && goal.skills.length > 0) ||
    (goal.projects && goal.projects.length > 0) ||
    (goal.learningPaths && goal.learningPaths.length > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16" onClick={() => setIsMoreMenuOpen(false)}>
      {/* 1. BREADCRUMB & CONTEXT HEADER */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8]">
          <Link to="/app/goals" className="hover:text-slate-900 dark:hover:text-[#F8FAFC] transition-colors">
            Goals
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate max-w-[240px]">
            {goal.title}
          </span>
        </nav>

        {/* OVERFLOW MENU (••• More) */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMoreMenuOpen(!isMoreMenuOpen);
            }}
            aria-label="More options"
            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#161E2D] rounded-xl transition-colors cursor-pointer"
          >
            <MoreHorizontal size={18} />
          </button>

          {isMoreMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#263247] shadow-lg py-1 z-30 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={openEditModal}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] flex items-center gap-2 cursor-pointer"
              >
                <Edit2 size={13} />
                <span>Edit Goal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCheckInModal(true);
                  setIsMoreMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={13} className="text-[#2A7A3B]" />
                <span>Check In</span>
              </button>

              {goal.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPauseModal(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-amber-600 flex items-center gap-2 cursor-pointer"
                >
                  <PauseCircle size={13} />
                  <span>Pause Goal</span>
                </button>
              )}

              {goal.status === 'PAUSED' && (
                <button
                  type="button"
                  onClick={() => statusMutation.mutate('ACTIVE')}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-[#2A7A3B] flex items-center gap-2 cursor-pointer"
                >
                  <PlayCircle size={13} />
                  <span>Resume Goal</span>
                </button>
              )}

              {goal.status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCompleteModal(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-emerald-600 flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Complete Goal</span>
                </button>
              )}

              {goal.status === 'ACTIVE' && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAbandonModal(true);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-rose-600 flex items-center gap-2 cursor-pointer"
                >
                  <span>Abandon Goal</span>
                </button>
              )}

              {goal.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => statusMutation.mutate('ARCHIVED')}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-slate-400 flex items-center gap-2 cursor-pointer border-t border-slate-100 dark:border-[#263247]"
                >
                  <Archive size={13} />
                  <span>Archive Goal</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. COMMAND CENTER HERO */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/50">
                {goal.area === 'OTHER' && goal.customArea ? goal.customArea : goal.area || goal.growthArea}
              </span>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                  goal.priority === 'HIGH'
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                    : 'bg-slate-100 dark:bg-[#161E2D] text-slate-500 border border-slate-200/50'
                }`}
              >
                {goal.priority}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80] border border-[#2A7A3B]/20">
                {goal.status}
              </span>
              <span className="text-slate-400">
                Target · <strong>{formattedTargetDate}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              {goal.title}
            </h1>

            {goal.desiredOutcome ? (
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-2xl">
                {goal.desiredOutcome}
              </p>
            ) : (
              <button
                type="button"
                onClick={openEditModal}
                className="text-xs text-[#2A7A3B] dark:text-[#4ADE80] hover:underline cursor-pointer"
              >
                + Add desired outcome
              </button>
            )}

            {/* Contextual Primary Action Button */}
            <div className="pt-1.5 flex items-center gap-3">
              {renderPrimaryAction()}
            </div>
          </div>

          {/* Compact Progress Widget */}
          <div className="bg-slate-50 dark:bg-[#161E2D] p-5 rounded-2xl border border-slate-200/60 dark:border-[#263247] min-w-[190px] text-center shrink-0">
            <div className="text-3xl font-extrabold text-[#2A7A3B] dark:text-[#4ADE80]">
              {goal.progress || 0}%
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mt-0.5">
              Overall Progress
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#2A7A3B] dark:bg-[#4ADE80] h-full rounded-full transition-all duration-300"
                style={{ width: `${goal.progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. INFORMATION ARCHITECTURE (2-COLUMN GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN: 2 Cols Wide */}
        <div className="lg:col-span-2 space-y-5">
          {/* SUCCESS CRITERIA (Section 32) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Success Criteria
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  How you know this goal has been reached
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] px-2 py-0.5 bg-slate-100 dark:bg-[#161E2D] rounded-md">
                {completedCriteriaCount} of {successCriteria.length} achieved
              </span>
            </div>

            {/* List Rows */}
            <div className="space-y-1.5 mb-3.5">
              {successCriteria.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#161E2D]/60 hover:bg-slate-50 dark:hover:bg-[#161E2D] transition-colors group text-xs"
                >
                  <button
                    type="button"
                    onClick={() =>
                      toggleCriterionMutation.mutate({
                        criterionId: c.id,
                        isCompleted: !c.isCompleted,
                      })
                    }
                    className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                  >
                    {c.isCompleted ? (
                      <CheckCircle2 size={16} className="text-[#2A7A3B] shrink-0" />
                    ) : (
                      <Circle size={16} className="text-slate-400 shrink-0" />
                    )}
                    <span
                      className={`leading-snug ${
                        c.isCompleted
                          ? 'line-through text-slate-400 dark:text-[#64748B]'
                          : 'text-slate-800 dark:text-[#F8FAFC]'
                      }`}
                    >
                      {c.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteCriterionMutation.mutate(c.id)}
                    aria-label="Delete criterion"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Criterion Row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCriterionTitle.trim()) {
                  addCriterionMutation.mutate(newCriterionTitle.trim());
                }
              }}
              className="flex items-center gap-2 pt-1"
            >
              <input
                type="text"
                value={newCriterionTitle}
                onChange={(e) => setNewCriterionTitle(e.target.value)}
                placeholder="+ Add a success criterion..."
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#2A7A3B]"
              />
              <button
                type="submit"
                disabled={!newCriterionTitle.trim() || addCriterionMutation.isPending}
                className="px-3 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </form>
          </div>

          {/* ROADMAP SUMMARY (Section 33) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Roadmap
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  {milestones.length > 0
                    ? `${completedMilestonesCount} of ${milestones.length} milestones completed`
                    : 'Step-by-step phases for this goal'}
                </p>
              </div>

              {roadmap && (
                <Link
                  to="/app/roadmap"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {milestones.length > 0 ? (
              <div className="space-y-1.5">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 dark:bg-[#161E2D]/60 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {m.status === 'COMPLETED' ? (
                        <CheckCircle2 size={15} className="text-[#2A7A3B]" />
                      ) : m.status === 'IN_PROGRESS' ? (
                        <div className="h-3 w-3 rounded-full bg-[#2A7A3B]" />
                      ) : (
                        <Circle size={15} className="text-slate-400" />
                      )}
                      <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">
                        {m.title}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {m.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-5 text-center bg-slate-50 dark:bg-[#161E2D]/40 rounded-xl border border-dashed border-slate-200 dark:border-[#263247]">
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mb-2.5">
                  Turn this goal into a step-by-step plan.
                </p>
                <button
                  type="button"
                  onClick={() => createRoadmapMutation.mutate()}
                  disabled={createRoadmapMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus size={13} />
                  <span>{createRoadmapMutation.isPending ? 'Creating...' : 'Create Roadmap'}</span>
                </button>
              </div>
            )}
          </div>

          {/* UP NEXT TASKS (Section 34) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Up Next
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  Immediate actions for this goal
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 text-xs font-semibold rounded-lg cursor-pointer text-slate-700 dark:text-[#CBD5E1]"
                >
                  <Plus size={12} />
                  <span>Add Task</span>
                </button>
                <Link
                  to="/app/tasks"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline"
                >
                  <span>View all</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-1.5">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-50/80 dark:bg-[#161E2D]/60 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleTaskMutation.mutate({
                          taskId: t.id,
                          status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                        })
                      }
                      className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
                    >
                      {t.status === 'COMPLETED' ? (
                        <CheckCircle2 size={15} className="text-[#2A7A3B] shrink-0" />
                      ) : (
                        <Circle size={15} className="text-slate-400 shrink-0" />
                      )}
                      <span
                        className={`font-medium ${
                          t.status === 'COMPLETED'
                            ? 'line-through text-slate-400 dark:text-[#64748B]'
                            : 'text-slate-800 dark:text-[#F8FAFC]'
                        }`}
                      >
                        {t.title}
                      </span>
                    </button>

                    {t.dueDate && (
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(t.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                No tasks linked yet. Click "+ Add Task" to schedule your next action.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 1 Col Wide */}
        <div className="space-y-5">
          {/* OVERVIEW SECTION (Section 31) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-3.5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
              Overview
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Why this matters</span>
                {goal.why ? (
                  <p className="text-slate-700 dark:text-[#CBD5E1] font-medium leading-relaxed">
                    {goal.why}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={openEditModal}
                    className="text-[#2A7A3B] dark:text-[#4ADE80] hover:underline cursor-pointer"
                  >
                    + Add purpose
                  </button>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Tracking method</span>
                <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                  {goal.trackingMethod === 'NUMBER_TARGET'
                    ? `${goal.currentValue ?? 0} / ${goal.targetValue} ${goal.unit || ''}`
                    : goal.trackingMethod === 'ROUTINE'
                    ? `${goal.routineFrequency}x per ${goal.routinePeriod?.toLowerCase()}`
                    : goal.trackingMethod?.replace('_', ' ')}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Timeline</span>
                <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                  {goal.startDate ? new Date(goal.startDate).toLocaleDateString() : 'Today'} → {formattedTargetDate}
                </span>
              </div>

              {goal.pauseReason && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                  <span className="font-bold block mb-0.5">Paused:</span>
                  <span>{goal.pauseReason}</span>
                  {goal.resumeDate && (
                    <span className="block mt-1 text-[11px]">
                      Resume date: {new Date(goal.resumeDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {goal.abandonReason && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] text-slate-700 dark:text-[#CBD5E1]">
                  <span className="font-bold block mb-0.5">Stopped pursuing:</span>
                  <span>{goal.abandonReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* CHECK-IN WIDGET & TIMELINE (Section 36) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                Check-In
              </h2>
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline cursor-pointer"
              >
                + Check in
              </button>
            </div>

            {goal.checkIns && goal.checkIns.length > 0 ? (
              <div className="space-y-2.5">
                {goal.checkIns.slice(0, 3).map((ci) => (
                  <div
                    key={ci.id}
                    className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#161E2D]/60 border border-slate-200/50 dark:border-[#263247] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          ci.confidence === 'ON_TRACK'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                            : ci.confidence === 'NEEDS_ATTENTION'
                            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                            : 'bg-rose-50 text-rose-600 dark:bg-rose-950/30'
                        }`}
                      >
                        {ci.confidence?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ci.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {ci.whatIsGoingWell && (
                      <p className="text-slate-600 dark:text-[#CBD5E1] text-[11px]">
                        {ci.whatIsGoingWell}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                No check-ins yet. Take a moment to reflect on your progress.
              </div>
            )}
          </div>

          {/* RELATED GROWTH (Section 35) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
              Related Growth
            </h2>

            {hasRelatedGrowth ? (
              <div className="space-y-2 text-xs">
                {goal.skills && goal.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {goal.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px]"
                      >
                        {s.skill?.name || s.name}
                      </span>
                    ))}
                  </div>
                )}
                {goal.projects && goal.projects.length > 0 && (
                  <div className="space-y-1">
                    {goal.projects.map((p) => (
                      <div key={p.id} className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#161E2D] text-slate-800 dark:text-[#F8FAFC]">
                        {p.title}
                      </div>
                    ))}
                  </div>
                )}
                {goal.learningPaths && goal.learningPaths.length > 0 && (
                  <div className="space-y-1">
                    {goal.learningPaths.map((lp) => (
                      <div key={lp.id} className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#161E2D] text-slate-800 dark:text-[#F8FAFC]">
                        {lp.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                Nothing connected yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* CHECK-IN MODAL */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Goal Check-In</h3>
              <button type="button" onClick={() => setShowCheckInModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                  How is this goal going?
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'ON_TRACK', label: 'On Track' },
                    { id: 'NEEDS_ATTENTION', label: 'Needs Attention' },
                    { id: 'AT_RISK', label: 'At Risk' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCheckInConfidence(opt.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center cursor-pointer transition-colors ${
                        checkInConfidence === opt.id
                          ? 'border-[#2A7A3B] bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80]'
                          : 'border-slate-200 dark:border-[#263247] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What's going well?
                </label>
                <textarea
                  rows={2}
                  value={checkInWell}
                  onChange={(e) => setCheckInWell(e.target.value)}
                  placeholder="Wins, steady habits..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What's getting in the way?
                </label>
                <textarea
                  rows={2}
                  value={checkInObstacles}
                  onChange={(e) => setCheckInObstacles(e.target.value)}
                  placeholder="Blockers, distractions..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Do you need to adjust your plan?
                </label>
                <input
                  type="text"
                  value={checkInAdjustments}
                  onChange={(e) => setCheckInAdjustments(e.target.value)}
                  placeholder="Actionable adjustment..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkInMutation.isPending}
                onClick={() =>
                  checkInMutation.mutate({
                    confidence: checkInConfidence,
                    whatIsGoingWell: checkInWell.trim() || undefined,
                    whatIsGettingInWay: checkInObstacles.trim() || undefined,
                    adjustmentsNeeded: checkInAdjustments.trim() || undefined,
                  })
                }
                className="px-4 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Update Progress</h3>
              <button type="button" onClick={() => setShowProgressModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            {goal.trackingMethod === 'NUMBER_TARGET' ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  Current Value ({goal.unit})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={numericCurrent}
                    onChange={(e) => setNumericCurrent(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs font-bold"
                  />
                  <span className="text-xs text-slate-400">/ {goal.targetValue}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">Progress</span>
                  <span className="font-bold text-[#2A7A3B]">{manualPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={manualPercent}
                  onChange={(e) => setManualPercent(Number(e.target.value))}
                  className="w-full accent-[#2A7A3B]"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={progressMutation.isPending}
                onClick={() => {
                  if (goal.trackingMethod === 'NUMBER_TARGET') {
                    progressMutation.mutate({ currentValue: Number(numericCurrent) });
                  } else {
                    progressMutation.mutate({ manualProgress: Number(manualPercent) });
                  }
                }}
                className="px-4 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE GOAL MODAL */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Pause Goal</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Temporarily put this goal on hold. Your milestones, tasks, and history are preserved.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Prioritising exams"
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Resume Date (Optional)
              </label>
              <input
                type="date"
                value={resumeDate}
                onChange={(e) => setResumeDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: 'PAUSED',
                    pauseReason: pauseReason.trim() || undefined,
                    resumeDate: resumeDate || undefined,
                  })
                }
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Pause Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE GOAL MODAL (Section 38) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-3.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#2A7A3B]/10 text-[#2A7A3B]">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Goal Achieved</h3>
                <p className="text-[11px] text-slate-500">Reflect on your growth and key learnings.</p>
              </div>
            </div>

            {completedCriteriaCount < successCriteria.length && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>
                  {successCriteria.length - completedCriteriaCount} criteria remain incomplete, but you can complete this goal if you consider it achieved.
                </span>
              </div>
            )}

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What helped you achieve this?
                </label>
                <textarea
                  rows={2}
                  value={completionReflection}
                  onChange={(e) => setCompletionReflection(e.target.value)}
                  placeholder="Key strategies, consistency, mentors..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What did you learn?
                </label>
                <textarea
                  rows={2}
                  value={completionLearnings}
                  onChange={(e) => setCompletionLearnings(e.target.value)}
                  placeholder="Insights, takeaways, mindsets..."
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: 'COMPLETED',
                    reflection: completionReflection.trim() || undefined,
                    learnings: completionLearnings.trim() || undefined,
                  })
                }
                className="px-4 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Complete Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABANDON GOAL MODAL */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Stop pursuing this goal?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your history, tasks, and progress will be preserved.
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Why are you stopping? (Optional)
              </label>
              <textarea
                rows={2}
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
                placeholder="Shifted priorities..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAbandonModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    status: 'ABANDONED',
                    abandonReason: abandonReason.trim() || undefined,
                  })
                }
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Confirm Abandon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Edit Goal</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Why does this matter?
                </label>
                <textarea
                  rows={2}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Desired Outcome
                </label>
                <input
                  type="text"
                  value={editOutcome}
                  onChange={(e) => setEditOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editGoalMutation.isPending}
                onClick={() =>
                  editGoalMutation.mutate({
                    title: editTitle.trim(),
                    why: editWhy.trim() || null,
                    desiredOutcome: editOutcome.trim() || null,
                    priority: editPriority,
                    targetDate: editTargetDate || null,
                  })
                }
                className="px-4 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Add Task to Goal</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="What action needs to be taken?"
                autoFocus
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                onClick={() => createTaskMutation.mutate(newTaskTitle.trim())}
                className="px-4 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
