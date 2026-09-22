import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { PageHeader } from '../components/common/PageHeader';
import { CreateGoalModal } from '../components/goals/CreateGoalModal';
import {
  Target,
  Plus,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  MoreHorizontal,
  AlertCircle,
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

const TRACKING_LABELS = {
  ALL: 'All Tracking Methods',
  MILESTONES: 'Milestones',
  TASKS: 'Tasks',
  NUMBER_TARGET: 'Target',
  ROUTINE: 'Routine',
  MANUAL: 'Manual',
};

export const GoalsPage = () => {
  const [activeStatusTab, setActiveStatusTab] = useState('ACTIVE');
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedTracking, setSelectedTracking] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [openCardMenuId, setOpenCardMenuId] = useState(null);

  const filterRef = useRef(null);
  const queryClient = useQueryClient();

  // Close filter popover on click outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isFilterOpen]);

  const activeFilterCount =
    (selectedArea !== 'ALL' ? 1 : 0) +
    (selectedPriority !== 'ALL' ? 1 : 0) +
    (selectedTracking !== 'ALL' ? 1 : 0);

  const isFiltered =
    activeStatusTab !== 'ACTIVE' ||
    activeFilterCount > 0 ||
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
        const suffix = goal.unit !== '₹' && goal.unit !== '$' && goal.unit ? ` ${goal.unit}` : '';
        const current = Number(goal.currentValue ?? goal.startValue ?? 0).toLocaleString();
        const target = Number(goal.targetValue || 0).toLocaleString();
        return `${prefix}${current} / ${prefix}${target}${suffix}`;
      }
      case 'ROUTINE': {
        if (goal.routineCompletedCount !== undefined && goal.routineFrequency) {
          return `${goal.routineCompletedCount} of ${goal.routineFrequency} this ${goal.routinePeriod?.toLowerCase() || 'week'}`;
        }
        if (goal.routineFrequency) {
          return `${goal.routineFrequency} times per ${goal.routinePeriod?.toLowerCase() || 'week'}`;
        }
        return 'Routine tracking';
      }
      case 'TASKS': {
        const totalTasks = goal.tasks?.length ?? goal._count?.tasks ?? 0;
        if (totalTasks === 0) {
          return 'No tasks linked yet';
        }
        const doneTasks = goal.tasks?.filter((t) => t.status === 'COMPLETED').length;
        if (doneTasks !== undefined && totalTasks > 0) {
          return `${doneTasks} of ${totalTasks} tasks`;
        }
        const completedFromProgress = Math.round(((goal.progress || 0) / 100) * totalTasks);
        return `${completedFromProgress} of ${totalTasks} task${totalTasks === 1 ? '' : 's'}`;
      }
      case 'MILESTONES': {
        if (goal.successCriteria && goal.successCriteria.length > 0) {
          const done = goal.successCriteria.filter((c) => c.isCompleted).length;
          return `${done} of ${goal.successCriteria.length} milestones`;
        }
        const roadmap = goal.roadmaps?.[0];
        if (roadmap && roadmap.milestones && roadmap.milestones.length > 0) {
          const done = roadmap.milestones.filter((m) => m.status === 'COMPLETED').length;
          return `${done} of ${roadmap.milestones.length} milestones`;
        }
        if (roadmap && (!roadmap.milestones || roadmap.milestones.length === 0)) {
          return 'Roadmap has no milestones yet';
        }
        if ((goal._count?.roadmaps || 0) > 0) {
          return 'Roadmap has no milestones yet';
        }
        return 'Roadmap not started';
      }
      case 'MANUAL':
      default:
        return `${goal.progress || 0}% progress`;
    }
  };

  return (
    <div
      className="space-y-3.5 max-w-6xl mx-auto pb-12"
      onClick={() => setOpenCardMenuId(null)}
    >
      {/* 1. CLEAN RESTRAINED HEADER */}
      <PageHeader
        icon={Target}
        iconContainer={false}
        title="Goals"
        subtitle="Turn meaningful goals into measurable progress."
        action={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] active:bg-[#1A5030] text-white rounded-xl font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            <span>New Goal</span>
          </button>
        }
      />

      {/* 2. SINGLE LIGHTWEIGHT SUMMARY STRIP */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 py-2 px-3.5 bg-white dark:bg-[#111827] rounded-xl border border-slate-200/70 dark:border-[#263247] text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.active}</span>
          <span className="text-slate-500 dark:text-[#94A3B8]">Active</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.dueSoon}</span>
          <span className="text-slate-500 dark:text-[#94A3B8]">Due soon</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.needsAttention}</span>
          <span className="text-slate-500 dark:text-[#94A3B8]">Needs attention</span>
        </div>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">·</span>
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">{metrics.completed}</span>
          <span className="text-slate-500 dark:text-[#94A3B8]">Completed</span>
        </div>
      </div>

      {/* 3. STATUS TABS & SEARCH / FILTER TOOLBAR */}
      <div className="space-y-2">
        {/* Calm Status Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200/70 dark:border-[#263247] overflow-x-auto pb-px text-xs">
          {STATUS_TABS.map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStatusTab(tab.id)}
                className={`px-3 py-1.5 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer ${
                  isActive
                    ? 'border-[#2A7A3B] text-[#2A7A3B] dark:text-[#4ADE80] font-semibold'
                    : 'border-transparent text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Progressive Filter Toolbar with Fixed Alignment */}
        <div className="space-y-1.5">
          <div className="relative flex items-center gap-2" ref={filterRef}>
            {/* Search Input with Clean Left Icon Alignment */}
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals..."
                className="w-full h-9 pl-10 pr-8 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#2A7A3B] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filters Trigger Button Sharing Exact Height & Border Weight */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className={`h-9 inline-flex items-center gap-1.5 px-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                activeFilterCount > 0 || isFilterOpen
                  ? 'bg-slate-100 dark:bg-[#161E2D] border-[#2A7A3B]/40 text-[#2A7A3B] dark:text-[#4ADE80]'
                  : 'bg-white dark:bg-[#111827] border-slate-200/80 dark:border-[#263247] text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#161E2D]'
              }`}
            >
              <SlidersHorizontal size={13} />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#2A7A3B] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Filter Popover Dropdown */}
            {isFilterOpen && (
              <div
                className="absolute right-0 top-full mt-1.5 w-72 sm:w-80 p-4 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-[#263247] shadow-xl shadow-slate-900/10 dark:shadow-black/40 z-30 space-y-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#263247]">
                  <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Filter Goals
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedArea('ALL');
                        setSelectedPriority('ALL');
                        setSelectedTracking('ALL');
                      }}
                      className="text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Area Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    Area
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-lg text-xs text-slate-800 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
                  >
                    {AREA_FILTERS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    Priority
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-lg text-xs text-slate-800 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>

                {/* Tracking Method Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-500 dark:text-[#94A3B8]">
                    Tracking Method
                  </label>
                  <select
                    value={selectedTracking}
                    onChange={(e) => setSelectedTracking(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-lg text-xs text-slate-800 dark:text-[#CBD5E1] focus:outline-none focus:border-[#2A7A3B]"
                  >
                    <option value="ALL">All Tracking Methods</option>
                    <option value="MILESTONES">Milestones</option>
                    <option value="TASKS">Tasks</option>
                    <option value="NUMBER_TARGET">Target</option>
                    <option value="ROUTINE">Routine</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3.5 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Chips */}
          {(activeFilterCount > 0 || searchQuery.trim()) && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {selectedArea !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-medium border border-slate-200/50 dark:border-[#263247]">
                  <span>{AREA_FILTERS.find((a) => a.id === selectedArea)?.label || selectedArea}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedArea('ALL')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                    aria-label="Remove area filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedPriority !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-medium border border-slate-200/50 dark:border-[#263247]">
                  <span>{selectedPriority.charAt(0) + selectedPriority.slice(1).toLowerCase()} Priority</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPriority('ALL')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                    aria-label="Remove priority filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {selectedTracking !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-medium border border-slate-200/50 dark:border-[#263247]">
                  <span>{TRACKING_LABELS[selectedTracking] || selectedTracking}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTracking('ALL')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                    aria-label="Remove tracking filter"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-medium border border-slate-200/50 dark:border-[#263247]">
                  <span>"{searchQuery.trim()}"</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer ml-0.5"
                    aria-label="Clear search"
                  >
                    <X size={11} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
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

      {/* 5. CALM EMPTY STATES */}
      {!isLoading && !isError && goals.length === 0 && (
        <div className="py-16 text-center max-w-sm mx-auto">
          {isFiltered ? (
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                No goals match these filters
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 mb-4 leading-relaxed">
                Try loosening your search or filter criteria.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#161E2D] dark:hover:bg-[#1D2738] text-xs font-semibold rounded-lg text-slate-700 dark:text-[#CBD5E1] transition-colors cursor-pointer"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Goals
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1 mb-4 leading-relaxed max-w-xs mx-auto">
                Turn something important into clear, measurable progress.
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>New Goal</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. GOALS GRID (1 OR 2 COLUMNS WITH REDUCED EXCESSIVE HEIGHT) */}
      {!isLoading && goals.length > 0 && (
        <div
          className={
            goals.length === 1
              ? 'max-w-xl'
              : 'grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4'
          }
        >
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
                className="group/card bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/70 dark:border-[#263247] p-4.5 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Metadata Row: Area + Priority + Optional Status + Menu */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-[#94A3B8]">
                        {getAreaLabel(goal)}
                      </span>

                      {goal.priority === 'HIGH' && (
                        <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50">
                          High
                        </span>
                      )}

                      {/* Avoid redundant ACTIVE status badge when in Active tab */}
                      {(activeStatusTab === 'ALL' || goal.status !== 'ACTIVE') && (
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase">
                          {goal.status}
                        </span>
                      )}
                    </div>

                    {/* Kebab Action Menu */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenCardMenuId(isMenuOpen ? null : goal.id);
                        }}
                        aria-label="Goal options"
                        className="p-1 -mr-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg cursor-pointer"
                      >
                        <MoreHorizontal size={15} />
                      </button>

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

                  {/* Goal Title */}
                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="block font-semibold text-[17px] text-slate-900 dark:text-[#F8FAFC] hover:text-[#2A7A3B] dark:hover:text-[#4ADE80] transition-colors leading-snug line-clamp-2"
                  >
                    {goal.title}
                  </Link>

                  {/* Subtle Desired Outcome / Purpose */}
                  {goal.desiredOutcome && (
                    <p className="text-xs text-slate-500 dark:text-[#94A3B8] line-clamp-2 mt-0.5 leading-relaxed">
                      {goal.desiredOutcome}
                    </p>
                  )}

                  {/* Unified Progress Visualization */}
                  <div className="space-y-1 my-2.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {goal.progress || 0}%
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        {getTrackingDetail(goal)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-[#161E2D] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#2A7A3B] dark:bg-[#4ADE80] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, goal.progress || 0))}%` }}
                      />
                    </div>
                  </div>

                  {/* Contextual Next Action with Clean Action-Oriented Styling */}
                  {nextTask && (
                    <Link
                      to={`/app/goals/${goal.id}`}
                      className="group/next flex items-center justify-between py-1.5 px-2 -mx-1 rounded-lg hover:bg-slate-50 dark:hover:bg-[#161E2D] transition-colors text-xs my-1.5 border border-transparent hover:border-slate-200/50 dark:hover:border-[#263247]"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          NEXT
                        </div>
                        <div className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate mt-0.5">
                          {nextTask.title}
                        </div>
                      </div>
                      <ArrowRight
                        size={13}
                        className="text-slate-400 group-hover/next:text-[#2A7A3B] group-hover/next:translate-x-0.5 transition-all shrink-0"
                      />
                    </Link>
                  )}
                </div>

                {/* Card Footer: Quiet Deadline + Text Continue Action */}
                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-[#263247] text-xs mt-1">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    Target · {formattedTarget}
                  </span>

                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="group/btn inline-flex items-center gap-1 font-semibold text-xs text-[#2A7A3B] dark:text-[#4ADE80] hover:text-[#22653A] dark:hover:text-[#86EFAC] cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight
                      size={13}
                      className="group-hover/btn:translate-x-0.5 transition-transform"
                    />
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
