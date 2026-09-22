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
  BookOpen,
  FolderGit2,
  Award,
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

  // Invalidate queries helper
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

  // Task Mutation
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

  // Create Roadmap from Template Mutation
  const createRoadmapMutation = useMutation({
    mutationFn: () => planningService.createRoadmap(goalId, { useTemplate: true }),
    onSuccess: () => refreshGoal(),
  });

  if (goalLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="h-8 w-8 border-3 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (goalError || !goal) {
    return (
      <div className="max-w-3xl mx-auto py-12">
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-[#F87171] text-xs flex items-center gap-2 mb-4">
          <AlertCircle size={16} />
          <span>{error?.response?.data?.message || 'Goal not found.'}</span>
        </div>
        <Link
          to="/app/goals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7A3B]"
        >
          <ArrowLeft size={14} />
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
  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');

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
  };

  const openProgressModal = () => {
    setNumericCurrent(goal.currentValue ?? goal.startValue ?? 0);
    setManualPercent(goal.manualProgress ?? goal.progress ?? 0);
    setShowProgressModal(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/goals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Goals</span>
        </Link>

        {/* Quick status lifecycle actions */}
        <div className="flex items-center gap-2">
          {goal.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowPauseModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-[#263247] text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#161E2D] cursor-pointer"
            >
              <PauseCircle size={14} />
              <span>Pause</span>
            </button>
          )}

          {goal.status === 'PAUSED' && (
            <button
              type="button"
              onClick={() => statusMutation.mutate('ACTIVE')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-[#2A7A3B]/10 text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] border border-[#2A7A3B]/20 cursor-pointer"
            >
              <PlayCircle size={14} />
              <span>Resume Goal</span>
            </button>
          )}

          {goal.status !== 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setShowCompleteModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold shadow-xs cursor-pointer"
            >
              <CheckCircle2 size={14} />
              <span>Complete Goal</span>
            </button>
          )}

          {goal.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={() => statusMutation.mutate('ARCHIVED')}
              title="Archive Goal"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <Archive size={15} />
            </button>
          )}

          {goal.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => setShowAbandonModal(true)}
              title="Stop pursuing goal"
              className="text-slate-400 hover:text-rose-600 text-xs px-2 py-1 cursor-pointer"
            >
              Abandon
            </button>
          )}
        </div>
      </div>

      {/* COMMAND CENTER HEADER */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/60 dark:border-[#263247]">
                {goal.area === 'OTHER' && goal.customArea ? goal.customArea : goal.area || goal.growthArea}
              </span>
              <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${
                  goal.priority === 'HIGH'
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200/50'
                    : 'bg-slate-100 dark:bg-[#161E2D] text-slate-500 border border-slate-200/50'
                }`}
              >
                {goal.priority}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80] border border-[#2A7A3B]/20">
                {goal.status}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Target: <strong>{formattedTargetDate}</strong>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC]">
              {goal.title}
            </h1>

            {goal.desiredOutcome && (
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                {goal.desiredOutcome}
              </p>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold cursor-pointer transition-colors"
              >
                <Sparkles size={13} className="text-[#2A7A3B]" />
                <span>Check In</span>
              </button>

              {(goal.trackingMethod === 'NUMBER_TARGET' || goal.trackingMethod === 'MANUAL') && (
                <button
                  type="button"
                  onClick={openProgressModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold cursor-pointer transition-colors"
                >
                  <TrendingUp size={13} className="text-[#2A7A3B]" />
                  <span>Update Progress</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowNewTaskModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Add Task</span>
              </button>

              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 dark:hover:bg-[#1E293B] text-slate-800 dark:text-[#F8FAFC] text-xs font-semibold cursor-pointer transition-colors"
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Progress Widget */}
          <div className="bg-slate-50 dark:bg-[#161E2D] p-5 rounded-2xl border border-slate-200/60 dark:border-[#263247] min-w-[200px] text-center flex flex-col justify-center">
            <div className="text-3xl font-extrabold text-[#2A7A3B] dark:text-[#4ADE80]">
              {goal.progress || 0}%
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-[#94A3B8] mt-1">
              Overall Progress
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mt-3">
              <div
                className="bg-[#2A7A3B] dark:bg-[#4ADE80] h-full rounded-full transition-all duration-300"
                style={{ width: `${goal.progress || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#64748B] mt-2">
              Tracked via {goal.trackingMethod?.replace('_', ' ') || 'Milestones'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: 2 Cols Wide */}
        <div className="lg:col-span-2 space-y-6">
          {/* SUCCESS CRITERIA SECTION (Section 14) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Success Criteria
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  {successCriteria.length > 0
                    ? `${completedCriteriaCount} of ${successCriteria.length} achieved`
                    : 'How will you know this goal is achieved?'}
                </p>
              </div>
            </div>

            {/* Criteria List */}
            <div className="space-y-2 mb-4">
              {successCriteria.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/60 dark:border-[#263247] group"
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
                      className={`text-xs ${
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
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Criterion Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newCriterionTitle.trim()) {
                  addCriterionMutation.mutate(newCriterionTitle.trim());
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newCriterionTitle}
                onChange={(e) => setNewCriterionTitle(e.target.value)}
                placeholder="Add a concrete success criterion..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
              />
              <button
                type="submit"
                disabled={!newCriterionTitle.trim() || addCriterionMutation.isPending}
                className="inline-flex items-center gap-1 px-3 py-2 bg-[#2A7A3B] hover:bg-[#22653A] disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* ROADMAP SECTION (Section 15) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Roadmap
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  {milestones.length > 0
                    ? `${completedMilestonesCount} of ${milestones.length} milestones completed`
                    : 'Step-by-step milestones toward this goal'}
                </p>
              </div>

              {roadmap && (
                <Link
                  to="/app/roadmap"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7A3B] hover:underline"
                >
                  <span>Open Roadmap</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>

            {milestones.length > 0 ? (
              <div className="space-y-2">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/60 dark:border-[#263247] text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      {m.status === 'COMPLETED' ? (
                        <CheckCircle2 size={15} className="text-[#2A7A3B]" />
                      ) : m.status === 'IN_PROGRESS' ? (
                        <div className="h-3.5 w-3.5 rounded-full bg-[#2A7A3B] border-2 border-white dark:border-[#111827]" />
                      ) : (
                        <Circle size={15} className="text-slate-400" />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                        {m.title}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {m.progress || 0}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center bg-slate-50 dark:bg-[#161E2D] rounded-xl border border-dashed border-slate-200 dark:border-[#263247]">
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mb-3">
                  Turn this goal into a step-by-step plan.
                </p>
                <button
                  type="button"
                  onClick={() => createRoadmapMutation.mutate()}
                  disabled={createRoadmapMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>{createRoadmapMutation.isPending ? 'Creating...' : 'Create Roadmap'}</span>
                </button>
              </div>
            )}
          </div>

          {/* TASKS SECTION (Section 16: Up Next) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                  Up Next
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Actions linked to this goal
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 text-xs font-semibold rounded-lg cursor-pointer text-slate-700 dark:text-[#CBD5E1]"
                >
                  <Plus size={13} />
                  <span>Add Task</span>
                </button>
                <Link
                  to="/app/tasks"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#2A7A3B] hover:underline"
                >
                  <span>View all tasks</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/60 dark:border-[#263247] text-xs"
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
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
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
              <div className="py-5 text-center text-xs text-slate-400">
                No tasks linked yet. Click "+ Add Task" to schedule actions for this goal.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 1 Col Wide */}
        <div className="space-y-6">
          {/* OVERVIEW DETAILS (Section 13) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
              Goal Overview
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
                    className="text-[#2A7A3B] hover:underline cursor-pointer"
                  >
                    + Add why this matters
                  </button>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Start Date</span>
                <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                  {goal.startDate
                    ? new Date(goal.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block text-[11px] mb-0.5">Target Date</span>
                <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                  {formattedTargetDate}
                </span>
              </div>

              {goal.trackingMethod === 'NUMBER_TARGET' && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Target Tracking</span>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                    {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit}
                  </span>
                </div>
              )}

              {goal.trackingMethod === 'ROUTINE' && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-0.5">Consistency Target</span>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                    {goal.routineFrequency} times per {goal.routinePeriod?.toLowerCase()}
                  </span>
                </div>
              )}

              {goal.pauseReason && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
                  <span className="font-bold block mb-0.5">Pause Reason:</span>
                  <span>{goal.pauseReason}</span>
                  {goal.resumeDate && (
                    <span className="block mt-1 text-[11px]">
                      Expected resume: {new Date(goal.resumeDate).toLocaleDateString()}
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

          {/* RELATED GROWTH SECTION (Section 17) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
              Related Growth
            </h2>

            {/* Skills */}
            {goal.skills && goal.skills.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {goal.skills.map((s) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-medium"
                    >
                      {s.skill?.name || s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {goal.projects && goal.projects.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Projects
                </span>
                <div className="space-y-1">
                  {goal.projects.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-[#161E2D]"
                    >
                      <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">
                        {p.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning Paths */}
            {goal.learningPaths && goal.learningPaths.length > 0 && (
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5 uppercase">
                  Learning
                </span>
                <div className="space-y-1">
                  {goal.learningPaths.map((lp) => (
                    <div
                      key={lp.id}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-[#161E2D]"
                    >
                      <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">
                        {lp.title}
                      </span>
                      <span className="text-[10px] text-slate-400">{lp.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!goal.skills || goal.skills.length === 0) &&
              (!goal.projects || goal.projects.length === 0) &&
              (!goal.learningPaths || goal.learningPaths.length === 0) && (
                <div className="text-xs text-slate-400 py-2">
                  No linked skills, projects, or learning paths yet.
                </div>
              )}
          </div>

          {/* GOAL CHECK-IN & RECENT ACTIVITY (Section 18 & 19) */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                Check-Ins
              </h2>
              <button
                type="button"
                onClick={() => setShowCheckInModal(true)}
                className="text-xs font-semibold text-[#2A7A3B] hover:underline cursor-pointer"
              >
                + New Check-in
              </button>
            </div>

            {goal.checkIns && goal.checkIns.length > 0 ? (
              <div className="space-y-3">
                {goal.checkIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/60 dark:border-[#263247] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                          ci.confidence === 'ON_TRACK'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600'
                            : ci.confidence === 'NEEDS_ATTENTION'
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600'
                        }`}
                      >
                        {ci.confidence?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(ci.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {ci.whatIsGoingWell && (
                      <p className="text-slate-700 dark:text-[#CBD5E1]">
                        <strong className="text-slate-500">Going well:</strong> {ci.whatIsGoingWell}
                      </p>
                    )}
                    {ci.whatIsGettingInWay && (
                      <p className="text-slate-700 dark:text-[#CBD5E1]">
                        <strong className="text-slate-500">Obstacles:</strong> {ci.whatIsGettingInWay}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-2">
                No check-ins yet. Take a moment to reflect on your progress.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}

      {/* CHECK-IN MODAL (Section 19) */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                Goal Check-In
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
                  How is this goal going?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ON_TRACK', label: 'On Track' },
                    { id: 'NEEDS_ATTENTION', label: 'Needs Attention' },
                    { id: 'AT_RISK', label: 'At Risk' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCheckInConfidence(opt.id)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center cursor-pointer transition-colors ${
                        checkInConfidence === opt.id
                          ? 'border-[#2A7A3B] bg-emerald-50 text-[#2A7A3B] dark:bg-[#2A7A3B]/10 dark:text-[#4ADE80]'
                          : 'border-slate-200 dark:border-[#263247] text-slate-600 dark:text-[#94A3B8]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What's going well?
                </label>
                <textarea
                  rows={2}
                  value={checkInWell}
                  onChange={(e) => setCheckInWell(e.target.value)}
                  placeholder="Wins, steady habits, accomplishments..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What's getting in the way?
                </label>
                <textarea
                  rows={2}
                  value={checkInObstacles}
                  onChange={(e) => setCheckInObstacles(e.target.value)}
                  placeholder="Blockers, time constraints, motivation..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Do you need to adjust your plan?
                </label>
                <input
                  type="text"
                  value={checkInAdjustments}
                  onChange={(e) => setCheckInAdjustments(e.target.value)}
                  placeholder="Actionable adjustment..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowCheckInModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save Check-In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE PROGRESS MODAL */}
      {showProgressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                Update Progress
              </h3>
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {goal.trackingMethod === 'NUMBER_TARGET' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  Current Value ({goal.unit})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={numericCurrent}
                    onChange={(e) => setNumericCurrent(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs font-bold"
                  />
                  <span className="text-xs text-slate-400">/ {goal.targetValue}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                    Progress Percentage
                  </span>
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

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE GOAL MODAL (Section 21) */}
      {showPauseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Pause Goal</h3>
            <p className="text-xs text-slate-500">
              Temporarily put this goal on hold. Your milestones, tasks, and history are preserved.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="e.g. Taking time off, prioritising exams"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Resume Date (Optional)
              </label>
              <input
                type="date"
                value={resumeDate}
                onChange={(e) => setResumeDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowPauseModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Pause Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE GOAL MODAL (Section 23) */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Complete Goal</h3>
            <p className="text-xs text-slate-500">
              Celebrate your accomplishment and reflect on your growth.
            </p>

            {/* Warning if criteria or tasks are incomplete */}
            {completedCriteriaCount < successCriteria.length && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>
                  {successCriteria.length - completedCriteriaCount} success criteria are still incomplete. You can still complete this goal if you consider it achieved.
                </span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What helped you achieve this?
                </label>
                <textarea
                  rows={2}
                  value={completionReflection}
                  onChange={(e) => setCompletionReflection(e.target.value)}
                  placeholder="Key strategies, consistency, mentors, tools..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  What did you learn?
                </label>
                <textarea
                  rows={2}
                  value={completionLearnings}
                  onChange={(e) => setCompletionLearnings(e.target.value)}
                  placeholder="Insights, takeaways, mindsets..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowCompleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Complete Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABANDON GOAL MODAL (Section 22) */}
      {showAbandonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Stop pursuing this goal?</h3>
            <p className="text-xs text-slate-500">
              Your history, tasks, and progress will be preserved, but this goal will be marked as abandoned.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                Why are you stopping? (Optional)
              </label>
              <textarea
                rows={2}
                value={abandonReason}
                onChange={(e) => setAbandonReason(e.target.value)}
                placeholder="Shifted priorities, goal no longer relevant..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAbandonModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Confirm Abandon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1E293B] pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Edit Goal</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Why does this matter?
                </label>
                <textarea
                  rows={2}
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Desired Outcome
                </label>
                <input
                  type="text"
                  value={editOutcome}
                  onChange={(e) => setEditOutcome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={editTargetDate}
                    onChange={(e) => setEditTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
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
                className="px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD TASK MODAL */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl p-6 space-y-4">
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewTaskModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newTaskTitle.trim() || createTaskMutation.isPending}
                onClick={() => createTaskMutation.mutate(newTaskTitle.trim())}
                className="px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-semibold rounded-xl cursor-pointer"
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
