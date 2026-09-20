import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
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
} from 'lucide-react';

export const GoalsPage = () => {
  const [selectedArea, setSelectedArea] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['goals', activeTab, selectedArea],
    queryFn: () => goalService.getGoals(activeTab, selectedArea === 'ALL' ? undefined : selectedArea),
  });

  const goals = data?.data?.goals || [];

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleStatusChange = (goalId, newStatus) => {
    statusMutation.mutate({ goalId, status: newStatus });
  };

  const getAreaBadge = (area) => {
    switch (area) {
      case 'COMMUNICATION':
        return { label: 'Communication', color: 'bg-slate-100 dark:bg-[#151D2B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#253044]' };
      case 'HEALTH':
        return { label: 'Health', color: 'bg-slate-100 dark:bg-[#151D2B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#253044]' };
      case 'PERSONAL':
        return { label: 'Personal', color: 'bg-slate-100 dark:bg-[#151D2B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#253044]' };
      case 'CAREER':
      default:
        return { label: 'Career', color: 'bg-slate-100 dark:bg-[#151D2B] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[#253044]' };
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        icon={Target}
        title="My Goals"
        subtitle="Build progress across the areas that matter to you."
        action={
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Goal</span>
          </button>
        }
      />

      {/* Growth Area Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#263247] pb-3 text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-[#161E2D] rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CAREER', label: 'Career' },
            { id: 'COMMUNICATION', label: 'Communication' },
            { id: 'HEALTH', label: 'Health' },
            { id: 'PERSONAL', label: 'Personal' },
          ].map((area) => {
            const isSelected = selectedArea === area.id;
            return (
              <button
                key={area.id}
                type="button"
                onClick={() => setSelectedArea(area.id)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-white dark:bg-[#0D121C] text-[#2A7A3B] shadow-xs'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                {area.label}
              </button>
            );
          })}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1">
          {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-xs ${
                  isActive
                    ? 'bg-brand-soft text-[#2A7A3B] dark:bg-[rgba(42,122,59,0.15)] dark:text-[#4ADE80] border border-[#2A7A3B]/25'
                    : 'text-slate-500 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#161E2D]'
                }`}
              >
                {tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-12 flex justify-center items-center">
          <div className="h-7 w-7 border-3 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-[#EF4444]/10 border border-red-100 dark:border-[#EF4444]/30 text-red-700 dark:text-[#F87171] text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error?.response?.data?.message || 'Failed to load goals from database.'}</span>
        </div>
      )}

      {/* Goals Grid */}
      {!isLoading && !isError && goals.length === 0 && (
        <EmptyState
          icon={Target}
          title={activeTab === 'ACTIVE' ? 'No active goals yet' : `No ${activeTab.toLowerCase()} goals`}
          description={
            activeTab === 'ACTIVE'
              ? 'Create your first goal and start building toward what matters to you.'
              : `You have no ${activeTab.toLowerCase()} goals in this category.`
          }
          primaryAction={
            activeTab === 'ACTIVE'
              ? {
                  label: 'Create Goal',
                  onClick: handleOpenModal,
                }
              : undefined
          }
        />
      )}

      {!isLoading && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {goals.map((goal) => {
            const formattedTargetDate = goal.targetDate
              ? new Date(goal.targetDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Dec 31, 2026';

            const areaInfo = getAreaBadge(goal.growthArea);

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-6 shadow-card hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md ${areaInfo.color}`}>
                        {areaInfo.label}
                      </span>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-600 dark:text-[#94A3B8]">
                        {goal.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#16A34A] dark:text-[#22C55E]">{goal.progress || 0}% Done</span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] mb-2">{goal.title}</h2>
                  <div className="text-xs text-slate-500 dark:text-[#94A3B8] space-y-1 mb-4">
                    <p>Target Date: <strong className="text-slate-700 dark:text-[#CBD5E1]">{formattedTargetDate}</strong></p>
                    {goal.targetRole && (
                      <p>Target Role: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.targetRole}</strong></p>
                    )}
                    {goal.targetSalary && (
                      <p>Target Salary: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.targetSalary}</strong></p>
                    )}
                    {goal.metadata?.currentLevel && (
                      <p>Level: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.metadata.currentLevel}</strong></p>
                    )}
                    {goal.metadata?.practiceTarget && (
                      <p>Target: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.metadata.practiceTarget}</strong></p>
                    )}
                    {goal.metadata?.routine && (
                      <p>Routine: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.metadata.routine}</strong></p>
                    )}
                    {goal.metadata?.frequency && (
                      <p>Frequency: <strong className="text-slate-700 dark:text-[#CBD5E1]">{goal.metadata.frequency}</strong></p>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 dark:bg-[#161E2D] h-2 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-[#22C55E] dark:bg-[#34D399] h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>

                  {/* Next action */}
                  <div className="p-3 bg-slate-50 dark:bg-[#161E2D] rounded-xl border border-slate-200/60 dark:border-[#263247] text-xs mb-4">
                    <span className="text-slate-400 dark:text-[#64748B] font-medium">Next Action: </span>
                    <span className="font-semibold text-slate-800 dark:text-[#F8FAFC]">
                      {goal.notes || 'Define milestone and daily focus action'}
                    </span>
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-[#263247]">
                  <div className="flex items-center gap-1.5">
                    {goal.status === 'ACTIVE' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'PAUSED')}
                        title="Pause Goal"
                        className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-amber-600 dark:hover:text-[#FBBF24] hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <PauseCircle size={16} />
                      </button>
                    )}

                    {goal.status === 'PAUSED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'ACTIVE')}
                        title="Resume Goal"
                        className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-[#2A7A3B] hover:bg-brand-soft rounded-lg transition-colors cursor-pointer"
                      >
                        <PlayCircle size={16} />
                      </button>
                    )}

                    {goal.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'COMPLETED')}
                        title="Mark Completed"
                        className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#22C55E] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                    )}

                    {goal.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(goal.id, 'ARCHIVED')}
                        title="Archive Goal"
                        className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#161E2D] rounded-lg transition-colors cursor-pointer"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                  </div>

                  <Link
                    to={`/app/goals/${goal.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7A3B] hover:text-[#22653A]"
                  >
                    <span>Open</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3-Step Guided Create Goal Modal */}
      <CreateGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialArea={selectedArea === 'ALL' ? 'CAREER' : selectedArea}
        onGoalCreated={handleGoalCreated}
      />
    </div>
  );
};
