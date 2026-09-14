import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import {
  Target,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  PauseCircle,
  PlayCircle,
  Archive,
  X,
  AlertCircle,
} from 'lucide-react';

const goalTypes = [
  'FIRST_JOB',
  'JOB_SWITCH',
  'SALARY_GROWTH',
  'PROMOTION',
  'FREELANCING',
  'CAREER_CHANGE',
  'SKILL_MASTERY',
  'CERTIFICATION',
  'PORTFOLIO',
  'BUSINESS',
  'CUSTOM',
];

export const GoalsPage = () => {
  const [activeTab, setActiveTab] = useState('ACTIVE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // New goal form state
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    type: 'JOB_SWITCH',
    priority: 'HIGH',
    targetDate: '2026-12-31',
    targetRole: '',
    targetSalary: '',
  });

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['goals', activeTab],
    queryFn: () => goalService.getGoals(activeTab),
  });

  const goals = data?.data?.goals || [];

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => goalService.createGoal(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setIsModalOpen(false);
      setNewGoal({
        title: '',
        description: '',
        type: 'JOB_SWITCH',
        priority: 'HIGH',
        targetDate: '2026-12-31',
        targetRole: '',
        targetSalary: '',
      });
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Failed to create goal';
      setErrorMessage(msg);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ goalId, status }) => goalService.updateGoalStatus(goalId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newGoal.title.trim()) {
      setErrorMessage('Goal title is required');
      return;
    }
    createGoalMutation.mutate(newGoal);
  };

  const handleStatusChange = (goalId, newStatus) => {
    statusMutation.mutate({ goalId, status: newStatus });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader
        icon={Target}
        title="Goals"
        subtitle="Define your primary anchors and track strategic progress."
        action={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00] hover:bg-[#EA6700] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#FF7A00]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Goal</span>
          </button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#263247] pb-3 text-xs">
        {['ACTIVE', 'COMPLETED', 'ARCHIVED'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#FFF3E4] text-[#FF7A00] dark:bg-[rgba(255,122,0,0.15)] dark:text-[#FF9D42] border border-[#FF7A00]/25'
                  : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#161E2D]'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="py-12 flex justify-center items-center">
          <div className="h-7 w-7 border-3 border-[#FF7A00] border-t-transparent rounded-full animate-spin" />
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
              : `You have no ${activeTab.toLowerCase()} goals at this moment.`
          }
          primaryAction={
            activeTab === 'ACTIVE'
              ? {
                  label: 'Create Goal',
                  onClick: () => setIsModalOpen(true),
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

            return (
              <div
                key={goal.id}
                className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-6 shadow-card hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-brand-soft text-[#FF7A00]">
                      {goal.type?.replace('_', ' ')}
                    </span>
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
                  </div>

                  {/* Progress bar with growth/accent color */}
                  <div className="w-full bg-slate-100 dark:bg-[#161E2D] h-2 rounded-full overflow-hidden mb-4">
                    <div
                      className="bg-[#22C55E] dark:bg-[#34D399] h-full rounded-full transition-all duration-300"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>

                  {/* Next action placeholder */}
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
                        className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-[#FF7A00] hover:bg-brand-soft rounded-lg transition-colors cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7A00] hover:text-[#EA6700]"
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

      {/* New Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Create New Career Goal</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Goal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  placeholder="e.g. Master Spring Boot and System Design"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={newGoal.type}
                    onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
                  >
                    {goalTypes.map((gt) => (
                      <option key={gt} value={gt}>
                        {gt.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newGoal.priority}
                    onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={newGoal.targetRole}
                    onChange={(e) => setNewGoal({ ...newGoal, targetRole: e.target.value })}
                    placeholder="e.g. Senior Backend Dev"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Compensation</label>
                <input
                  type="text"
                  value={newGoal.targetSalary}
                  onChange={(e) => setNewGoal({ ...newGoal, targetSalary: e.target.value })}
                  placeholder="e.g. $130,000 / yr"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGoalMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {createGoalMutation.isPending ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
