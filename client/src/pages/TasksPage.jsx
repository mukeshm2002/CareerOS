import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../features/planning/services/planningService';
import { goalService } from '../features/goals/services/goalService';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
import {
  CheckSquare,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Ban,
  FastForward,
  Trash2,
  Edit2,
  X,
  Target,
  Sparkles,
  Milestone,
  BrainCircuit,
  Bell,
  PhoneCall,
} from 'lucide-react';
import ReminderBadge from '../components/reminders/ReminderBadge';
import ReminderConfigModal from '../components/reminders/ReminderConfigModal';

/**
 * Formats duration in minutes into a clean, human-readable string.
 * e.g., 45 -> "45 min", 60 -> "1h", 90 -> "1h 30m", 4560 -> "76h"
 */
export const formatTaskDuration = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') {
    return '30 min';
  }
  const m = parseInt(minutes, 10);
  if (isNaN(m) || m <= 0) {
    return `${minutes} min`;
  }
  if (m < 60) {
    return `${m} min`;
  }
  const hours = Math.floor(m / 60);
  const remainingMinutes = m % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
};

export const TasksPage = () => {
  const queryClient = useQueryClient();

  const [filterTab, setFilterTab] = useState('ALL'); // 'TODAY', 'UPCOMING', 'COMPLETED', 'ALL'
  const [showAddModal, setShowAddModal] = useState(false);
  const [planningTask, setPlanningTask] = useState(null);
  const [scheduleSuggestion, setScheduleSuggestion] = useState(null);

  // Add Task Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [taskType, setTaskType] = useState('LEARNING');
  const [estimatedMinutes, setEstimatedMinutes] = useState('45');
  const [dueDate, setDueDate] = useState('');
  const [goalId, setGoalId] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [addReminderOffset, setAddReminderOffset] = useState('');
  const [addReminderChannel, setAddReminderChannel] = useState('IN_APP');

  // Planning reminder state
  const [planReminderOffset, setPlanReminderOffset] = useState(10);
  const [planReminderChannel, setPlanReminderChannel] = useState('IN_APP');

  // Task reminder config modal
  const [taskReminderModal, setTaskReminderModal] = useState(null);

  // Fetch Goals
  const { data: goalsData } = useQuery({
    queryKey: ['goals'],
    queryFn: () => goalService.getGoals(),
  });
  const goals = goalsData?.data?.goals || [];

  // Fetch Milestones for selected goal if any
  const { data: roadmapData } = useQuery({
    queryKey: ['roadmap', goalId],
    queryFn: () => planningService.getRoadmapByGoal(goalId),
    enabled: !!goalId,
  });
  const milestones = roadmapData?.data?.roadmap?.milestones || [];

  // Fetch Skills for selection
  const { data: skillsData } = useQuery({
    queryKey: ['global-skills'],
    queryFn: () => planningService.getGlobalSkills(),
  });
  const skills = skillsData?.data?.skills || [];

  // Fetch Tasks with current tab filter
  const filterParams = {};
  if (filterTab === 'TODAY') filterParams.due = 'today';
  else if (filterTab === 'UPCOMING') filterParams.due = 'upcoming';
  else if (filterTab === 'COMPLETED') filterParams.status = 'COMPLETED';

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filterTab],
    queryFn: () => planningService.getTasks(filterParams),
  });
  const tasks = tasksData?.data?.tasks || [];

  // Today recommendation query (Section 30)
  const { data: recData } = useQuery({
    queryKey: ['tasks-recommendation-today'],
    queryFn: () => planningService.getTodayFocusRecommendation(),
  });
  const recommendation = recData?.data;

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data) => planningService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-recommendation-today'] });
      resetForm();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) => planningService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-recommendation-today'] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId) => planningService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-recommendation-today'] });
    },
  });

  // Suggest schedule block mutation
  const planTaskMutation = useMutation({
    mutationFn: ({ taskId, date }) => planningService.planTaskIntoSchedule(taskId, date),
    onSuccess: (data) => {
      setScheduleSuggestion(data?.data);
    },
  });

  // Confirm schedule block mutation
  const confirmScheduleBlockMutation = useMutation({
    mutationFn: (blockData) => planningService.createScheduleBlock(blockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      setPlanningTask(null);
      setScheduleSuggestion(null);
    },
  });

  const resetForm = () => {
    setShowAddModal(false);
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
    setTaskType('LEARNING');
    setEstimatedMinutes('45');
    setDueDate('');
    setGoalId('');
    setMilestoneId('');
    setSkillId('');
    setAddReminderOffset('');
    setAddReminderChannel('IN_APP');
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createTaskMutation.mutate({
      title,
      description,
      priority,
      taskType,
      estimatedMinutes: parseInt(estimatedMinutes, 10) || 30,
      dueDate: dueDate || null,
      reminderOffsetMinutes: addReminderOffset !== '' ? parseInt(addReminderOffset, 10) : null,
      reminderChannel: addReminderChannel,
      goalId: goalId || null,
      milestoneId: milestoneId || null,
      skillId: skillId || null,
      status: 'TODO',
    });
  };

  const handleOpenPlanModal = (task) => {
    setPlanningTask(task);
    setScheduleSuggestion(null);
    planTaskMutation.mutate({ taskId: task.id });
  };

  return (
    <div className="space-y-5">
      {/* Header & New Task */}
      <PageHeader
        icon={CheckSquare}
        title="Tasks"
        subtitle="Turn your plan into action."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Task</span>
          </button>
        }
      />

      {/* Recommended Focus Banner (Section 30) */}
      {recommendation?.recommendedTask && (
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-emerald-100/40 dark:bg-none dark:bg-[#111827] border border-emerald-200/80 dark:border-[rgba(42,122,59,0.30)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-[#2A7A3B] text-white px-2 py-0.5 rounded-md">
                <Sparkles size={11} />
                <span>Today's Top Focus</span>
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">
                {recommendation.recommendedTask.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8]">
              Why: <span className="font-medium text-slate-800 dark:text-[#F8FAFC]">{recommendation.reason}</span>
            </p>
          </div>

          <button
            onClick={() => handleOpenPlanModal(recommendation.recommendedTask)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#161E2D] border border-emerald-200 dark:border-[rgba(42,122,59,0.35)] text-[#2A7A3B] dark:text-[#4ADE80] text-xs font-bold hover:bg-emerald-50 dark:hover:bg-[#1A2638] transition-colors shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Calendar size={13} />
            <span>Plan into Schedule</span>
          </button>
        </div>
      )}

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-[#263247] pb-3 text-xs">
        {[
          { key: 'TODAY', label: 'Today' },
          { key: 'UPCOMING', label: 'Upcoming' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'ALL', label: 'All Tasks' },
        ].map((tab) => {
          const isActive = filterTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#2A7A3B]/10 text-[#2A7A3B] dark:bg-[rgba(42,122,59,0.18)] dark:text-[#4ADE80] border border-[#2A7A3B]/25'
                  : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#161E2D]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-5 md:p-6 shadow-card space-y-3.5">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-50/70 hover:bg-slate-50 dark:bg-[#161E2D]/80 dark:hover:bg-[#161E2D] border border-slate-200/70 hover:border-slate-300 dark:border-[#263247] dark:hover:border-[#33435C] transition-all space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) =>
                        updateStatusMutation.mutate({
                          taskId: task.id,
                          status: e.target.checked ? 'COMPLETED' : 'TODO',
                        })
                      }
                      className="mt-1 h-4 w-4 rounded text-[#2A7A3B] focus:ring-[#2A7A3B] cursor-pointer dark:bg-[#111827] dark:border-[#33435C]"
                    />

                    <div>
                      <h3
                        className={`text-xs font-bold leading-snug ${
                          isCompleted ? 'line-through text-slate-400 dark:text-[#64748B]' : 'text-slate-900 dark:text-[#F8FAFC]'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Domain Badges: Goal, Milestone, Skill */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {task.goal && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white dark:bg-[#111827] text-slate-700 dark:text-[#CBD5E1] px-2 py-0.5 rounded border border-slate-200 dark:border-[#263247]">
                            <Target size={10} className="text-[#2A7A3B] dark:text-[#4ADE80]" />
                            <span>{task.goal.title}</span>
                          </span>
                        )}
                        {task.milestone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white dark:bg-[#111827] text-slate-700 dark:text-[#CBD5E1] px-2 py-0.5 rounded border border-slate-200 dark:border-[#263247]">
                            <Milestone size={10} className="text-[#2A7A3B] dark:text-[#4ADE80]" />
                            <span>{task.milestone.title}</span>
                          </span>
                        )}
                        {task.skill && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/50">
                            <BrainCircuit size={10} />
                            <span>{task.skill.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority & Status Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.reminders && task.reminders.length > 0 ? (
                      <ReminderBadge
                        reminder={task.reminders[0]}
                        onSnoozed={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
                        onClick={() => setTaskReminderModal(task)}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTaskReminderModal(task)}
                        title="Add reminder"
                        className="p-1 rounded text-slate-400 hover:text-[#2A7A3B] dark:hover:text-[#4ADE80] hover:bg-[#2A7A3B]/10 transition-colors cursor-pointer"
                      >
                        <Bell size={13} />
                      </button>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        task.priority === 'CRITICAL'
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                          : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border-slate-200 dark:border-[#263247]'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] text-slate-600 dark:text-[#CBD5E1]">
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Footer Metrics & Actions (Section 21) */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200/50 dark:border-[#263247] text-slate-500 dark:text-[#94A3B8]">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{formatTaskDuration(task.estimatedMinutes)}</span>
                    </span>
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <button
                        onClick={() => handleOpenPlanModal(task)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2A7A3B]/10 hover:bg-[#2A7A3B]/20 text-[#2A7A3B] dark:bg-[rgba(42,122,59,0.18)] dark:hover:bg-[rgba(42,122,59,0.28)] dark:text-[#4ADE80] font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <Calendar size={12} />
                        <span>Plan into Schedule</span>
                      </button>
                    )}

                    {task.status !== 'IN_PROGRESS' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'IN_PROGRESS' })}
                        className="px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-[rgba(42,122,59,0.18)] text-[#2A7A3B] dark:text-[#4ADE80] font-semibold text-[11px] cursor-pointer"
                      >
                        Start
                      </button>
                    )}

                    {task.status !== 'BLOCKED' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'BLOCKED' })}
                        className="px-2 py-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-400 font-semibold text-[11px] cursor-pointer"
                      >
                        Block
                      </button>
                    )}

                    {task.status !== 'SKIPPED' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'SKIPPED' })}
                        className="px-2 py-1 rounded-lg hover:bg-slate-200 dark:hover:bg-[#1F293D] text-slate-600 dark:text-[#94A3B8] font-semibold text-[11px] cursor-pointer"
                      >
                        Skip
                      </button>
                    )}

                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 dark:hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={CheckSquare}
          title="Your plan has no actions yet"
          description="Create a task to start connecting your goals with daily practice."
          primaryAction={{
            label: 'Add Task',
            onClick: () => setShowAddModal(true),
          }}
        />
      )}

      {/* PLAN INTO SCHEDULE MODAL (Section 28) */}
      {planningTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#263247]">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Plan into Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">{planningTask.title}</p>
              </div>
              <button
                onClick={() => {
                  setPlanningTask(null);
                  setScheduleSuggestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {planTaskMutation.isPending ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 border-2 border-[#2A7A3B] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scheduleSuggestion?.fits ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-[#161E2D] border border-emerald-200 dark:border-[rgba(42,122,59,0.30)] space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-[#4ADE80] font-bold">
                    <CheckCircle2 size={16} />
                    <span>Suggested Time Window</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247]">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block font-medium">Date</span>
                      <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                        {new Date(scheduleSuggestion.suggestedBlock.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247]">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block font-medium">Start</span>
                      <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                        {scheduleSuggestion.suggestedBlock.startTime}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247]">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block font-medium">Duration</span>
                      <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                        {formatTaskDuration(planningTask.estimatedMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Reminder Options */}
                  <div className="space-y-2 pt-2 border-t border-emerald-200/60 dark:border-[rgba(42,122,59,0.20)]">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                        Reminder
                      </label>
                      <select
                        value={planReminderOffset}
                        onChange={(e) => setPlanReminderOffset(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B]"
                      >
                        <option value={0}>At scheduled time</option>
                        <option value={5}>5 minutes before</option>
                        <option value={10}>10 minutes before</option>
                        <option value={15}>15 minutes before</option>
                        <option value={30}>30 minutes before</option>
                        <option value="">No reminder</option>
                      </select>
                    </div>

                    {planReminderOffset !== '' && (
                      <div>
                        <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">
                          Notification
                        </label>
                        <div className="flex items-center gap-4 text-xs">
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-[#CBD5E1]">
                            <input
                              type="radio"
                              name="plan_channel"
                              value="IN_APP"
                              checked={planReminderChannel === 'IN_APP'}
                              onChange={() => setPlanReminderChannel('IN_APP')}
                              className="text-[#2A7A3B] focus:ring-[#2A7A3B]"
                            />
                            <span>In App</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-[#CBD5E1]">
                            <input
                              type="radio"
                              name="plan_channel"
                              value="VOICE"
                              checked={planReminderChannel === 'VOICE'}
                              onChange={() => setPlanReminderChannel('VOICE')}
                              className="text-[#2A7A3B] focus:ring-[#2A7A3B]"
                            />
                            <span>Voice Call</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-emerald-700 dark:text-[#94A3B8] leading-relaxed pt-1">
                    {scheduleSuggestion.reason}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#263247]">
                  <button
                    onClick={() => {
                      setPlanningTask(null);
                      setScheduleSuggestion(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#161E2D] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      confirmScheduleBlockMutation.mutate({
                        ...scheduleSuggestion.suggestedBlock,
                        reminderOffsetMinutes: planReminderOffset === '' ? null : planReminderOffset,
                        reminderChannel: planReminderChannel,
                      })
                    }
                    disabled={confirmScheduleBlockMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {confirmScheduleBlockMutation.isPending ? 'Scheduling...' : 'Schedule'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-bold">No available routine gap tonight</p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  {scheduleSuggestion?.reason || 'Task duration exceeds tonight\'s available window.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#263247]">
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Add Task</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] cursor-pointer">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build JWT authentication project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or outcome..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                  >
                    <option value="LOW" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">LOW</option>
                    <option value="MEDIUM" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">MEDIUM</option>
                    <option value="HIGH" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">HIGH</option>
                    <option value="CRITICAL" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Goal & Milestone Linkage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Link to Goal</label>
                  <select
                    value={goalId}
                    onChange={(e) => {
                      setGoalId(e.target.value);
                      setMilestoneId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] text-xs truncate focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                  >
                    <option value="" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">None (Independent)</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id} className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Link to Milestone</label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    disabled={!goalId || milestones.length === 0}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] text-xs disabled:bg-slate-100 dark:disabled:bg-[#0B0F17] dark:disabled:text-slate-600 truncate focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                  >
                    <option value="" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">None</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id} className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">
                        #{m.sequence} {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skill Linkage */}
              <div>
                <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Link to Skill (Optional)</label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B] focus:outline-hidden"
                >
                  <option value="" className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">None</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id} className="bg-white dark:bg-[#161E2D] text-slate-900 dark:text-[#F8FAFC]">
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Due Date & Reminder */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/80 dark:border-[#263247] space-y-2.5">
                <div>
                  <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Due Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Reminder</label>
                    <select
                      value={addReminderOffset}
                      onChange={(e) => setAddReminderOffset(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B]"
                    >
                      <option value="">No reminder</option>
                      <option value="0">At due time</option>
                      <option value="5">5 minutes before</option>
                      <option value="10">10 minutes before</option>
                      <option value="15">15 minutes before</option>
                      <option value="30">30 minutes before</option>
                      <option value="60">1 hour before</option>
                      <option value="1440">1 day before</option>
                    </select>
                  </div>

                  {addReminderOffset !== '' && (
                    <div>
                      <label className="font-bold text-slate-700 dark:text-[#CBD5E1] block mb-1">Channel</label>
                      <select
                        value={addReminderChannel}
                        onChange={(e) => setAddReminderChannel(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-[#263247] bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] text-xs focus:ring-2 focus:ring-[#2A7A3B]"
                      >
                        <option value="IN_APP">In App</option>
                        <option value="VOICE">Voice Call</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#263247]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#161E2D] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Adding...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Reminder Config Modal */}
      {taskReminderModal && (
        <ReminderConfigModal
          isOpen={Boolean(taskReminderModal)}
          title={`Reminder: ${taskReminderModal.title}`}
          sourceType="TASK"
          sourceId={taskReminderModal.id}
          linkedTaskId={taskReminderModal.id}
          initialData={{
            title: taskReminderModal.title,
            scheduledAt: taskReminderModal.dueDate,
            offsetMinutes: taskReminderModal.reminders?.[0]?.offsetMinutes !== undefined ? taskReminderModal.reminders[0].offsetMinutes : 10,
            channel: taskReminderModal.reminders?.[0]?.channel || 'IN_APP',
            id: taskReminderModal.reminders?.[0]?.id,
          }}
          onClose={() => setTaskReminderModal(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            setTaskReminderModal(null);
          }}
        />
      )}
    </div>
  );
};
