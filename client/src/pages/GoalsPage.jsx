import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { PageHeader } from '../components/common/PageHeader';
import { CreateGoalModal } from '../components/goals/CreateGoalModal';
import {
  Target,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  PauseCircle,
  PlayCircle,
  Archive,
  AlertCircle,
  Search,
  Filter,
  Milestone,
  ListTodo,
  TrendingUp,
  RotateCw,
  Sliders,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'PLANNED', label: 'Planned' },
  { id: 'PAUSED', label: 'Paused' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

const AREA_FILTERS = [
  { id: 'ALL', label: 'All Areas' },
  { id: 'CAREER', label: 'Career' },
  { id: 'EDUCATION', label: 'Education' },
  { id: 'SKILLS', label: 'Skills' },
  { id: 'LEARNING', label: 'Learning' },
  { id: 'COMMUNICATION', label: 'Communication' },
  { id: 'HEALTH_AND_FITNESS', label: 'Health & Fitness' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'PERSONAL_GROWTH', label: 'Personal Growth' },
  { id: 'RELATIONSHIPS', label: 'Relationships' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'CREATIVE', label: 'Creative' },
  { id: 'LIFESTYLE', label: 'Lifestyle' },
  { id: 'OTHER', label: 'Other' },
];

export const GoalsPage = () => {
  const [activeStatusTab, setActiveStatusTab] = useState('ACTIVE');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTracking, setSelectedTracking] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['goals', activeStatusTab, selectedArea, selectedPriority, selectedTracking, searchQuery],
    queryFn: () =>
      goalService.getGoals(activeStatusTab, selectedArea, {
        priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
        trackingMethod: selectedTracking !== 'ALL' ? selectedTracking : undefined,
        search: searchQuery.trim() || undefined,
      }),
  });

  const goals = data?.data?.goals || [];
  const metrics = data?.data?.metrics || {
    active: 0,
    dueSoon: 0,
    needsAttention: 0,
    completed: 0,
  };

  const handleGoalCreated = async (payload) => {
    const result = await goalService.createGoal(payload);
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    return result;
  };

  const statusMutation = useMutation({
    mutationFn: ({ goalId, status }) => goalService.updateGoalStatus(goalId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleStatusChange = (goalId, newStatus) => {
    statusMutation.mutate({ goalId, status: newStatus });
  };

  const getAreaLabel = (goal) => {
    if (goal.area === 'OTHER' && goal.customArea) return goal.customArea;
    const item = AREA_FILTERS.find((a) => a.id === goal.area || a.id === goal.growthArea);
    return item ? item.label : goal.area || goal.growthArea || 'General';
  };

  const getTrackingInfo = (goal) => {
    switch (goal.trackingMethod) {
      case 'NUMBER_TARGET':
        return `${goal.unit === '₹' || goal.unit === '$' ? goal.unit : ''}${goal.currentValue ?? goal.startValue ?? 0} / ${goal.unit === '₹' || goal.unit === '$' ? goal.unit : ''}${goal.targetValue || 0} ${goal.unit !== '₹' && goal.unit !== '$' ? goal.unit || '' : ''}`;
      case 'ROUTINE':
        return `${goal.routineFrequency || 1}x / ${goal.routinePeriod?.toLowerCase() || 'week'}`;
      case 'TASKS': {
        const count = goal._count?.tasks || 0;
        return `${count} linked task${count === 1 ? '' : 's'}`;
      }
      case 'MILESTONES': {
        const criteriaCount = goal.successCriteria?.length || 0;
        if (criteriaCount > 0) {
          const done = goal.successCriteria.filter((c) => c.isCompleted).length;
          return `${done} of ${criteriaCount} criteria met`;
        }
        return 'Milestone Roadmap';
      }
      case 'MANUAL':
      default:
        return 'Manual Progress';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={Target}
        title="Goals"
        subtitle="Turn what matters to you into clear, achievable progress."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Goal</span>
          </button>
        }
      />

      {/* Goal Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-[#94A3B8] uppercase tracking-wider">
            Active
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
            {metrics.active}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Clock size={12} />
            <span>Due Soon</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
            {metrics.dueSoon}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
            <AlertTriangle size={12} />
            <span>Needs Attention</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
            {metrics.needsAttention}
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#2A7A3B] dark:text-[#4ADE80] uppercase tracking-wider">
            <CheckCircle2 size={12} />
            <span>Completed</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">
            {metrics.completed}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Status Lifecycle Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#263247] overflow-x-auto pb-1 text-xs">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80] font-bold'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#161E2D]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
            />
          </div>

          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-700 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
          >
            {AREA_FILTERS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-700 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={selectedTracking}
            onChange={(e) => setSelectedTracking(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-700 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
          >
            <option value="ALL">All Tracking</option>
            <option value="MILESTONES">Milestones</option>
            <option value="TASKS">Tasks</option>
            <option value="NUMBER_TARGET">Number / Target</option>
            <option value="ROUTINE">Routine</option>
            <option value="MANUAL">Manual</option>
          </select>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-12 flex justify-center items-center">
          <div className="h-7 w-7 border-3 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error?.response?.data?.message || 'Failed to load goals from database.'}</span>
        </div>
      )}

      {/* Clean Empty State */}
      {!isLoading && !isError && goals.length === 0 && (
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-[#161E2D] text-slate-400 mb-3">
            <Target size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Goals</h3>
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 mb-5">
            Set a goal for something that matters to you and turn it into actionable progress.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Create your first goal</span>
          </button>
        </div>
      )}

      {/* Goal Cards Grid */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const formattedTarget = goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'No deadline';

            const nextTask = goal.tasks?.[0];

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/60 dark:border-[#263247]">
                        {getAreaLabel(goal)}
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
                      <span className="text-[10px] font-medium text-slate-400">
                        {goal.status}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-[#2A7A3B] dark:text-[#4ADE80]">
                      {goal.progress || 0}%
                    </span>
                  </div>

                  {/* Title & Desired Outcome */}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] mb-1">
                    {goal.title}
                  </h3>
                  {goal.desiredOutcome && (
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 mb-3">
                      {goal.desiredOutcome}
                    </p>
                  )}

                  {/* Tracking & Target Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8] mb-2.5">
                    <span className="font-medium text-slate-700 dark:text-[#CBD5E1]">
                      {getTrackingInfo(goal)}
                    </span>
                    <span>Target: {formattedTarget}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-[#161E2D] h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-[#2A7A3B] dark:bg-[#4ADE80] h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>

                  {/* Next relevant action */}
                  {nextTask && (
                    <div className="p-2.5 bg-slate-50 dark:bg-[#161E2D] rounded-xl border border-slate-200/60 dark:border-[#263247] text-xs mb-3">
                      <span className="text-slate-400 font-medium">Next: </span>
                      <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                        {nextTask.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#263247]">
                  <div className="flex items-center gap-1">
                    {goal.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'PAUSED')}
                        title="Pause Goal"
                        className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <PauseCircle size={15} />
                      </button>
                    )}

                    {goal.status === 'PAUSED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'ACTIVE')}
                        title="Resume Goal"
                        className="p-1.5 text-slate-400 hover:text-[#2A7A3B] rounded-lg transition-colors cursor-pointer"
                      >
                        <PlayCircle size={15} />
                      </button>
                    )}

                    {goal.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'COMPLETED')}
                        title="Mark Completed"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    )}

                    {goal.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'ARCHIVED')}
                        title="Archive Goal"
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
                      >
                        <Archive size={15} />
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline"
                  >
                    <span>Open</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialArea={selectedArea === 'ALL' ? 'CAREER' : selectedArea}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
};
