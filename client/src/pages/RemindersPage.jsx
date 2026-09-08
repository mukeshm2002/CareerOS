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
  Globe,
} from 'lucide-react';
import { reminderService } from '../services/reminderService';
import { useAuthStore } from '../store/authStore';
import { TIMEZONE_OPTIONS } from '../utils/timezones';

const CATEGORIES = [
  { id: 'ALL', label: 'All Reminders' },
  { id: 'DAILY', label: 'Daily Reviews' },
  { id: 'WEEKLY', label: 'Weekly Reviews' },
  { id: 'OPPORTUNITY', label: 'Opportunities' },
  { id: 'CUSTOM', label: 'Custom' },
];

export const RemindersPage = () => {
  const { user } = useAuthStore();
  const userTimezone = user?.profile?.timezone || 'Asia/Kolkata';

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
    timezone: userTimezone,
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
      timezone: user?.profile?.timezone || 'Asia/Kolkata',
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
      timezone: reminder.timezone || user?.profile?.timezone || 'Asia/Kolkata',
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

  const activeCount = reminders.filter((r) => r.enabled).length;
  const dailyCount = reminders.filter((r) => r.recurrence === 'DAILY').length;
  const emailCount = reminders.filter(
    (r) => r.channel === 'EMAIL' || r.notificationChannel === 'EMAIL'
  ).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(124,108,242,0.12)] border border-[rgba(124,108,242,0.24)] text-[#7C6CF2] dark:text-[#8B7CF6] flex items-center justify-center shrink-0">
              <Bell size={22} className="stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] leading-none">
              Career Reminders
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-[#94A3B8] pl-0.5">
            Stay aware without constantly checking CareerOS.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-[#7C6CF2] hover:bg-[#8B7CF6] text-white rounded-xl font-semibold text-xs sm:text-sm transition-all duration-180 shadow-md shadow-[#7C6CF2]/20 active:scale-[0.98] shrink-0"
        >
          <Plus size={16} className="stroke-[2.4]" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Factual Summary Row */}
      {!loading && reminders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-[#131A2A] border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] rounded-xl p-3.5 sm:p-4 shadow-xs">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-[#94A3B8]">Active Reminders</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">{activeCount}</p>
          </div>
          <div className="bg-white dark:bg-[#131A2A] border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] rounded-xl p-3.5 sm:p-4 shadow-xs">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-[#94A3B8]">Daily Cadence</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">{dailyCount}</p>
          </div>
          <div className="bg-white dark:bg-[#131A2A] border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] rounded-xl p-3.5 sm:p-4 shadow-xs">
            <p className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-[#94A3B8]">Email Enabled</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] mt-0.5">{emailCount}</p>
          </div>
        </div>
      )}

      {/* Feedback Alerts */}
      {actionSuccess && (
        <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-[rgba(52,211,153,0.10)] border border-emerald-200 dark:border-[rgba(52,211,153,0.25)] text-emerald-800 dark:text-[#34D399] text-xs px-4 py-3 rounded-xl animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 dark:text-[#34D399] shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-2.5 bg-rose-50 dark:bg-[rgba(251,113,133,0.10)] border border-rose-200 dark:border-[rgba(251,113,133,0.25)] text-rose-800 dark:text-[#FB7185] text-xs px-4 py-3 rounded-xl animate-in fade-in duration-150">
          <AlertCircle size={16} className="text-rose-600 dark:text-[#FB7185] shrink-0" />
          <span className="font-medium">{actionError}</span>
        </div>
      )}

      {/* Top Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-[rgba(148,163,184,0.12)] pb-2 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'text-[#7C6CF2] dark:text-[#FFFFFF] bg-[#7C6CF2]/10 dark:bg-[rgba(124,108,242,0.14)] border border-[#7C6CF2]/20 dark:border-[rgba(124,108,242,0.30)] shadow-xs'
                  : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#E2E8F0] hover:bg-slate-100 dark:hover:bg-[rgba(255,255,255,0.035)] border border-transparent'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white dark:bg-[#131A2A] rounded-2xl border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] p-12 text-center text-slate-400 dark:text-[#94A3B8]">
            <Loader2 className="animate-spin text-[#7C6CF2] mx-auto mb-2.5" size={24} />
            <span className="text-xs font-medium">Loading scheduled reminders...</span>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="bg-white dark:bg-[#131A2A] rounded-2xl border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] p-10 text-center space-y-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.18)]">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#192235] text-slate-400 dark:text-[#94A3B8] mx-auto flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">No Reminders Found</p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] max-w-sm mx-auto mt-1">
                Create a reminder to build daily and weekly consistency without manual check-ins.
              </p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[rgba(124,108,242,0.12)] hover:bg-[rgba(124,108,242,0.20)] text-[#7C6CF2] dark:text-[#A99CFF] border border-[rgba(124,108,242,0.25)] rounded-xl text-xs font-semibold transition"
            >
              <Plus size={14} />
              <span>Create your first reminder</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-white dark:bg-[#131A2A] rounded-2xl border border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-[rgba(148,163,184,0.25)] transition-all duration-180 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-slate-900 dark:text-[#F8FAFC] leading-snug">
                      {rem.title}
                    </h3>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[rgba(255,255,255,0.05)] text-slate-600 dark:text-[#CBD5E1] border border-slate-200 dark:border-[rgba(148,163,184,0.14)]">
                      {rem.channel || 'IN_APP'}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-[#7C6CF2]/10 dark:bg-[rgba(124,108,242,0.14)] text-[#7C6CF2] dark:text-[#A99CFF] border border-[#7C6CF2]/20 dark:border-[rgba(124,108,242,0.30)]">
                      {rem.recurrence || 'DAILY'}
                    </span>
                  </div>

                  {rem.message && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      {rem.message}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-[#64748B] pt-0.5">
                    <span className="inline-flex items-center gap-1 text-[#7C6CF2] dark:text-[#8B7CF6]/90 font-medium">
                      <Clock size={12} />
                      <span>{rem.time}</span>
                    </span>
                    {rem.dayOfWeek !== null && rem.dayOfWeek !== undefined && (
                      <span>({getDayName(rem.dayOfWeek)})</span>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Globe size={11} className="text-slate-400 dark:text-[#64748B]" />
                      <span>{rem.timezone || 'UTC'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleToggle(rem.id, rem.enabled)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all min-h-[36px] min-w-[50px] flex items-center justify-center ${
                      rem.enabled
                        ? 'bg-emerald-50 dark:bg-[rgba(52,211,153,0.10)] text-emerald-700 dark:text-[#34D399] border border-emerald-200 dark:border-[rgba(52,211,153,0.25)] hover:bg-emerald-100 dark:hover:bg-[rgba(52,211,153,0.18)]'
                        : 'bg-slate-100 dark:bg-[rgba(255,255,255,0.04)] text-slate-500 dark:text-[#64748B] border border-slate-200 dark:border-[rgba(148,163,184,0.10)] hover:bg-slate-200 dark:hover:bg-[rgba(255,255,255,0.08)]'
                    }`}
                  >
                    {rem.enabled ? 'ON' : 'OFF'}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(rem)}
                    title="Edit Reminder"
                    className="h-9 w-9 flex items-center justify-center text-slate-400 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#192235] rounded-xl transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(rem.id)}
                    title="Delete Reminder"
                    className="h-9 w-9 flex items-center justify-center text-slate-400 dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-[#FB7185] hover:bg-rose-50 dark:hover:bg-[rgba(251,113,133,0.12)] rounded-xl transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#111827] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[rgba(148,163,184,0.14)] shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Mobile Grab Bar */}
            <div className="sm:hidden -mt-1 pb-1 flex justify-center">
              <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[rgba(148,163,184,0.14)] pb-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                {editingReminder ? 'Edit Reminder' : 'New Career Reminder'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#192235] transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Reminder Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Daily Career Focus"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                  Message (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="e.g. Take 15 minutes to review progress and select tomorrow's main focus."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Category</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
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
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Time (24h format)</label>
                  <input
                    type="text"
                    required
                    placeholder="20:00"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Recurrence</label>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="ONCE">Once</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Delivery Channel</label>
                  <select
                    value={formData.channel}
                    onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                  >
                    <option value="IN_APP">In App Only</option>
                    <option value="EMAIL">In App + Email</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Reminder Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
                >
                  {!TIMEZONE_OPTIONS.some((tz) => tz.value === formData.timezone) && formData.timezone && (
                    <option value={formData.timezone}>{formData.timezone} (Custom)</option>
                  )}
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 dark:text-[#64748B] mt-1">
                  Defaults to your profile timezone (<span className="font-semibold text-slate-600 dark:text-[#CBD5E1]">{user?.profile?.timezone || 'Asia/Kolkata'}</span>).
                </p>
              </div>

              {formData.recurrence === 'WEEKLY' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">Day of Week</label>
                  <select
                    value={formData.dayOfWeek !== null ? formData.dayOfWeek : 0}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2]"
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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[rgba(148,163,184,0.14)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs font-semibold text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#192235] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#7C6CF2] hover:bg-[#8B7CF6] text-white rounded-xl text-xs font-semibold transition shadow-md shadow-[#7C6CF2]/20"
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
