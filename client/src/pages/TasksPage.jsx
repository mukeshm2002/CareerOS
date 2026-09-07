import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../features/planning/services/planningService';
import { goalService } from '../features/goals/services/goalService';
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
} from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header & New Task (Section 21) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="text-brand-600" size={22} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">TASKS</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Turn your career plan into action.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-brand-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Recommended Focus Banner (Section 30) */}
      {recommendation?.recommendedTask && (
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-brand-600 text-white px-2 py-0.5 rounded-md">
                <Sparkles size={11} />
                <span>Today's Top Focus</span>
              </span>
              <span className="text-xs font-bold text-slate-800">
                {recommendation.recommendedTask.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Why: <span className="font-medium text-slate-800">{recommendation.reason}</span>
            </p>
          </div>

          <button
            onClick={() => handleOpenPlanModal(recommendation.recommendedTask)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-200 text-brand-700 text-xs font-bold hover:bg-brand-50 transition-colors shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Calendar size={13} />
            <span>Plan into Schedule</span>
          </button>
        </div>
      )}

      {/* Tabs Filter Bar (Section 21) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs">
        {[
          { key: 'TODAY', label: 'Today' },
          { key: 'UPCOMING', label: 'Upcoming' },
          { key: 'COMPLETED', label: 'Completed' },
          { key: 'ALL', label: 'All Tasks' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterTab === tab.key
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {tasks.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-card space-y-3.5">
          {tasks.map((task) => {
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                className="p-4 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all space-y-2.5"
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
                      className="mt-1 h-4 w-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />

                    <div>
                      <h3
                        className={`text-xs font-bold leading-snug ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h3>

                      {task.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Domain Badges: Goal, Milestone, Skill */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {task.goal && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <Target size={10} className="text-brand-600" />
                            <span>{task.goal.title}</span>
                          </span>
                        )}
                        {task.milestone && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                            <Milestone size={10} className="text-brand-600" />
                            <span>{task.milestone.title}</span>
                          </span>
                        )}
                        {task.skill && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                            <BrainCircuit size={10} />
                            <span>{task.skill.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority & Status Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        task.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : task.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {task.priority}
                    </span>

                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Footer Metrics & Actions (Section 21) */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2 border-t border-slate-200/50 text-slate-500">
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>{task.estimatedMinutes || 30} min</span>
                    </span>
                    {task.dueDate && (
                      <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isCompleted && (
                      <button
                        onClick={() => handleOpenPlanModal(task)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold text-[11px] transition-colors cursor-pointer"
                      >
                        <Calendar size={12} />
                        <span>Plan into Schedule</span>
                      </button>
                    )}

                    {task.status !== 'IN_PROGRESS' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'IN_PROGRESS' })}
                        className="px-2 py-1 rounded-lg hover:bg-slate-200/70 text-slate-600 font-semibold text-[11px] cursor-pointer"
                      >
                        Start
                      </button>
                    )}

                    {task.status !== 'BLOCKED' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'BLOCKED' })}
                        className="px-2 py-1 rounded-lg hover:bg-amber-100 text-amber-700 font-semibold text-[11px] cursor-pointer"
                      >
                        Block
                      </button>
                    )}

                    {task.status !== 'SKIPPED' && !isCompleted && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ taskId: task.id, status: 'SKIPPED' })}
                        className="px-2 py-1 rounded-lg hover:bg-slate-200 text-slate-600 font-semibold text-[11px] cursor-pointer"
                      >
                        Skip
                      </button>
                    )}

                    <button
                      onClick={() => deleteTaskMutation.mutate(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
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
        /* Empty State: Section 32 */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <CheckSquare size={28} />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Your plan has no actions yet.
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Create a task from a roadmap milestone to start connecting goals with daily practice.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-600/30 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </div>
      )}

      {/* PLAN INTO SCHEDULE MODAL (Section 28) */}
      {planningTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Plan into Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">{planningTask.title}</p>
              </div>
              <button
                onClick={() => {
                  setPlanningTask(null);
                  setScheduleSuggestion(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {planTaskMutation.isPending ? (
              <div className="py-8 flex justify-center">
                <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : scheduleSuggestion?.fits ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold">
                    <CheckCircle2 size={16} />
                    <span>Suggested Time Window</span>
                  </div>
                  <div className="text-slate-800 font-extrabold text-base">
                    Today: {scheduleSuggestion.suggestedBlock.startTime} – {scheduleSuggestion.suggestedBlock.endTime}
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    {scheduleSuggestion.reason}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setPlanningTask(null);
                      setScheduleSuggestion(null);
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => confirmScheduleBlockMutation.mutate(scheduleSuggestion.suggestedBlock)}
                    disabled={confirmScheduleBlockMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-xs"
                  >
                    {confirmScheduleBlockMutation.isPending ? 'Scheduling...' : 'Use This Time'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                <p className="font-bold">No available routine gap tonight</p>
                <p className="text-[11px] text-amber-700">
                  {scheduleSuggestion?.reason || 'Task duration exceeds tonight\'s available window.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Add Career Task</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build JWT authentication project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional context or outcome..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Minutes</label>
                  <input
                    type="number"
                    min="1"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              {/* Goal & Milestone Linkage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Link to Goal</label>
                  <select
                    value={goalId}
                    onChange={(e) => {
                      setGoalId(e.target.value);
                      setMilestoneId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white truncate"
                  >
                    <option value="">None (Independent)</option>
                    {goals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Link to Milestone</label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    disabled={!goalId || milestones.length === 0}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white disabled:bg-slate-100 truncate"
                  >
                    <option value="">None</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id}>
                        #{m.sequence} {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Skill Linkage */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Link to Skill (Optional)</label>
                <select
                  value={skillId}
                  onChange={(e) => setSkillId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="">None</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Adding...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
