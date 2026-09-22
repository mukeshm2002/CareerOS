import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { planningService } from '../features/planning/services/planningService';
import { PageHeader } from '../components/common/PageHeader';
import {
  Milestone,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
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
  const inProgressMilestone = milestones.find((m) => m.status === 'IN_PROGRESS');
  const firstNotStartedMilestone = milestones.find((m) => m.status === 'NOT_STARTED');
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED');
  const activeMilestones = milestones.filter((m) => m.status !== 'SKIPPED');
  const allCompleted = milestones.length > 0 && completedMilestones.length === activeMilestones.length;

  return (
    <div className="max-w-5xl mx-auto space-y-7 pb-20 relative">
      {/* High-end ambient atmospheric backlight */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-[#A3E635]/[0.035] dark:bg-[#A3E635]/[0.05] blur-[150px] rounded-full pointer-events-none -z-10" />

      {/* 1. Page Header & Goal Selector */}
      <PageHeader
        icon={Milestone}
        title="Roadmap"
        subtitle="Your path from goal to achievement."
        action={
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#8EA296] shrink-0 hidden sm:inline">
              Goal:
            </span>
            <div className="relative">
              <select
                value={selectedGoalId || ''}
                onChange={(e) => handleGoalChange(e.target.value)}
                className="appearance-none bg-white dark:bg-[#121A15] border border-slate-200/90 dark:border-[#23352A] text-slate-900 dark:text-[#F8FAFC] text-xs font-bold py-2 pl-3.5 pr-8 rounded-full shadow-xs focus:ring-2 focus:ring-[#A3E635] focus:outline-hidden cursor-pointer"
              >
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.type?.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-3 text-slate-400 dark:text-[#64748B] pointer-events-none" />
            </div>
          </div>
        }
      />

      {/* 2. PREMIUM GOAL JOURNEY HERO (Electric-Green + Obsidian Luxury) */}
      {roadmap && (
        <div className="bg-gradient-to-br from-[#121A15] via-[#0E1511] to-[#080D0A] text-white border border-[#A3E635]/25 rounded-3xl p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(163,230,53,0.18),0_20px_50px_rgba(0,0,0,0.45)] relative overflow-hidden space-y-5">
          {/* Subtle luminous ambient aura */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#A3E635]/[0.08] blur-[120px] rounded-full pointer-events-none" />

          {/* Top Row: Goal Title & Big Intentional Progress */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5 relative z-10">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A3E635] bg-[#A3E635]/12 px-3 py-1 rounded-full border border-[#A3E635]/30">
                  {currentGoal?.type?.replace(/_/g, ' ') || 'GROWTH GOAL'}
                </span>
                {allCompleted && (
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A3E635] bg-[#A3E635]/20 px-3 py-1 rounded-full border border-[#A3E635]/40">
                    GOAL ACHIEVED 🏆
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                {currentGoal?.title}
              </h2>

              <p className="text-xs sm:text-sm text-[#8EA296] font-medium">
                {completedMilestones.length} of {activeMilestones.length} milestones achieved
              </p>
            </div>

            {/* Giant Intentional Progress Percentage */}
            <div className="text-left sm:text-right shrink-0">
              <div className="text-5xl sm:text-6xl font-black text-[#A3E635] tracking-tight leading-none drop-shadow-[0_0_24px_rgba(163,230,53,0.4)]">
                {roadmap.progress}%
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1 block">
                Overall Journey
              </span>
            </div>
          </div>

          {/* Electric Green Progress Filament with Glowing Edge */}
          <div className="w-full bg-[#17231C] h-2.5 rounded-full overflow-hidden p-[1px] relative z-10">
            <div
              className="bg-gradient-to-r from-[#22C55E] via-[#84CC16] to-[#A3E635] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_14px_rgba(163,230,53,0.7)]"
              style={{ width: `${roadmap.progress || 0}%` }}
            />
          </div>

          {/* Contextual Focus Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1C2C22] text-xs relative z-10">
            <div className="flex items-center gap-2 min-w-0">
              {inProgressMilestone ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#A3E635] shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635] shadow-[0_0_10px_#A3E635] animate-pulse" />
                    Current Stage:
                  </span>
                  <span className="font-bold text-white truncate text-xs sm:text-sm">
                    {inProgressMilestone.title}
                  </span>
                </>
              ) : allCompleted ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A3E635]">
                  <Check size={14} strokeWidth={3} />
                  Destination reached. All milestones earned.
                </span>
              ) : firstNotStartedMilestone ? (
                <>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                    Up Next:
                  </span>
                  <span className="font-bold text-slate-200 truncate text-xs sm:text-sm">
                    {firstNotStartedMilestone.title}
                  </span>
                </>
              ) : null}
            </div>

            {currentGoal?.targetDate && (
              <div className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1.5 self-start sm:self-center">
                <Calendar size={12} className="text-[#A3E635]" />
                Target · {new Date(currentGoal.targetDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. SIGNATURE JOURNEY EXPERIENCE */}
      {roadmap ? (
        <div className="space-y-4">
          {/* Journey Section Bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-[#A3E635]" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 dark:text-[#8EA296]">
                Journey Milestones ({milestones.length})
              </h3>
            </div>

            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-[#121A15] dark:hover:bg-[#19251E] border border-slate-200/90 dark:border-[#23352A] text-slate-800 dark:text-[#F8FAFC] text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Stage</span>
            </button>
          </div>

          {/* Continuous Journey Rail Container */}
          <div className="relative pl-6 sm:pl-9 pr-1 py-1">
            {/* START Marker (Clean, Minimal, Confident) */}
            <div className="flex items-center gap-3 pb-6">
              <div className="w-7 h-7 rounded-full bg-[#121A15] border border-[#A3E635]/30 flex items-center justify-center shrink-0 -ml-3.5 z-10 shadow-xs">
                <div className="w-2 h-2 rounded-full bg-[#A3E635] shadow-[0_0_6px_#A3E635]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#8EA296]">
                START
              </span>
            </div>

            {/* Vertical Milestones */}
            <div className="relative space-y-6">
              {milestones.map((stage, idx) => {
                const isExpanded = expandedMilestoneId === stage.id;
                const isCompleted = stage.status === 'COMPLETED';
                const isInProgress = stage.status === 'IN_PROGRESS';
                const isBlocked = stage.status === 'BLOCKED';
                const isSkipped = stage.status === 'SKIPPED';
                const isNotStarted = stage.status === 'NOT_STARTED';

                const tasks = stage.tasks || [];
                const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
                const nextPendingTask = tasks.find((t) => t.status !== 'COMPLETED');
                const allTasksDone = tasks.length > 0 && completedTasks.length === tasks.length;
                const taskExecutionPercent = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

                const isMenuOpen = activeMenuId === stage.id;

                return (
                  <div key={stage.id} className="relative flex items-start gap-4 sm:gap-5">
                    {/* The Living Connector Spine */}
                    <div
                      className={`absolute -left-3.5 top-8 -bottom-7 w-[2px] z-0 transition-colors ${
                        isCompleted
                          ? 'bg-gradient-to-b from-[#22C55E] to-[#A3E635] shadow-[0_0_6px_rgba(163,230,53,0.3)]'
                          : isInProgress
                          ? 'bg-gradient-to-b from-[#A3E635] to-slate-200 dark:to-[#23352A]'
                          : 'bg-slate-200/90 dark:bg-[#23352A]'
                      }`}
                    />

                    {/* Node Glyphs (Sequence communicates position without repeating #01) */}
                    <div className="relative z-10 shrink-0 -ml-3.5 mt-0.5">
                      {isCompleted ? (
                        /* Quiet Earned Milestone Node */
                        <div
                          title="Stage Achieved"
                          className="h-7 w-7 rounded-full bg-[#121A15] border-2 border-[#A3E635]/80 text-[#A3E635] flex items-center justify-center font-bold text-xs shadow-xs"
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      ) : isInProgress ? (
                        /* THE 10% ENERGY MOMENT: Electric-Green Beacon Node (Inspired by Reference Center Button) */
                        <div
                          title="Current Active Stage"
                          className="h-10 w-10 rounded-full bg-[#A3E635] text-[#0A0F0C] flex items-center justify-center font-black text-xs shadow-[0_0_24px_rgba(163,230,53,0.55)] ring-4 ring-[#A3E635]/25 -ml-1.5"
                        >
                          <PlayCircle size={18} strokeWidth={2.5} />
                        </div>
                      ) : isBlocked ? (
                        /* Blocked Node */
                        <div
                          title="Stage Blocked"
                          className="h-7 w-7 rounded-full bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs"
                        >
                          <span className="font-bold text-xs">!</span>
                        </div>
                      ) : isSkipped ? (
                        /* Skipped Node */
                        <div
                          title="Stage Skipped"
                          className="h-7 w-7 rounded-full bg-slate-100 dark:bg-[#16201B] border-2 border-slate-300 dark:border-slate-700 text-slate-400 flex items-center justify-center font-bold text-xs"
                        >
                          <FastForward size={12} />
                        </div>
                      ) : (
                        /* Clean Upcoming Neutral Ring with Sequence */
                        <div
                          title="Upcoming Stage"
                          className="h-7 w-7 rounded-full bg-white dark:bg-[#121A15] border-2 border-slate-300 dark:border-[#23352A] text-slate-500 dark:text-[#8EA296] flex items-center justify-center font-bold text-[11px]"
                        >
                          {stage.sequence}
                        </div>
                      )}
                    </div>

                    {/* Milestone Card Surface (Use Depth, Not Card Borders Everywhere!) */}
                    <div
                      className={`flex-1 rounded-3xl transition-all ${
                        isInProgress
                          ? 'bg-white dark:bg-gradient-to-br dark:from-[#141E18] dark:to-[#0D1410] border border-[#A3E635]/35 shadow-[0_12px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(163,230,53,0.2)] dark:shadow-[inset_0_1px_0_rgba(163,230,53,0.18),0_16px_45px_rgba(0,0,0,0.5)] p-5 sm:p-6 space-y-4'
                          : isCompleted
                          ? 'bg-slate-50/70 dark:bg-[#0A0F0C]/70 border border-slate-200/50 dark:border-[#16221A] p-3.5 sm:p-4 space-y-1.5'
                          : 'bg-white dark:bg-[#0E1511] hover:bg-slate-50/70 dark:hover:bg-[#121B15] border border-slate-200/70 dark:border-[#1B2920] p-4 sm:p-4.5 space-y-2'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Truthful Semantic Status Badge */}
                            {isCompleted ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-[#A3E635] bg-emerald-50 dark:bg-[#A3E635]/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-[#A3E635]/25">
                                Achieved
                              </span>
                            ) : isInProgress ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-[#0A0F0C] bg-[#A3E635] px-3 py-0.5 rounded-full shadow-xs">
                                Current Stage
                              </span>
                            ) : isBlocked ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/40">
                                Blocked
                              </span>
                            ) : isSkipped ? (
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#8EA296] bg-slate-100 dark:bg-[#16201B] px-2.5 py-0.5 rounded-full">
                                Skipped
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-[#8EA296] bg-slate-100 dark:bg-[#16201B] px-2.5 py-0.5 rounded-full">
                                {stage.id === firstNotStartedMilestone?.id ? 'Up Next' : 'Upcoming'}
                              </span>
                            )}
                          </div>

                          <h4
                            onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                            className={`font-black cursor-pointer transition-colors ${
                              isInProgress
                                ? 'text-xl sm:text-2xl text-slate-900 dark:text-white mt-1'
                                : isCompleted
                                ? 'text-sm text-slate-500 dark:text-[#7A8F83] line-through'
                                : 'text-sm sm:text-base text-slate-800 dark:text-[#E2E8F0] hover:text-[#A3E635]'
                            }`}
                          >
                            {stage.title}
                          </h4>

                          {stage.description && !isCompleted && (
                            <p className="text-xs text-slate-500 dark:text-[#8EA296] leading-relaxed pt-0.5">
                              {stage.description}
                            </p>
                          )}
                        </div>

                        {/* Overflow Actions Trigger (•••) */}
                        <div className="relative shrink-0" ref={isMenuOpen ? menuRef : null}>
                          <button
                            onClick={() => setActiveMenuId(isMenuOpen ? null : stage.id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#1C2C22] transition-colors cursor-pointer"
                            title="More options"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {/* Contextual Overflow Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-8 z-30 w-48 bg-white dark:bg-[#121A15] rounded-2xl border border-slate-200 dark:border-[#23352A] shadow-2xl py-1.5 text-xs">
                              {/* Add Task */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setAddingTaskMilestoneId(stage.id);
                                  setExpandedMilestoneId(stage.id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1C2C22] flex items-center gap-2"
                              >
                                <Plus size={13} />
                                <span>Add Task</span>
                              </button>

                              {/* Mark Stage Achieved (if not completed) */}
                              {!isCompleted && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    setConfirmingMilestone(stage);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-[#A3E635] hover:bg-emerald-50 dark:hover:bg-[#A3E635]/10 flex items-center gap-2 font-bold"
                                >
                                  <Check size={13} strokeWidth={2.5} />
                                  <span>Mark Stage Achieved</span>
                                </button>
                              )}

                              {/* Start Stage */}
                              {isNotStarted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3.5 py-2 text-[#A3E635] hover:bg-slate-100 dark:hover:bg-[#1C2C22] flex items-center gap-2 font-bold"
                                >
                                  <PlayCircle size={13} />
                                  <span>Start Stage</span>
                                </button>
                              )}

                              {/* Reopen Stage */}
                              {isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1C2C22] flex items-center gap-2"
                                >
                                  <RotateCcw size={13} />
                                  <span>Reopen Stage</span>
                                </button>
                              )}

                              {/* Block Stage */}
                              {!isBlocked && !isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'BLOCKED' })}
                                  className="w-full text-left px-3.5 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                                >
                                  <Ban size={13} />
                                  <span>Block Stage</span>
                                </button>
                              )}

                              {/* Unblock Stage */}
                              {isBlocked && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                                  className="w-full text-left px-3.5 py-2 text-[#A3E635] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 font-bold"
                                >
                                  <PlayCircle size={13} />
                                  <span>Resume Stage</span>
                                </button>
                              )}

                              {/* Skip Stage */}
                              {!isSkipped && !isCompleted && (
                                <button
                                  onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'SKIPPED' })}
                                  className="w-full text-left px-3.5 py-2 text-slate-600 dark:text-[#8EA296] hover:bg-slate-100 dark:hover:bg-[#1C2C22] flex items-center gap-2"
                                >
                                  <FastForward size={13} />
                                  <span>Skip Stage</span>
                                </button>
                              )}

                              <div className="border-t border-slate-100 dark:border-[#23352A] my-1" />

                              {/* Move Up / Down */}
                              <button
                                onClick={() => handleMoveMilestone(idx, 'up')}
                                disabled={idx === 0}
                                className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1C2C22] disabled:opacity-30 flex items-center gap-2"
                              >
                                <ArrowUp size={13} />
                                <span>Move Up</span>
                              </button>

                              <button
                                onClick={() => handleMoveMilestone(idx, 'down')}
                                disabled={idx === milestones.length - 1}
                                className="w-full text-left px-3.5 py-2 text-slate-700 dark:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[#1C2C22] disabled:opacity-30 flex items-center gap-2"
                              >
                                <ArrowDown size={13} />
                                <span>Move Down</span>
                              </button>

                              <div className="border-t border-slate-100 dark:border-[#23352A] my-1" />

                              {/* Delete Stage */}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (window.confirm(`Delete milestone "${stage.title}"?`)) {
                                    deleteMilestoneMutation.mutate(stage.id);
                                  }
                                }}
                                className="w-full text-left px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                              >
                                <Trash2 size={13} />
                                <span>Delete Stage</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* CURRENT STAGE (10% ENERGY MOMENT): Execution Progress + Meaningful Next Action */}
                      {isInProgress && (
                        <div className="space-y-4 pt-1">
                          {/* Milestone Execution Progress Track */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-[#8EA296] font-semibold">
                                {completedTasks.length} of {tasks.length} actions complete
                              </span>
                              <span className="font-extrabold text-[#A3E635]">
                                {taskExecutionPercent}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-[#17231C] h-2 rounded-full overflow-hidden p-[1px]">
                              <div
                                className="bg-gradient-to-r from-[#22C55E] to-[#A3E635] h-full rounded-full transition-all duration-400 shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                                style={{ width: `${taskExecutionPercent}%` }}
                              />
                            </div>
                          </div>

                          {/* 100% Tasks Done -> Earned Milestone Outcome Confirmation */}
                          {allTasksDone ? (
                            <div className="p-4 bg-[#A3E635]/10 rounded-2xl border border-[#A3E635]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-[#A3E635] text-[#0A0F0C] flex items-center justify-center shrink-0 shadow-sm">
                                  <Check size={16} strokeWidth={3} />
                                </div>
                                <div>
                                  <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                                    All planned tasks completed!
                                  </span>
                                  <span className="text-[11px] text-[#A3E635] font-semibold">
                                    Ready to confirm that you achieved this milestone outcome?
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => setConfirmingMilestone(stage)}
                                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] text-xs font-black shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all shrink-0 cursor-pointer"
                              >
                                <Check size={14} strokeWidth={3} />
                                <span>Mark Stage Achieved</span>
                              </button>
                            </div>
                          ) : nextPendingTask ? (
                            /* Contextual Immediate Next Action Surface (Typography, Spacing, Subtle Arrow) */
                            <div className="group p-4 bg-slate-50 dark:bg-black/35 hover:bg-slate-100/80 dark:hover:bg-black/50 rounded-2xl border border-slate-200/80 dark:border-[#A3E635]/20 flex items-center justify-between gap-4 transition-all">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#A3E635] shrink-0 shadow-[0_0_10px_#A3E635]" />
                                <div className="min-w-0">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-[#A3E635] block">
                                    UP NEXT
                                  </span>
                                  <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                                    {nextPendingTask.title}
                                  </p>
                                  <span className="text-[11px] text-slate-400 dark:text-[#8EA296] font-medium">
                                    {nextPendingTask.estimatedMinutes || 30} min · Task
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => toggleTaskMutation.mutate({ taskId: nextPendingTask.id, status: 'COMPLETED' })}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] font-black text-xs shadow-[0_0_16px_rgba(163,230,53,0.35)] transition-transform group-hover:translate-x-0.5 shrink-0 cursor-pointer"
                              >
                                <Check size={13} strokeWidth={3} />
                                <span>Complete</span>
                                <ArrowRight size={13} />
                              </button>
                            </div>
                          ) : (
                            /* No tasks yet */
                            <div className="p-3 bg-slate-50 dark:bg-[#16201B]/50 rounded-2xl border border-slate-200/60 dark:border-[#23352A] flex items-center justify-between text-xs">
                              <span className="text-slate-500 dark:text-[#8EA296]">No pending tasks in this stage.</span>
                              <button
                                onClick={() => {
                                  setAddingTaskMilestoneId(stage.id);
                                  setExpandedMilestoneId(stage.id);
                                }}
                                className="font-extrabold text-[#A3E635] hover:underline cursor-pointer"
                              >
                                + Add Task
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Footer Actions & Progress Indicator */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-100 dark:border-[#1C2C22]">
                        {/* Left: Task count pill & target date */}
                        <div className="flex items-center gap-3 text-slate-500 dark:text-[#8EA296] text-[11px]">
                          <button
                            onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                            className="font-semibold text-slate-600 dark:text-[#CBD5E1] hover:text-[#A3E635] flex items-center gap-1.5 cursor-pointer"
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
                            <span className="flex items-center gap-1 font-medium">
                              <Clock size={11} />
                              Target · {new Date(stage.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Right: Primary Action Button */}
                        <div className="flex items-center gap-2">
                          {isNotStarted && (
                            <button
                              onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                              className="px-4 py-1.5 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] font-black text-xs shadow-xs transition-colors cursor-pointer"
                            >
                              Start Stage
                            </button>
                          )}

                          {isInProgress && (
                            <button
                              onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                              className="px-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#1E2E24] dark:hover:bg-[#263C2E] text-slate-800 dark:text-[#F8FAFC] font-bold text-xs transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Hide Tasks' : 'View Tasks'}
                            </button>
                          )}

                          {isBlocked && (
                            <button
                              onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                              className="px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                            >
                              Resume Stage
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Quick Add Task Row */}
                      {addingTaskMilestoneId === stage.id && (
                        <div className="p-3.5 bg-slate-50 dark:bg-[#16201B] rounded-2xl border border-slate-200 dark:border-[#23352A] space-y-2 text-xs mt-2">
                          <div className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                            Add Task to {stage.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="What action needs to be completed?"
                              value={taskTitle}
                              onChange={(e) => setTaskTitle(e.target.value)}
                              className="flex-1 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-[#23352A] bg-white dark:bg-[#0E1511] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#A3E635] focus:outline-hidden"
                            />
                            <input
                              type="number"
                              placeholder="Mins"
                              value={taskEst}
                              onChange={(e) => setTaskEst(e.target.value)}
                              className="w-16 px-2 py-1.5 rounded-full border border-slate-200 dark:border-[#23352A] bg-white dark:bg-[#0E1511] text-slate-900 dark:text-[#F8FAFC] text-xs text-center"
                            />
                            <button
                              onClick={() => addTaskMutation.mutate({ milestoneId: stage.id, title: taskTitle, estimatedMinutes: taskEst })}
                              disabled={!taskTitle.trim() || addTaskMutation.isPending}
                              className="px-4 py-1.5 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] font-black text-xs disabled:opacity-50 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Expanded Tasks Drawer */}
                      {isExpanded && tasks.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1C2C22]">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-[#8EA296]">
                              Stage Tasks ({tasks.length})
                            </h5>
                            <button
                              onClick={() => setAddingTaskMilestoneId(stage.id)}
                              className="text-[11px] font-bold text-[#A3E635] hover:underline cursor-pointer"
                            >
                              + Add Task
                            </button>
                          </div>

                          <div className="space-y-1.5">
                            {tasks.map((t) => (
                              <div
                                key={t.id}
                                className="p-3 rounded-2xl bg-white dark:bg-[#121A15] border border-slate-200/70 dark:border-[#1E2E23] flex items-center justify-between gap-3 text-xs"
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
                                        ? 'bg-[#A3E635] border-[#A3E635] text-[#0A0F0C]'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-[#A3E635]'
                                    }`}
                                  >
                                    {t.status === 'COMPLETED' && <Check size={11} strokeWidth={3} />}
                                  </button>
                                  <span
                                    className={`truncate ${
                                      t.status === 'COMPLETED'
                                        ? 'line-through text-slate-400 dark:text-[#64748B]'
                                        : 'text-slate-800 dark:text-[#F8FAFC] font-semibold'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-[#8EA296] shrink-0">
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

            {/* DESTINATION Marker (Meaningful Horizon Anchor) */}
            <div className="flex items-center gap-3 pt-7">
              <div className="w-8 h-8 rounded-full bg-[#121A15] border border-[#A3E635]/40 flex items-center justify-center shrink-0 -ml-4 z-10 shadow-md">
                <Flag size={14} className={allCompleted ? 'text-[#A3E635]' : 'text-slate-400'} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#A3E635] block">
                  DESTINATION
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
                  {currentGoal?.title} · {currentGoal?.type?.replace(/_/g, ' ')} {allCompleted && '🏆'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 4. Empty State: Inspiring Journey Generator */
        <div className="bg-white dark:bg-[#111A15] rounded-3xl border border-slate-200/80 dark:border-[#23352A] p-8 sm:p-12 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#A3E635]/12 text-[#A3E635] flex items-center justify-center mx-auto border border-[#A3E635]/30">
            <Compass size={28} />
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-[#F8FAFC]">
              Your roadmap starts here.
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#8EA296] leading-relaxed">
              Turn <strong>{currentGoal?.title || 'this goal'}</strong> into a clear path of meaningful stages.
            </p>
          </div>

          {/* Generator Actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => createRoadmapMutation.mutate()}
              disabled={createRoadmapMutation.isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] text-xs font-black shadow-[0_0_20px_rgba(163,230,53,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{createRoadmapMutation.isPending ? 'Generating Roadmap...' : 'Build Roadmap'}</span>
            </button>

            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#17231C] dark:hover:bg-[#203127] text-slate-700 dark:text-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus size={13} />
              <span>Add First Stage Manually</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. CONFIRMATION MODAL: Mark Stage Achieved */}
      {confirmingMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111A15] rounded-3xl border border-slate-200 dark:border-[#23352A] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E2E23]">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                <CheckCircle2 size={16} className="text-[#A3E635]" />
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
                  <div className="p-3.5 bg-slate-50 dark:bg-[#16201B] rounded-2xl border border-slate-200 dark:border-[#23352A] space-y-1">
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

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E2E23]">
              <button
                onClick={() => setConfirmingMilestone(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-[#8EA296] hover:bg-slate-100 dark:hover:bg-[#16201B]"
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
                className="px-5 py-2 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] text-xs font-black shadow-md disabled:opacity-50"
              >
                {milestoneStatusMutation.isPending ? 'Confirming...' : 'Mark as Achieved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD STAGE MODAL */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111A15] rounded-3xl border border-slate-200 dark:border-[#23352A] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1E2E23]">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-[#F8FAFC]">Add Stage to Roadmap</h3>
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
                  className="w-full px-4 py-2 rounded-full border border-slate-200 dark:border-[#23352A] bg-white dark:bg-[#16201B] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#A3E635] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="What must be achieved to complete this milestone?"
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-[#23352A] bg-white dark:bg-[#16201B] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#A3E635] focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#1E2E23]">
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 dark:text-[#8EA296] hover:bg-slate-100 dark:hover:bg-[#16201B]"
              >
                Cancel
              </button>
              <button
                onClick={() => addMilestoneMutation.mutate({ title: newMilestoneTitle, description: newMilestoneDesc })}
                disabled={!newMilestoneTitle.trim() || addMilestoneMutation.isPending}
                className="px-5 py-2 rounded-full bg-[#A3E635] hover:bg-[#84CC16] text-[#0A0F0C] text-xs font-black disabled:opacity-50"
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
