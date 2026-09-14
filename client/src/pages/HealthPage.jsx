import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import api from '../services/api';
import {
  Activity,
  Heart,
  Footprints,
  Droplets,
  Moon,
  CheckCircle2,
  Clock,
  Calendar,
  Plus,
  ArrowRight,
  X,
  Flame,
} from 'lucide-react';

export const HealthPage = () => {
  const queryClient = useQueryClient();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('20 min Daily Walk');
  const [quickMinutes, setQuickMinutes] = useState(20);
  const [quickDesc, setQuickDesc] = useState('Take a brisk 20-minute walk to clear your head and restore energy.');

  // 1. Fetch health goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', 'ACTIVE', 'HEALTH'],
    queryFn: async () => {
      const res = await api.get('/goals', { params: { status: 'ACTIVE', growthArea: 'HEALTH' } });
      return res.data;
    },
  });

  // 2. Fetch health tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'HEALTH'],
    queryFn: async () => {
      const res = await api.get('/tasks', { params: { growthArea: 'HEALTH' } });
      return res.data;
    },
  });

  // 3. Fetch progress summary for factual consistency
  const { data: progressData } = useQuery({
    queryKey: ['progress', 'this_week'],
    queryFn: async () => {
      const res = await api.get('/progress');
      return res.data;
    },
  });

  const goals = goalsData?.data?.goals || [];
  const currentGoal = goals[0] || null;

  const tasks = tasksData?.data?.tasks || [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Today's active or completed routine task
  const todayTask = tasks.find((t) => {
    if (t.status === 'COMPLETED' && t.completedAt) {
      return t.completedAt.slice(0, 10) === todayStr;
    }
    return t.status !== 'COMPLETED';
  }) || null;

  const recentActivities = tasks.filter((t) => t.status === 'COMPLETED').slice(0, 5);

  // Create health task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const res = await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        estimatedMinutes: taskData.estimatedMinutes,
        growthArea: 'HEALTH',
        taskType: 'LEARNING',
        goalId: currentGoal?.id || null,
        dueDate: new Date().toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      setShowSetupModal(false);
    },
  });

  // Mark status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const res = await api.patch(`/tasks/${taskId}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const handleQuickSetup = (title, minutes, desc) => {
    createTaskMutation.mutate({
      title,
      estimatedMinutes: minutes,
      description: desc,
    });
  };

  const healthMetrics = progressData?.data?.growthAreas?.health || {
    routineDays: recentActivities.length > 0 ? 1 : 0,
    tasksCompleted: recentActivities.length,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader
        icon={Activity}
        title="Health"
        subtitle="Build consistent habits that support your daily energy and wellbeing."
        action={
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00] hover:bg-[#EA6700] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#FF7A00]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Set Routine</span>
          </button>
        }
      />

      {/* Grid: Current Routine & Today's Routine */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Today's Routine */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                TODAY'S ROUTINE
              </span>
              {todayTask?.status === 'COMPLETED' ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Completed today
                </span>
              ) : todayTask ? (
                <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                  <Clock size={13} /> {todayTask.estimatedMinutes || 20} min
                </span>
              ) : null}
            </div>

            {todayTask ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {todayTask.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {todayTask.description || 'Take care of your energy and focus.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">No routine set for today.</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Build one simple habit that supports your energy and wellbeing.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#263247] flex items-center justify-between">
            {todayTask ? (
              todayTask.status === 'COMPLETED' ? (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Routine completed for today.
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <button
                    type="button"
                    onClick={() =>
                      updateTaskStatusMutation.mutate({
                        taskId: todayTask.id,
                        status: 'COMPLETED',
                      })
                    }
                    disabled={updateTaskStatusMutation.isPending}
                    className="flex-1 py-2 px-3 bg-[#FF7A00] hover:bg-[#EA6700] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer text-center"
                  >
                    Mark Done
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSetupModal(true)}
                    className="py-2 px-3 border border-slate-200 dark:border-[#263247] text-slate-600 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#161E2D] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )
            ) : (
              <button
                type="button"
                onClick={() => setShowSetupModal(true)}
                className="w-full py-2 px-3 bg-[#FF7A00] hover:bg-[#EA6700] text-white rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer text-center"
              >
                Set Routine
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Current Routine / Goal */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#94A3B8]">
                ACTIVE ROUTINE
              </span>
              {currentGoal && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {currentGoal.progress || 0}% Consistent
                </span>
              )}
            </div>

            {currentGoal ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {currentGoal.title}
                </h3>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                  {currentGoal.metadata?.routine && (
                    <p>Focus: <strong className="text-slate-700 dark:text-[#CBD5E1]">{currentGoal.metadata.routine}</strong></p>
                  )}
                  {currentGoal.metadata?.frequency && (
                    <p>Frequency: <strong className="text-slate-700 dark:text-[#CBD5E1]">{currentGoal.metadata.frequency}</strong></p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">No active health habit configured.</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Anchor one primary wellbeing routine like daily walking or consistent sleep.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#263247]">
            <a
              href="/app/goals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7A00] hover:text-[#EA6700]"
            >
              <span>{currentGoal ? 'Manage in Goals' : 'Create Routine'}</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Weekly Consistency Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] p-4 text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-[#64748B]">Routine Days (This Week)</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{healthMetrics.routineDays}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] p-4 text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-[#64748B]">Routines Completed</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{healthMetrics.tasksCompleted}</p>
        </div>
      </div>

      {/* Quick Setup Templates */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Quick Routine Templates</h3>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
          Simple evidence-based habits for physical and mental clarity:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                '20 min Daily Walk',
                20,
                'Take a brisk 20-minute walk to clear your head and restore energy.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-emerald-500 bg-slate-50/50 dark:bg-[#161E2D] hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Footprints size={14} className="text-emerald-500" />
              <span>Daily Movement</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">20 min outdoor walk</p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                'Hydration & Stretch Break',
                10,
                'Drink a large glass of water and do 10 minutes of gentle full-body mobility stretching.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-emerald-500 bg-slate-50/50 dark:bg-[#161E2D] hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Droplets size={14} className="text-emerald-500" />
              <span>Hydrate & Reset</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">10 min mobility break</p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                'Evening Wind Down',
                15,
                'Power down devices 30 min before bed, dim the lights, and prepare for restorative sleep.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-emerald-500 bg-slate-50/50 dark:bg-[#161E2D] hover:bg-emerald-50/40 dark:hover:bg-emerald-500/5 text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Moon size={14} className="text-emerald-500" />
              <span>Sleep Routine</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">15 min bedtime transition</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Recent Routine Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-[#94A3B8]">No completed health routines yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#263247]">
            {recentActivities.map((task) => (
              <div key={task.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-[#F8FAFC]">{task.title}</p>
                    {task.description && (
                      <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] truncate max-w-sm">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 dark:text-[#94A3B8]">
                  {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recent'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setShowSetupModal(false)} />
          <div className="relative bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#263247]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Set Today's Routine</h3>
              <button
                type="button"
                onClick={() => setShowSetupModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Target Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={quickMinutes}
                  onChange={(e) => setQuickMinutes(parseInt(e.target.value, 10) || 20)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Description / Habit Cue
                </label>
                <textarea
                  rows="2"
                  value={quickDesc}
                  onChange={(e) => setQuickDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#FF7A00]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSetupModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#263247] text-slate-600 dark:text-[#94A3B8] text-xs font-semibold hover:bg-slate-50 dark:hover:bg-[#161E2D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSetup(quickTitle, quickMinutes, quickDesc)}
                  disabled={createTaskMutation.isPending}
                  className="px-5 py-2 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  {createTaskMutation.isPending ? 'Saving...' : 'Set Routine'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
