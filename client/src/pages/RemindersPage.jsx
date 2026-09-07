import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Briefcase,
  X,
  Loader2,
} from 'lucide-react';
import { reminderService } from '../services/reminderService';

const CATEGORIES = [
  { id: 'ALL', label: 'All Reminders' },
  { id: 'DAILY', label: 'Daily Reviews' },
  { id: 'WEEKLY', label: 'Weekly Reviews' },
  { id: 'OPPORTUNITY', label: 'Opportunities' },
  { id: 'CUSTOM', label: 'Custom' },
];

export const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // New/Edit form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'DAILY_CAREEROS_REVIEW',
    time: '20:00',
    dayOfWeek: null,
    recurrence: 'DAILY',
    channel: 'IN_APP',
    enabled: true,
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderService.listReminders();
      setReminders(data.reminders || []);
    } catch (err) {
      setActionError('Failed to load reminders from server');
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(''), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(''), 3000);
    }
  };

  const handleToggle = async (id, currentEnabled) => {
    try {
      const updated = await reminderService.toggleReminder(id, !currentEnabled);
      setReminders(
        reminders.map((r) => (r.id === id ? { ...r, enabled: updated.reminder.enabled } : r))
      );
      showFeedback(`Reminder ${!currentEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showFeedback('Failed to update reminder status', true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await reminderService.deleteReminder(id);
        setReminders(reminders.filter((r) => r.id !== id));
        showFeedback('Reminder deleted');
      } catch (err) {
        showFeedback('Failed to delete reminder', true);
      }
    }
  };

  const handleOpenCreate = () => {
    setEditingReminder(null);
    setFormData({
      title: '',
      message: '',
      type: 'DAILY_CAREEROS_REVIEW',
      time: '20:00',
      dayOfWeek: null,
      recurrence: 'DAILY',
      channel: 'IN_APP',
      enabled: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      message: reminder.message || '',
      type: reminder.type,
      time: reminder.time,
      dayOfWeek: reminder.dayOfWeek,
      recurrence: reminder.recurrence || 'DAILY',
      channel: reminder.channel || reminder.notificationChannel || 'IN_APP',
      enabled: reminder.enabled,
    });
    setModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        const updated = await reminderService.updateReminder(editingReminder.id, formData);
        setReminders(
          reminders.map((r) => (r.id === editingReminder.id ? updated.reminder : r))
        );
        showFeedback('Reminder updated');
      } else {
        const created = await reminderService.createReminder(formData);
        setReminders([created.reminder, ...reminders]);
        showFeedback('New reminder created');
      }
      setModalOpen(false);
    } catch (err) {
      showFeedback(err.response?.data?.message || 'Failed to save reminder', true);
    }
  };

  // Category filtering
  const filteredReminders = reminders.filter((rem) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'DAILY') {
      return (
        rem.type === 'DAILY_CAREEROS_REVIEW' ||
        rem.type === 'DAILY_CAREER_REVIEW' ||
        rem.type === 'DAILY_SHUTDOWN'
      );
    }
    if (selectedCategory === 'WEEKLY') {
      return rem.type === 'WEEKLY_CAREER_REVIEW' || rem.type === 'WEEKLY_REVIEW';
    }
    if (selectedCategory === 'OPPORTUNITY') {
      return (
        rem.type === 'OPPORTUNITY_FOLLOW_UP' ||
        rem.type === 'FREELANCE_FOLLOW_UP' ||
        rem.type === 'INTERVIEW'
      );
    }
    if (selectedCategory === 'CUSTOM') {
      return rem.type === 'CUSTOM' || rem.type === 'TASK_DUE';
    }
    return true;
  });

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum] || '';
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="text-brand-600" size={22} />
            <h1 className="text-xl font-bold text-slate-900">Career Reminders</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Stay aware without constantly checking CareerOS.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Top Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Reminders List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin text-brand-600 mr-2" size={20} />
            <span className="text-xs">Loading scheduled reminders...</span>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Clock size={32} className="mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No Reminders Found</p>
            <p className="text-xs text-slate-400">
              Create a reminder to build daily and weekly consistency without manual check-ins.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReminders.map((rem) => (
              <div
                key={rem.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-900">{rem.title}</span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {rem.channel || 'IN_APP'}
                    </span>
                    <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      {rem.recurrence || 'DAILY'}
                    </span>
                  </div>

                  {rem.message && (
                    <p className="text-xs text-slate-500">{rem.message}</p>
                  )}

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                    <Clock size={12} />
                    <span>Time: {rem.time}</span>
                    {rem.dayOfWeek !== null && rem.dayOfWeek !== undefined && (
                      <span>({getDayName(rem.dayOfWeek)})</span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span>Timezone: {rem.timezone || 'UTC'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggle(rem.id, rem.enabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      rem.enabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {rem.enabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(rem)}
                    title="Edit Reminder"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(rem.id)}
                    title="Delete Reminder"
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Create/Edit Reminder */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-900">
                {editingReminder ? 'Edit Reminder' : 'New Career Reminder'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reminder Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Daily Career Focus"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message (Optional)</label>
                <textarea
                  rows="2"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g. Take 15 minutes to review progress and select tomorrow's main focus."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="DAILY_CAREEROS_REVIEW">Daily Check-in</option>
                    <option value="DAILY_SHUTDOWN">Daily Shutdown</option>
                    <option value="WEEKLY_CAREER_REVIEW">Weekly Review</option>
                    <option value="TASK_DUE">Task Due</option>
                    <option value="OPPORTUNITY_FOLLOW_UP">Opportunity Follow-up</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time (24h format)</label>
                  <input
                    type="text"
                    required
                    placeholder="20:00"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="ONCE">Once</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="IN_APP">In App Only</option>
                    <option value="EMAIL">In App + Email</option>
                  </select>
                </div>
              </div>

              {formData.recurrence === 'WEEKLY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Day of Week</label>
                  <select
                    value={formData.dayOfWeek !== null ? formData.dayOfWeek : 0}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white"
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
