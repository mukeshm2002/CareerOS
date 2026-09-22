import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { planningService } from '../features/planning/services/planningService';
import { PageHeader } from '../components/common/PageHeader';
import {
  Milestone,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PlayCircle,
  Ban,
  FastForward,
  Plus,
  Trash2,
  CheckSquare,
  Sparkles,
  X,
  Target,
  Check,
  Compass,
  MoreHorizontal,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Flag,
  Calendar,
} from 'lucide-react';

export const RoadmapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [expandedMilestoneId, setExpandedMilestoneId] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [confirmingMilestone, setConfirmingMilestone] = useState(null);
  const [addingTaskMilestoneId, setAddingTaskMilestoneId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskEst, setTaskEst] = useState('45');
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');

  const menuRef = useRef(null);

  // Close overflow menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Goals to populate dropdown
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getGoals(),
  });

  const goals = goalsData?.data?.goals || [];
  const selectedGoalId = searchParams.get('goalId') || goals[0]?.id;
  const currentGoal = goals.find((g) => g.id === selectedGoalId) || goals[0];

  // Fetch Roadmap for selected goal
  const { data: roadmapData, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap', selectedGoalId],
    queryFn: () => planningService.getRoadmapByGoal(selectedGoalId),
    enabled: !!selectedGoalId,
  });

  // Fetch preview for generator empty state
  const { data: previewData } = useQuery({
    queryKey: ['roadmap-preview', currentGoal?.type, currentGoal?.title],
    queryFn: () => planningService.getTemplatePreview(currentGoal?.type, currentGoal?.title),
    enabled: !!currentGoal && !roadmapData?.data?.roadmap,
  });

  // Mutations
  const createRoadmapMutation = useMutation({
    mutationFn: () => planningService.createRoadmap(selectedGoalId, { useTemplate: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const milestoneStatusMutation = useMutation({
    mutationFn: ({ id, status }) => planningService.updateMilestoneStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setConfirmingMilestone(null);
      setActiveMenuId(null);
    },
  });

  const addMilestoneMutation = useMutation({
    mutationFn: (data) => planningService.addMilestone(roadmap?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      setShowAddMilestoneModal(false);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
    },
  });

  const deleteMilestoneMutation = useMutation({
    mutationFn: (id) => planningService.deleteMilestone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      setActiveMenuId(null);
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: ({ milestoneId, title, estimatedMinutes }) =>
      planningService.createTask({
        title,
        estimatedMinutes: parseInt(estimatedMinutes, 10) || 30,
        milestoneId,
        goalId: selectedGoalId,
        status: 'TODO',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setAddingTaskMilestoneId(null);
      setTaskTitle('');
    },
  });

  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => planningService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => planningService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedMilestoneIds) =>
      planningService.reorderMilestones(roadmap?.id, orderedMilestoneIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      setActiveMenuId(null);
    },
  });

  const handleGoalChange = (newGoalId) => {
    setSearchParams({ goalId: newGoalId });
  };

  const handleMoveMilestone = (index, direction) => {
    if (!milestones) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= milestones.length) return;

    const reordered = [...milestones];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);

    const ids = reordered.map((m) => m.id);
    reorderMutation.mutate(ids);
  };

  const roadmap = roadmapData?.data?.roadmap;
  const milestones = roadmap?.milestones || [];

  // Factual classification of current stage:
  // ONLY an IN_PROGRESS milestone is truthfully the "CURRENT STAGE".
  // If no milestone is IN_PROGRESS, the next pending stage is UP NEXT, NOT Current.
  const inProgressMilestone = milestones.find((m) => m.status === 'IN_PROGRESS');
  const firstNotStartedMilestone = milestones.find((m) => m.status === 'NOT_STARTED');
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED');
  const activeMilestones = milestones.filter((m) => m.status !== 'SKIPPED');

  const allCompleted = milestones.length > 0 && completedMilestones.length === activeMilestones.length;

  // The active focus milestone for the UI:
  // If an in-progress milestone exists, that's the focus.
  // Otherwise, the first not-started milestone is the target focus.
  const focusMilestone = inProgressMilestone || firstNotStartedMilestone || milestones[milestones.length - 1];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* 1. Page Header & Goal Selector */}
      <PageHeader
        icon={Milestone}
        title="Roadmap"
        subtitle="Your path from goal to achievement."
        action={
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-slate-500 dark:text-[#94A3B8] shrink-0 hidden sm:inline">
              Goal:
            </span>
            <div className="relative">
              <select
                value={selectedGoalId || ''}
                onChange={(e) => handleGoalChange(e.target.value)}
                className="appearance-none bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#253044] text-slate-900 dark:text-[#F8FAFC] text-xs font-semibold py-2 pl-3 pr-8 rounded-xl shadow-xs focus:ring-2 focus:ring-[#2A7A3B] dark:focus:ring-[#34A854] focus:outline-hidden cursor-pointer"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.type?.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-3 text-slate-400 dark:text-[#64748B] pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* 2. Compact Goal Journey Summary (90% Calm, High Information) */}
      {roadmap && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#253044] p-4.5 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {currentGoal?.title}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-[#64748B] font-medium">
                  · {currentGoal?.type?.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                {completedMilestones.length} of {activeMilestones.length} milestones achieved
              </p>
            </div>

            <div className="text-right shrink-0">
              <div className="text-xl sm:text-2xl font-extrabold text-[#2A7A3B] dark:text-[#34A854] tracking-tight">
                {roadmap.progress}%
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-[#64748B] tracking-wider block">
                Progress
              </span>
            </div>
          </div>

          {/* Thin, Elegant Journey Progress Filament */}
          <div className="w-full bg-slate-100 dark:bg-[#1A2333] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#2A7A3B] to-[#34A854] h-full rounded-full transition-all duration-500"
              style={{ width: `${roadmap.progress || 0}%` }}
            />
          </div>

          {/* Contextual Truthful Status Callout */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-[#1E293B]">
            <div className="flex items-center gap-2 min-w-0">
              {inProgressMilestone ? (
                <>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2A7A3B] dark:text-[#34A854] uppercase tracking-wider shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2A7A3B] dark:bg-[#34A854] animate-pulse" />
                    Current:
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">
                    {inProgressMilestone.title}
                  </span>
                </>
              ) : allCompleted ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Check size={13} strokeWidth={2.5} />
                  All milestones achieved! Goal destination reached.
                </span>
              ) : firstNotStartedMilestone ? (
                <>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-[#64748B] uppercase tracking-wider shrink-0">
                    Up next:
                  </span>
                  <span className="font-semibold text-slate-700 dark:text-[#E2E8F0] truncate">
                    {firstNotStartedMilestone.title}
                  </span>
                </>
              ) : null}
            </div>

            {currentGoal?.targetDate && (
              <div className="text-[11px] text-slate-400 dark:text-[#64748B] shrink-0 hidden sm:flex items-center gap-1">
                <Calendar size={11} />
                Target · {new Date(currentGoal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Main Roadmap Vertical Journey */}
      {roadmap ? (
        <div className="space-y-4">
          {/* Journey Section Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-[#2A7A3B] dark:text-[#34A854]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                Your Journey ({milestones.length} {milestones.length === 1 ? 'Stage' : 'Stages'})
              </h3>
            </div>

            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151D2B] dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#F8FAFC] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Stage</span>
            </button>
          </div>

          {/* Continuous Journey Container */}
          <div className="relative pl-6 sm:pl-8 pr-1 py-2">
            {/* START Marker */}
            <div className="flex items-center gap-3 pb-5">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1A2333] border border-slate-300 dark:border-[#253044] flex items-center justify-center shrink-0 -ml-4 z-10">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2A7A3B] dark:bg-[#34A854]" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                Start of Journey
              </span>
            </div>

            {/* Vertical Journey Milestones */}
            <div className="relative space-y-6">
              {milestones.map((stage, idx) => {
                const isExpanded = expandedMilestoneId === stage.id;
                const isCompleted = stage.status === 'COMPLETED';
                const isInProgress = stage.status === 'IN_PROGRESS';
                const isBlocked = stage.status === 'BLOCKED';
                const isSkipped = stage.status === 'SKIPPED';
                const isNotStarted = stage.status === 'NOT_STARTED';

                // Determine if this is the focal energy milestone
                const isFocalStage = isInProgress || (!inProgressMilestone && stage.id === firstNotStartedMilestone?.id);

                const tasks = stage.tasks || [];
                const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
                const nextPendingTask = tasks.find((t) => t.status !== 'COMPLETED');
                const allTasksDone = tasks.length > 0 && completedTasks.length === tasks.length;
                const taskExecutionPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

                const isMenuOpen = activeMenuId === stage.id;

                return (
                  <div key={stage.id} className="relative flex items-start gap-4">
                    {/* The Living Connector Filament */}
                    <div
                      className={`absolute -left-4 top-8 -bottom-7 w-[2px] z-0 transition-colors ${
                        isCompleted
                          ? 'bg-[#2A7A3B] dark:bg-[#34A854]'
                          : isInProgress
                          ? 'bg-gradient-to-b from-[#2A7A3B] to-slate-200 dark:from-[#34A854] dark:to-[#253044]'
                          : 'bg-slate-200 dark:bg-[#253044]'
                      }`}
                    />

                    {/* Node Glyphs */}
                    <div className="relative z-10 shrink-0 -ml-4 mt-0.5">
                      {isCompleted ? (
                        /* Quiet Earned Milestone Node */
                        <div
                          title="Stage Achieved"
                          className="h-8 w-8 rounded-full bg-[#2A7A3B]/10 dark:bg-[#34A854]/15 border-2 border-[#2A7A3B] dark:border-[#34A854] text-[#2A7A3B] dark:text-[#34A854] flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          <Check size={15} strokeWidth={2.5} />
                        </div>
                      ) : isInProgress ? (
                        /* 10% Visual Energy: Active Beacon Node */
                        <div
                          title="Current Active Stage"
                          className="h-9 w-9 rounded-full bg-[#2A7A3B] dark:bg-[#34A854] text-white flex items-center justify-center font-bold text-xs shadow-[0_0_15px_rgba(42,122,59,0.35)] dark:shadow-[0_0_18px_rgba(52,168,84,0.4)] ring-4 ring-[#2A7A3B]/20 dark:ring-[#34A854]/25"
                        >
                          <PlayCircle size={16} strokeWidth={2.5} />
                        </div>
                      ) : isBlocked ? (
                        /* Blocked Node */
                        <div
                          title="Stage Blocked"
                          className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          <Ban size={14} strokeWidth={2} />
                        </div>
                      ) : isSkipped ? (
                        /* Skipped Node */
                        <div
                          title="Stage Skipped"
                          className="h-8 w-8 rounded-full bg-slate-100 dark:bg-[#1A2333] border-2 border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs"
                        >
                          <FastForward size={13} />
                        </div>
                      ) : (
                        /* Clean Upcoming Neutral Ring */
                        <div
                          title="Upcoming Stage"
                          className="h-8 w-8 rounded-full bg-white dark:bg-[#151D2B] border-2 border-slate-300 dark:border-[#253044] text-slate-500 dark:text-[#94A3B8] flex items-center justify-center font-semibold text-xs"
                        >
                          {stage.sequence}
                        </div>
                      )}
                    </div>

                    {/* Milestone Card Surface */}
                    <div
                      className={`flex-1 rounded-2xl transition-all ${
                        isInProgress
                          ? 'bg-white dark:bg-[#151D2B] border-2 border-[#2A7A3B]/50 dark:border-[#34A854]/50 shadow-md p-4 sm:p-5 space-y-3.5'
                          : isCompleted
                          ? 'bg-slate-50/70 dark:bg-[#111827]/70 border border-slate-200/60 dark:border-[#1E293B] p-3.5 sm:p-4 space-y-2'
                          : 'bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#253044] p-3.5 sm:p-4.5 space-y-2.5'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-slate-400 dark:text-[#64748B]">
                              #{String(stage.sequence).padStart(2, '0')}
                            </span>

                            {/* Truthful Semantic Status Label */}
                            {isCompleted ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                                Achieved
                              </span>
                            ) : isInProgress ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#2A7A3B] dark:bg-[#34A854] dark:text-[#0B0F17] px-2 py-0.5 rounded-md">
                                Current Stage
                              </span>
                            ) : isBlocked ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/40">
                                Blocked
                              </span>
                            ) : isSkipped ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#1A2333] px-2 py-0.5 rounded-md">
                                Skipped
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#1A2333] px-2 py-0.5 rounded-md">
                                {stage.id === firstNotStartedMilestone?.id ? 'Up Next' : 'Upcoming'}
                              </span>
                            )}
                          </div>

                          <h4
                            onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                            className={`font-bold cursor-pointer transition-colors ${
                              isInProgress
                                ? 'text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]'
                                : isCompleted
                                ? 'text-sm text-slate-500 dark:text-[#94A3B8] line-through'
                                : 'text-sm sm:text-base text-slate-800 dark:text-[#E2E8F0] hover:text-[#2A7A3B] dark:hover:text-[#34A854]'
                            }`}
                          >
                            {stage.title}
                          </h4>

                          {stage.description && !isCompleted && (
                            <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed pt-0.5">
                              {stage.description}
                            </p>
                          )}
                        </div>

                        {/* Overflow Actions Trigger (•••) */}
                        <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                          <button
                            onClick={() => setActiveMenuId(isMenuOpen ? null : stage.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1E293B] transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {/* Contextual Overflow Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-30 w-48 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#253044] shadow-xl py-1 text-xs">
                              {/* Add Task */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setAddingTaskMilestoneId(stage.id);
                                  setExpandedMilestoneId(stage.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1E293B] flex items-center gap-2"
                              >
                                <Plus size={13} />
                                <span>Add Task</span>
                              </button>

                              {/* Mark Stage Achieved (if not already completed) */}
                              {!isCompleted && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConfirmingMilestone(stage);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-medium"
                                >
                                  <Check size={13} strokeWidth={2.5} />
                                  <span>Mark Stage Achieved</span>
                                </button>
                              )}

                              {/* Start Stage (if not started) */}
                              {isNotStarted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3 py-1.5 text-[#2A7A3B] dark:text-[#34A854] hover:bg-slate-100 dark:hover:bg-[#1E293B] flex items-center gap-2"
                                >
                                  <PlayCircle size={13} />
                                  <span>Start Stage</span>
                                </button>
                              )}

                              {/* Reopen Stage (if completed) */}
                              {isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1E293B] flex items-center gap-2"
                                >
                                  <RotateCcw size={13} />
                                  <span>Reopen Stage</span>
                                </button>
                              )}

                              {/* Block Stage */}
                              {!isBlocked && !isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'BLOCKED' })}
                                  className="w-full text-left px-3 py-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                                >
                                  <Ban size={13} />
                                  <span>Block Stage</span>
                                </button>
                              )}

                              {/* Unblock Stage */}
                              {isBlocked && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3 py-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2"
                                >
                                  <PlayCircle size={13} />
                                  <span>Resume Stage</span>
                                </button>
                              )}

                              {/* Skip Stage */}
                              {!isSkipped && !isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'SKIPPED' })}
                                  className="w-full text-left px-3 py-1.5 text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#1E293B] flex items-center gap-2"
                                >
                                  <FastForward size={13} />
                                  <span>Skip Stage</span>
                                </button>
                              )}

                              <div className="border-t border-slate-100 dark:border-[#253044] my-1" />

                              {/* Reorder Up / Down */}
                              <button
                                onClick={() => handleMoveMilestone(idx, 'up')}
                                disabled={idx === 0}
                                className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1E293B] disabled:opacity-30 flex items-center gap-2"
                              >
                                <ArrowUp size={13} />
                                <span>Move Up</span>
                              </button>

                              <button
                                onClick={() => handleMoveMilestone(idx, 'down')}
                                disabled={idx === milestones.length - 1}
                                className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1E293B] disabled:opacity-30 flex items-center gap-2"
                              >
                                <ArrowDown size={13} />
                                <span>Move Down</span>
                              </button>

                              <div className="border-t border-slate-100 dark:border-[#253044] my-1" />

                              {/* Delete Stage */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (window.confirm(`Delete milestone "${stage.title}"?`)) {
                                    deleteMilestoneMutation.mutate(stage.id);
                                  }
                                }}
                                className="w-full text-left px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                              >
                                <Trash2 size={13} />
                                <span>Delete Stage</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* IN_PROGRESS: Execution Progress & Next Action (The 10% Visual Energy Moment) */}
                      {isInProgress && (
                        <div className="space-y-3 pt-1">
                          {/* Milestone Execution Progress Bar */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-[#94A3B8] font-medium">
                                Execution progress ({completedTasks.length} of {tasks.length} tasks completed)
                              </span>
                              <span className="font-bold text-[#2A7A3B] dark:text-[#34A854]">
                                {taskExecutionPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#1A2333] h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#2A7A3B] dark:bg-[#34A854] h-full rounded-full transition-all duration-300"
                                style={{ width: `${taskExecutionPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* 100% Tasks Done -> Earned Milestone Completion Confirmation Banner */}
                          {allTasksDone ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                  <Check size={13} strokeWidth={3} />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 block">
                                    All planned tasks completed!
                                  </span>
                                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                    Ready to confirm that you achieved this milestone outcome?
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => setConfirmingMilestone(stage)}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0 cursor-pointer"
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>Mark Stage Achieved</span>
                              </button>
                            </div>
                          ) : nextPendingTask ? (
                            /* Contextual Immediate Next Action Row */
                            <div className="p-3 bg-[#2A7A3B]/5 dark:bg-[#34A854]/5 rounded-xl border border-[#2A7A3B]/20 dark:border-[#34A854]/20 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-2 h-2 rounded-full bg-[#2A7A3B] dark:bg-[#34A854] shrink-0" />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2A7A3B] dark:text-[#34A854] block">
                                    Immediate Next Action
                                  </span>
                                  <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                                    {nextPendingTask.title}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => toggleTaskMutation.mutate({ taskId: nextPendingTask.id, status: 'COMPLETED' })}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] font-semibold text-xs shadow-xs transition-colors shrink-0 cursor-pointer"
                              >
                                <Check size={13} strokeWidth={2.5} />
                                <span>Complete Action</span>
                              </button>
                            </div>
                          ) : (
                            /* No tasks yet */
                            <div className="p-2.5 bg-slate-50 dark:bg-[#1A2333]/50 rounded-xl border border-slate-200 dark:border-[#253044] flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-[#94A3B8]">No pending tasks in this stage.</span>
                              <button
                                onClick={() => {
                                  setAddingTaskMilestoneId(stage.id);
                                  setExpandedMilestoneId(stage.id);
                                }}
                                className="font-semibold text-[#2A7A3B] dark:text-[#34A854] hover:underline cursor-pointer"
                              >
                                + Add Task
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action & Info Footer */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E293B] text-xs">
                        {/* Task Count & Target Info */}
                        <div className="flex items-center gap-3 text-slate-500 dark:text-[#94A3B8] text-[11px]">
                          <button
                            onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                            className="font-medium text-slate-600 dark:text-[#CBD5E1] hover:text-[#2A7A3B] dark:hover:text-[#34A854] flex items-center gap-1 cursor-pointer"
                          >
                            <CheckSquare size={13} />
                            <span>
                              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                              {tasks.length > 0 && ` (${completedTasks.length} done)`}
                            </span>
                            <ChevronDown
                              size={12}
                              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            />
                          </button>

                          {stage.targetDate && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} />
                              Target: {new Date(stage.targetDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Primary Contextual Action Button */}
                        <div className="flex items-center gap-2">
                          {isNotStarted && (
                            <button
                              onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                              className="px-3 py-1 rounded-lg bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Start Stage
                            </button>
                          )}

                          {isBlocked && (
                            <button
                              onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                            >
                              Resume Stage
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Quick Add Task Row */}
                      {addingTaskMilestoneId === stage.id && (
                        <div className="p-3 bg-slate-50 dark:bg-[#151D2B] rounded-xl border border-slate-200 dark:border-[#253044] space-y-2 text-xs mt-2">
                          <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                            Add Task to {stage.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="What action needs to be completed?"
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#253044] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] dark:focus:ring-[#34A854] focus:outline-hidden"
                            />
                            <input
                              type="number"
                              placeholder="Mins"
                              value={taskEst}
                              onChange={(e) => setTaskEst(e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-[#253044] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs text-center"
                            />
                            <button
                              onClick={() => addTaskMutation.mutate({ milestoneId: stage.id, title: taskTitle, estimatedMinutes: taskEst })}
                              disabled={!taskTitle.trim() || addTaskMutation.isPending}
                              className="px-3.5 py-1.5 rounded-lg bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] font-semibold text-xs disabled:opacity-50 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Tasks Drawer */}
                      {isExpanded && tasks.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                              Stage Tasks ({tasks.length})
                            </h5>
                            <button
                              onClick={() => setAddingTaskMilestoneId(stage.id)}
                              className="text-[11px] font-semibold text-[#2A7A3B] dark:text-[#34A854] hover:underline cursor-pointer"
                            >
                              + Add Task
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {tasks.map((t) => (
                              <div
                                key={t.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-[#151D2B] border border-slate-200/80 dark:border-[#253044] flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <button
                                    onClick={() =>
                                      toggleTaskMutation.mutate({
                                        taskId: t.id,
                                        status: t.status === 'COMPLETED' ? 'TODO' : 'COMPLETED',
                                      })
                                    }
                                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors cursor-pointer ${
                                      t.status === 'COMPLETED'
                                        ? 'bg-[#2A7A3B] dark:bg-[#34A854] border-[#2A7A3B] dark:border-[#34A854] text-white dark:text-[#0B0F17]'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-[#2A7A3B]'
                                    }`}
                                  >
                                    {t.status === 'COMPLETED' && <Check size={11} strokeWidth={3} />}
                                  </button>
                                  <span
                                    className={`truncate ${
                                      t.status === 'COMPLETED'
                                        ? 'line-through text-slate-400 dark:text-[#64748B]'
                                        : 'text-slate-800 dark:text-[#F8FAFC] font-medium'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-[#64748B] shrink-0">
                                  <span>{t.estimatedMinutes}m</span>
                                  <button
                                    onClick={() => deleteTaskMutation.mutate(t.id)}
                                    className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                                    title="Delete task"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESTINATION Marker */}
            <div className="flex items-center gap-3 pt-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1A2333] border border-slate-300 dark:border-[#253044] flex items-center justify-center shrink-0 -ml-4 z-10">
                <Flag size={14} className={allCompleted ? 'text-[#2A7A3B] dark:text-[#34A854]' : 'text-slate-400'} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
                  Destination
                </span>
                <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC] truncate block">
                  {currentGoal?.title} {allCompleted && '🏆'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. Empty State: Inspiring Journey Generator */
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#253044] p-8 sm:p-12 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#2A7A3B]/10 dark:bg-[#34A854]/15 text-[#2A7A3B] dark:text-[#34A854] flex items-center justify-center mx-auto">
            <Compass size={24} />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC]">
              Your roadmap starts here.
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
              Turn <strong>{currentGoal?.title || 'this goal'}</strong> into a clear path of meaningful stages.
            </p>
          </div>

          {/* Generator Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => createRoadmapMutation.mutate()}
              disabled={createRoadmapMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] text-xs font-semibold shadow-xs shadow-[#2A7A3B]/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{createRoadmapMutation.isPending ? 'Generating Roadmap...' : 'Build Roadmap'}</span>
            </button>

            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#151D2B] dark:hover:bg-[#1E293B] text-slate-700 dark:text-[#F8FAFC] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add First Stage Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION MODAL: Mark Stage Achieved */}
      {confirmingMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253044] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E293B]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#2A7A3B] dark:text-[#34A854]" />
                Mark Stage Achieved
              </h3>
              <button
                onClick={() => setConfirmingMilestone(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                Ready to confirm that you achieved the intended outcome for{' '}
                <strong className="text-slate-900 dark:text-[#F8FAFC]">
                  "{confirmingMilestone.title}"
                </strong>?
              </p>

              {/* Factual Task Execution Breakdown */}
              {(() => {
                const stageTasks = confirmingMilestone.tasks || [];
                const completed = stageTasks.filter((t) => t.status === 'COMPLETED').length;
                const incomplete = stageTasks.length - completed;

                return (
                  <div className="p-3 bg-slate-50 dark:bg-[#151D2B] rounded-xl border border-slate-200 dark:border-[#253044] space-y-1">
                    <div className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                      Task execution: {completed} of {stageTasks.length} tasks completed
                    </div>
                    {incomplete > 0 && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400">
                        {incomplete} {incomplete === 1 ? 'task is' : 'tasks are'} still incomplete. You can still mark the stage achieved if the intended milestone outcome was reached.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                onClick={() => setConfirmingMilestone(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#151D2B]"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  milestoneStatusMutation.mutate({
                    id: confirmingMilestone.id,
                    status: 'COMPLETED',
                  })
                }
                disabled={milestoneStatusMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] text-xs font-bold disabled:opacity-50"
              >
                {milestoneStatusMutation.isPending ? 'Confirming...' : 'Mark as Achieved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD STAGE MODAL */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#253044] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E293B]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Add Stage to Roadmap</h3>
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC]"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Stage Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Graph Algorithms"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#253044] bg-white dark:bg-[#151D2B] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] dark:focus:ring-[#34A854] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="What must be achieved to complete this milestone?"
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#253044] bg-white dark:bg-[#151D2B] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] dark:focus:ring-[#34A854] focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E293B]">
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#151D2B]"
              >
                Cancel
              </button>
              <button
                onClick={() => addMilestoneMutation.mutate({ title: newMilestoneTitle, description: newMilestoneDesc })}
                disabled={!newMilestoneTitle.trim() || addMilestoneMutation.isPending}
                className="px-4 py-2 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] dark:bg-[#34A854] dark:hover:bg-[#2A8A44] text-white dark:text-[#0B0F17] text-xs font-semibold disabled:opacity-50"
              >
                Save Stage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
