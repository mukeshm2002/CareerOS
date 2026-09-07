import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { planningService } from '../features/planning/services/planningService';
import {
  Milestone,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  ChevronDown,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Ban,
  FastForward,
  Plus,
  Edit2,
  Trash2,
  ChevronUp,
  CheckSquare,
  Sparkles,
  X,
} from 'lucide-react';

export const RoadmapPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [expandedMilestoneId, setExpandedMilestoneId] = useState(null);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [addingTaskMilestoneId, setAddingTaskMilestoneId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskEst, setTaskEst] = useState('45');
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');

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
    },
  });

  const updateMilestoneMutation = useMutation({
    mutationFn: ({ id, data }) => planningService.updateMilestone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
      setEditingMilestone(null);
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

  const reorderMutation = useMutation({
    mutationFn: (orderedMilestoneIds) =>
      planningService.reorderMilestones(roadmap?.id, orderedMilestoneIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', selectedGoalId] });
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
  const currentStage =
    milestones.find((m) => m.status === 'IN_PROGRESS') ||
    milestones.find((m) => m.status === 'NOT_STARTED') ||
    milestones[milestones.length - 1];

  return (
    <div className="space-y-6">
      {/* Header & Goal Selector (Section 8) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Milestone className="text-brand-600" size={22} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">CAREER ROADMAP</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your goals, turned into actionable paths.
          </p>
        </div>

        {/* Goal Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500 shrink-0">Goal:</label>
          <div className="relative">
            <select
              value={selectedGoalId || ''}
              onChange={(e) => handleGoalChange(e.target.value)}
              className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-semibold py-2 pl-3.5 pr-8 rounded-xl shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden cursor-pointer"
            >
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title} ({g.type?.replace('_', ' ')})
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Overview Card (Section 8) */}
      {roadmap && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Current Stage
              </span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {currentStage?.title || 'Roadmap Completed'}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Overall Progress
              </span>
              <div className="text-2xl font-extrabold text-brand-600">
                {roadmap.progress}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${roadmap.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Stepper or Empty State */}
      {roadmap ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Stages ({milestones.length} Milestones)
            </h2>
            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Stage</span>
            </button>
          </div>

          {/* Vertical Stepper (Section 8) */}
          <div className="space-y-6">
            {milestones.map((stage, idx) => {
              const isExpanded = expandedMilestoneId === stage.id;
              const isCurrent = currentStage?.id === stage.id;
              const tasks = stage.tasks || [];

              return (
                <div key={stage.id} className="relative flex items-start gap-4">
                  {/* Connecting Line */}
                  {idx !== milestones.length - 1 && (
                    <div className="absolute left-4 top-9 -bottom-7 w-0.5 bg-slate-200 z-0" />
                  )}

                  {/* Stepper Icon Node */}
                  <div className="relative z-10 shrink-0 mt-0.5">
                    {stage.status === 'COMPLETED' ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <CheckCircle2 size={16} />
                      </div>
                    ) : stage.status === 'IN_PROGRESS' ? (
                      <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-brand-100 shadow-xs animate-pulse">
                        {stage.sequence}
                      </div>
                    ) : stage.status === 'BLOCKED' ? (
                      <div className="h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Ban size={14} />
                      </div>
                    ) : stage.status === 'SKIPPED' ? (
                      <div className="h-8 w-8 rounded-full bg-slate-300 text-slate-600 flex items-center justify-center font-bold text-xs">
                        <FastForward size={14} />
                      </div>
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white border-2 border-slate-300 text-slate-500 flex items-center justify-center font-bold text-xs">
                        {stage.sequence}
                      </div>
                    )}
                  </div>

                  {/* Stage Card */}
                  <div className="flex-1 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 p-4.5 transition-all space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">
                            #{String(stage.sequence).padStart(2, '0')}
                          </span>
                          <h3
                            onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                            className={`text-sm font-bold cursor-pointer hover:text-brand-600 transition-colors ${
                              stage.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {stage.title}
                          </h3>
                        </div>
                        {stage.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {stage.description}
                          </p>
                        )}
                      </div>

                      {/* Status Badges & Quick Toggle Menu */}
                      <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            stage.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : stage.status === 'IN_PROGRESS'
                              ? 'bg-brand-50 text-brand-700 border-brand-200'
                              : stage.status === 'BLOCKED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : stage.status === 'SKIPPED'
                              ? 'bg-slate-100 text-slate-500 border-slate-200'
                              : 'bg-white text-slate-600 border-slate-200'
                          }`}
                        >
                          {stage.status.replace('_', ' ')}
                        </span>

                        {/* Reorder Arrows */}
                        <div className="flex flex-col ml-1">
                          <button
                            onClick={() => handleMoveMilestone(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => handleMoveMilestone(idx, 'down')}
                            disabled={idx === milestones.length - 1}
                            className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200/50">
                      <div className="flex items-center gap-3 text-slate-500 text-[11px]">
                        <button
                          onClick={() => setExpandedMilestoneId(isExpanded ? null : stage.id)}
                          className="font-semibold text-brand-600 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <CheckSquare size={13} />
                          <span>{tasks.length} Tasks ({tasks.filter((t) => t.status === 'COMPLETED').length} done)</span>
                        </button>
                        {stage.targetDate && (
                          <span>Target: {new Date(stage.targetDate).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* State Transition Actions */}
                      <div className="flex items-center gap-1.5">
                        {stage.status !== 'IN_PROGRESS' && stage.status !== 'COMPLETED' && (
                          <button
                            onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'IN_PROGRESS' })}
                            className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Start
                          </button>
                        )}
                        {stage.status !== 'COMPLETED' && (
                          <button
                            onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'COMPLETED' })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Complete
                          </button>
                        )}
                        {stage.status !== 'BLOCKED' && stage.status !== 'COMPLETED' && (
                          <button
                            onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'BLOCKED' })}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                        {stage.status !== 'SKIPPED' && stage.status !== 'COMPLETED' && (
                          <button
                            onClick={() => milestoneStatusMutation.mutate({ id: stage.id, status: 'SKIPPED' })}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold text-[11px] transition-colors cursor-pointer"
                          >
                            Skip
                          </button>
                        )}
                        <button
                          onClick={() => setAddingTaskMilestoneId(addingTaskMilestoneId === stage.id ? null : stage.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                        >
                          + Task
                        </button>
                        <button
                          onClick={() => deleteMilestoneMutation.mutate(stage.id)}
                          className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Quick Add Task Row */}
                    {addingTaskMilestoneId === stage.id && (
                      <div className="p-3 bg-white rounded-xl border border-brand-200 space-y-2 text-xs">
                        <div className="font-bold text-slate-800">Add Task to {stage.title}</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="What action needs to be completed?"
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                          />
                          <input
                            type="number"
                            placeholder="Est mins"
                            value={taskEst}
                            onChange={(e) => setTaskEst(e.target.value)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-center"
                          />
                          <button
                            onClick={() => addTaskMutation.mutate({ milestoneId: stage.id, title: taskTitle, estimatedMinutes: taskEst })}
                            disabled={!taskTitle.trim() || addTaskMutation.isPending}
                            className="px-3 py-1.5 rounded-lg bg-brand-600 text-white font-semibold text-xs disabled:opacity-50 cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Tasks List */}
                    {isExpanded && tasks.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/50">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Milestone Tasks
                        </h4>
                        <div className="space-y-1.5">
                          {tasks.map((t) => (
                            <div
                              key={t.id}
                              className="p-2 rounded-lg bg-white border border-slate-200/70 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className={t.status === 'COMPLETED' ? 'text-emerald-500' : 'text-slate-300'}>
                                  ●
                                </span>
                                <span className={t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800 font-medium'}>
                                  {t.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{t.estimatedMinutes}m</span>
                                <span className="uppercase px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-600">
                                  {t.status}
                                </span>
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
        </div>
      ) : (
        /* Empty State: No Roadmap (Section 32) */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <Milestone size={28} />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Turn your goal into a step-by-step path.
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              No roadmap created yet for <strong>{currentGoal?.title || 'this goal'}</strong>. Generate an explainable, 10-stage execution template or build your stages manually.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => createRoadmapMutation.mutate()}
              disabled={createRoadmapMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-600/30 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={16} />
              <span>{createRoadmapMutation.isPending ? 'Generating Roadmap...' : 'Generate Roadmap'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ADD MILESTONE MODAL */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Stage to Roadmap</h3>
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Stage Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master Graph Algorithms"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="What must be achieved to complete this milestone?"
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={() => addMilestoneMutation.mutate({ title: newMilestoneTitle, description: newMilestoneDesc })}
                disabled={!newMilestoneTitle.trim() || addMilestoneMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50"
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
