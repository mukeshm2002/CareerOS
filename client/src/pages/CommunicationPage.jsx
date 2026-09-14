import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import api from '../services/api';
import {
  MessageSquare,
  Mic,
  PenTool,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  X,
  Volume2,
  BookOpen,
} from 'lucide-react';

export const CommunicationPage = () => {
  const queryClient = useQueryClient();
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [quickTitle, setQuickTitle] = useState('10 min English Speaking Practice');
  const [quickMinutes, setQuickMinutes] = useState(10);
  const [quickDesc, setQuickDesc] = useState('Speak about what you worked on today without switching languages.');

  // 1. Fetch communication goals
  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ['goals', 'ACTIVE', 'COMMUNICATION'],
    queryFn: async () => {
      const res = await api.get('/goals', { params: { status: 'ACTIVE', growthArea: 'COMMUNICATION' } });
      return res.data;
    },
  });

  // 2. Fetch communication tasks (today + recent)
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'COMMUNICATION'],
    queryFn: async () => {
      const res = await api.get('/tasks', { params: { growthArea: 'COMMUNICATION' } });
      return res.data;
    },
  });

  // 3. Fetch progress overview
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

  // Today's active or completed practice task
  const todayTask = tasks.find((t) => {
    if (t.status === 'COMPLETED' && t.completedAt) {
      return t.completedAt.slice(0, 10) === todayStr;
    }
    return t.status !== 'COMPLETED';
  }) || null;

  const recentPractices = tasks.filter((t) => t.status === 'COMPLETED').slice(0, 5);

  // Quick setup / Create communication task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      const res = await api.post('/tasks', {
        title: taskData.title,
        description: taskData.description,
        estimatedMinutes: taskData.estimatedMinutes,
        growthArea: 'COMMUNICATION',
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

  // Mark task status mutation
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

  const commMetrics = progressData?.data?.growthAreas?.communication || {
    practiceDays: recentPractices.length > 0 ? 1 : 0,
    practiceSessions: recentPractices.length,
    tasksCompleted: recentPractices.length,
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <PageHeader
        icon={MessageSquare}
        title="Communication"
        subtitle="Improve how you speak, write, and express yourself."
        action={
          <button
            type="button"
            onClick={() => setShowSetupModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF7A00] hover:bg-[#EA6700] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#FF7A00]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Set Practice</span>
          </button>
        }
      />

      {/* Grid: Current Goal & Today's Practice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Today's Practice */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                TODAY'S PRACTICE
              </span>
              {todayTask?.status === 'COMPLETED' ? (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Completed today
                </span>
              ) : todayTask ? (
                <span className="text-xs font-bold text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                  <Clock size={13} /> {todayTask.estimatedMinutes || 10} min
                </span>
              ) : null}
            </div>

            {todayTask ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {todayTask.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  {todayTask.description || 'Speak clearly and express your thoughts with confidence.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">No practice set for today.</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Build fluency and articulation with one short daily exercise.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#263247] flex items-center justify-between">
            {todayTask ? (
              todayTask.status === 'COMPLETED' ? (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  ✓ Great job completing today's practice.
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
                Set Practice
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Current Goal */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#161E2D] text-slate-700 dark:text-[#94A3B8]">
                ACTIVE GOAL
              </span>
              {currentGoal && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {currentGoal.progress || 0}% Progress
                </span>
              )}
            </div>

            {currentGoal ? (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {currentGoal.title}
                </h3>
                <div className="text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                  {currentGoal.metadata?.currentLevel && (
                    <p>Current Level: <strong className="text-slate-700 dark:text-[#CBD5E1]">{currentGoal.metadata.currentLevel}</strong></p>
                  )}
                  {currentGoal.metadata?.practiceTarget && (
                    <p>Target: <strong className="text-slate-700 dark:text-[#CBD5E1]">{currentGoal.metadata.practiceTarget}</strong></p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 py-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">No active communication goal.</p>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Set a dedicated target for speaking, writing, or confidence.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#263247]">
            <a
              href="/app/goals"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#FF7A00] hover:text-[#EA6700]"
            >
              <span>{currentGoal ? 'Manage in Goals' : 'Create Goal'}</span>
              <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </div>

      {/* Factual Progress Stats */}
      <div className="grid grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] p-4 text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-[#64748B]">Practice Days</p>
          <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{commMetrics.practiceDays}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] p-4 text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-[#64748B]">Sessions Completed</p>
          <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{commMetrics.practiceSessions}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] rounded-xl border border-slate-200/80 dark:border-[#263247] p-4 text-center">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-[#64748B]">Total Tasks Done</p>
          <p className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-1">{commMetrics.tasksCompleted}</p>
        </div>
      </div>

      {/* Quick Setup Options */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Quick Practice Templates</h3>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
          Pick a proven routine to start immediately:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                '10 min English Speaking',
                10,
                'Speak about what you worked on today for 10 minutes without switching languages.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-[#FF7A00] bg-slate-50/50 dark:bg-[#161E2D] hover:bg-[#FFF7EF] dark:hover:bg-[rgba(255,122,0,0.06)] text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-[#FF7A00]">
              <Mic size={14} className="text-[#FF7A00]" />
              <span>English Speaking</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">10 min spontaneous recap</p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                '15 min Professional Writing',
                15,
                'Write a crisp summary of a technical decision or work deliverable.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-[#FF7A00] bg-slate-50/50 dark:bg-[#161E2D] hover:bg-[#FFF7EF] dark:hover:bg-[rgba(255,122,0,0.06)] text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-[#FF7A00]">
              <PenTool size={14} className="text-[#FF7A00]" />
              <span>Professional Writing</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">15 min structured synthesis</p>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickSetup(
                '10 min Presentation Practice',
                10,
                'Practice presenting your project demo or ideas aloud with clear structure.'
              )
            }
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#263247] hover:border-[#FF7A00] bg-slate-50/50 dark:bg-[#161E2D] hover:bg-[#FFF7EF] dark:hover:bg-[rgba(255,122,0,0.06)] text-left transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-[#F8FAFC] font-semibold text-xs group-hover:text-[#FF7A00]">
              <Volume2 size={14} className="text-[#FF7A00]" />
              <span>Presentation Prep</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">10 min pitch rehearsal</p>
          </button>
        </div>
      </div>

      {/* Recent Practice Activity */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 shadow-card space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Recent Practice Activity</h3>
        {recentPractices.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-[#94A3B8]">No completed communication sessions yet.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#263247]">
            {recentPractices.map((task) => (
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Set Today's Practice</h3>
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
                  Practice Title
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
                  max="60"
                  value={quickMinutes}
                  onChange={(e) => setQuickMinutes(parseInt(e.target.value, 10) || 10)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#FF7A00]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Prompt / Instructions
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
                  {createTaskMutation.isPending ? 'Saving...' : 'Set Practice'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
