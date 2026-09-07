import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../features/planning/services/planningService';
import { useAuthStore } from '../store/authStore';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  CheckSquare,
  Target,
  X,
} from 'lucide-react';

export const SchedulePage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // Date state: formatted YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('20:10');
  const [endTime, setEndTime] = useState('21:30');
  const [category, setCategory] = useState('CAREEROS');
  const [taskId, setTaskId] = useState('');
  const [overlapWarning, setOverlapWarning] = useState(null);

  // Query Schedule Blocks for selected date
  const { data: scheduleData, isLoading } = useQuery({
    queryKey: ['schedule', selectedDate],
    queryFn: () => planningService.getScheduleBlocks({ date: selectedDate }),
  });
  const blocks = scheduleData?.data?.blocks || [];

  // Query pending tasks for linking
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', 'TODO'],
    queryFn: () => planningService.getTasks({ status: 'TODO' }),
  });
  const tasks = tasksData?.data?.tasks || [];

  // Mutations
  const createBlockMutation = useMutation({
    mutationFn: (data) => planningService.createScheduleBlock(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedDate] });
      if (res?.data?.hasOverlap) {
        setOverlapWarning(res?.data?.overlapWarning);
      } else {
        setOverlapWarning(null);
      }
      resetForm();
    },
  });

  const updateBlockMutation = useMutation({
    mutationFn: ({ id, data }) => planningService.updateScheduleBlock(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedDate] });
      resetForm();
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id) => planningService.deleteScheduleBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', selectedDate] });
    },
  });

  const resetForm = () => {
    setShowAddModal(false);
    setEditingBlock(null);
    setTitle('');
    setStartTime('20:10');
    setEndTime('21:30');
    setCategory('CAREEROS');
    setTaskId('');
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setOverlapWarning(null);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
    setOverlapWarning(null);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setOverlapWarning(null);
  };

  const handleEditClick = (b) => {
    setEditingBlock(b);
    setTitle(b.title);
    setStartTime(b.startTime);
    setEndTime(b.endTime);
    setCategory(b.category);
    setTaskId(b.taskId || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingBlock) {
      updateBlockMutation.mutate({
        id: editingBlock.id,
        data: {
          title,
          startTime,
          endTime,
          category,
          taskId: taskId || null,
        },
      });
    } else {
      createBlockMutation.mutate({
        title,
        date: selectedDate,
        startTime,
        endTime,
        category,
        taskId: taskId || null,
      });
    }
  };

  // Routine fallback blocks from UserProfile if no custom blocks scheduled
  const userProfile = user?.profile;
  const timezone = userProfile?.timezone || 'UTC';

  const formattedDateHeader = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isCurrentDay = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header (Section 27) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="text-brand-600" size={22} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SCHEDULE</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Plan career growth around your real life. Timezone: <span className="font-semibold text-slate-700">{timezone}</span>
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-brand-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Block</span>
        </button>
      </div>

      {/* Day Selector & Navigation (Section 27) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-slate-800">
            {formattedDateHeader} {isCurrentDay && <span className="text-brand-600 font-extrabold ml-1">(Today)</span>}
          </span>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          onClick={handleToday}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Overlap Warning Banner (Section 25) */}
      {overlapWarning && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <span>{overlapWarning}</span>
        </div>
      )}

      {/* Daily Timeline View (Section 27) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-card space-y-4">
        {blocks.length > 0 ? (
          <div className="space-y-3">
            {blocks.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 hover:border-slate-300 transition-all"
              >
                {/* Time range column */}
                <div className="w-28 shrink-0 font-mono text-xs font-bold text-slate-700 pt-0.5">
                  {b.startTime} – {b.endTime}
                </div>

                {/* Block Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{b.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        b.category === 'CAREEROS'
                          ? 'bg-brand-50 text-brand-700 border border-brand-200'
                          : b.category === 'WORK'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.category === 'PERSONAL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {b.category}
                    </span>
                  </div>

                  {b.description && (
                    <p className="text-[11px] text-slate-500">{b.description}</p>
                  )}

                  {/* Linked Domain Entities */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500">
                    {b.task && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <CheckSquare size={11} className="text-brand-600" />
                        <span>Task: {b.task.title}</span>
                      </span>
                    )}
                    {b.goal && (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Target size={11} className="text-brand-600" />
                        <span>Goal: {b.goal.title}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Block Actions */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5">
                  <button
                    onClick={() => handleEditClick(b)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => deleteBlockMutation.mutate(b.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State (Section 32) */
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Clock size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">
                No career work planned for this day.
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Schedule protected focus blocks around your work and personal commitments.
              </p>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold hover:bg-brand-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Plan a Task</span>
            </button>
          </div>
        )}
      </div>

      {/* ADD / EDIT BLOCK MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingBlock ? 'Edit Schedule Block' : 'Add Schedule Block'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Block Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Build JWT authentication project"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Time (HH:MM) *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Time (HH:MM) *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="CAREEROS">CAREEROS</option>
                  <option value="WORK">WORK</option>
                  <option value="STUDY">STUDY</option>
                  <option value="PERSONAL">PERSONAL</option>
                  <option value="LEARNING">LEARNING</option>
                  <option value="PROJECT">PROJECT</option>
                  <option value="FREELANCE">FREELANCE</option>
                  <option value="INTERVIEW">INTERVIEW</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assign to Task (Optional)</label>
                <select
                  value={taskId}
                  onChange={(e) => {
                    setTaskId(e.target.value);
                    const selected = tasks.find((t) => t.id === e.target.value);
                    if (selected && !title) setTitle(selected.title);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white truncate"
                >
                  <option value="">None (Routine or standalone)</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({t.estimatedMinutes}m)
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
                  disabled={createBlockMutation.isPending || updateBlockMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {editingBlock ? 'Save Changes' : 'Create Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
