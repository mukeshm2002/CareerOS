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
  MoreHorizontal,
  Clock,
  AlertTriangle,
  RotateCcw,
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
  const [openCardMenuId, setOpenCardMenuId] = useState(null);

  const queryClient = useQueryClient();

  const isFiltered =
    activeStatusTab !== 'ACTIVE' ||
    selectedArea !== 'ALL' ||
    selectedPriority !== 'ALL' ||
    selectedTracking !== 'ALL' ||
    Boolean(searchQuery.trim());

  const handleClearFilters = () => {
    setActiveStatusTab('ACTIVE');
    setSelectedArea('ALL');
    setSelectedPriority('ALL');
    setSelectedTracking('ALL');
    setSearchQuery('');
  };

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
      setOpenCardMenuId(null);
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

  const getTrackingDetail = (goal) => {
    switch (goal.trackingMethod) {
      case 'NUMBER_TARGET': {
        const prefix = goal.unit === '₹' || goal.unit === '$' ? goal.unit : '';
        const suffix = goal.unit !== '₹' && goal.unit !== '$' ? ` ${goal.unit || ''}` : '';
        return `${prefix}${goal.currentValue ?? goal.startValue ?? 0} / ${prefix}${goal.targetValue || 0}${suffix}`;
      }
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
        const mCount = goal._count?.roadmaps || 0;
        return mCount > 0 ? 'Milestones linked' : 'Milestones';
      }
      case 'MANUAL':
      default:
        return `${goal.progress || 0}% progress`;
    }
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12" onClick={() => setOpenCardMenuId(null)}>
      {/* 1. CLEAN HEADER */}
      <PageHeader
        icon={Target}
        title="Goals"
        subtitle="Turn what matters to you into clear, achievable progress."
        action={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Goal</span>
          </button>
        }
      />

      {/* 2. COMPACT SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="px-4 py-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium">Active</span>
          <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.active}</span>
        </div>

        <div className="px-4 py-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
            <Clock size={13} className="text-amber-500" />
            <span>Due Soon</span>
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.dueSoon}</span>
        </div>

        <div className="px-4 py-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
            <AlertTriangle size={13} className="text-rose-500" />
            <span>Needs Attention</span>
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.needsAttention}</span>
        </div>

        <div className="px-4 py-3 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8] font-medium">
            <CheckCircle2 size={13} className="text-[#2A7A3B]" />
            <span>Completed</span>
          </div>
          <span className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.completed}</span>
        </div>
      </div>

      {/* 3. STATUS NAVIGATION TABS & COMPACT FILTERS */}
      <div className="space-y-2.5">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#263247] overflow-x-auto pb-1 text-xs">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all cursor-pointer ${
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

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#2A7A3B]"
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
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={selectedTracking}
            onChange={(e) => setSelectedTracking(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-700 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
          >
            <option value="ALL">All Tracking</option>
            <option value="MILESTONES">Milestones</option>
            <option value="TASKS">Tasks</option>
            <option value="NUMBER_TARGET">Target</option>
            <option value="ROUTINE">Routine</option>
            <option value="MANUAL">Manual</option>
          </select>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-[#F8FAFC] rounded-lg hover:bg-slate-100 dark:hover:bg-[#161E2D] cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. LOADING & ERROR STATES */}
      {isLoading && (
        <div className="py-12 flex justify-center items-center">
          <div className="h-6 w-6 border-2 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error?.response?.data?.message || 'Failed to load goals.'}</span>
        </div>
      )}

      {/* 5. EMPTY STATES */}
      {!isLoading && !isError && goals.length === 0 && (
        <div className="py-16 text-center max-w-sm mx-auto">
          <div className="inline-flex p-2.5 rounded-xl bg-slate-100 dark:bg-[#161E2D] text-slate-400 mb-2.5">
            <Target size={20} />
          </div>
          {isFiltered ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">No goals match these filters</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 mb-4">
                Try loosening your search or filter criteria.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-[#161E2D] hover:bg-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Goals</h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 mb-4">
                Set a goal for something that matters to you and turn it into actionable progress.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Create your first goal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. GOAL CARDS GRID */}
      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {goals.map((goal) => {
            const formattedTarget = goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No deadline';

            const nextTask = goal.tasks?.[0];
            const isMenuOpen = openCardMenuId === goal.id;

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-4.5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Badges & Overflow Menu */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] border border-slate-200/50">
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

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(isMenuOpen ? null : goal.id);
                        }}
                        aria-label="Goal options"
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg cursor-pointer"
                      >
                        <MoreHorizontal size={15} />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div
                          className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-[#263247] shadow-lg py-1 z-20 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {goal.status === 'ACTIVE' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(goal.id, 'PAUSED')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] cursor-pointer"
                            >
                              Pause Goal
                            </button>
                          )}
                          {goal.status === 'PAUSED' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(goal.id, 'ACTIVE')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-[#2A7A3B] cursor-pointer"
                            >
                              Resume Goal
                            </button>
                          )}
                          {goal.status !== 'COMPLETED' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(goal.id, 'COMPLETED')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-emerald-600 cursor-pointer"
                            >
                              Mark Complete
                            </button>
                          )}
                          {goal.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => handleStatusChange(goal.id, 'ARCHIVED')}
                              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-[#161E2D] text-slate-500 cursor-pointer"
                            >
                              Archive Goal
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title & Desired Outcome */}
                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="block font-bold text-slate-900 dark:text-[#F8FAFC] text-sm hover:text-[#2A7A3B] dark:hover:text-[#4ADE80] transition-colors mb-1"
                  >
                    {goal.title}
                  </Link>

                  {goal.desiredOutcome && (
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 mb-2.5 leading-relaxed">
                      {goal.desiredOutcome}
                    </p>
                  )}

                  {/* Progress Bar & Percentage */}
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
                      {getTrackingDetail(goal)}
                    </span>
                    <span className="font-bold text-[#2A7A3B] dark:text-[#4ADE80]">
                      {goal.progress || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-[#161E2D] h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-[#2A7A3B] dark:bg-[#4ADE80] h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>

                  {/* Next Action Snippet */}
                  {nextTask && (
                    <div className="p-2 bg-slate-50 dark:bg-[#161E2D] rounded-xl border border-slate-200/50 dark:border-[#263247] text-[11px] mb-3">
                      <span className="text-slate-400 font-medium">Next: </span>
                      <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                        {nextTask.title}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Target Date + Primary "Continue" */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-[#263247] text-xs">
                  <span className="text-[11px] text-slate-400">
                    Target · {formattedTarget}
                  </span>

                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE GOAL MODAL */}
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialArea={selectedArea === 'ALL' ? 'CAREER' : selectedArea}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
};
