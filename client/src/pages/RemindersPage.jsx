import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { EmptyState } from '../components/common/EmptyState';
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
  X,
  Loader2,
  Globe,
  PhoneCall,
  Mail,
  MessageSquare,
  ShieldCheck,
  Moon,
  Smartphone,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { reminderService } from '../services/reminderService';
import { contactService } from '../services/contactService';
import { pushNotificationService } from '../services/pushNotificationService';
import { useAuthStore } from '../store/authStore';
import {
  formatFriendlyTimezone,
  getCityOrShortTz,
  formatReminderTime,
  detectBrowserTimezone,
} from '../utils/timezones';
import { TimezonePickerModal } from '../components/common/TimezonePickerModal';
import ReminderConfigModal from '../components/reminders/ReminderConfigModal';
import SnoozeModal from '../components/reminders/SnoozeModal';
import ReminderSettingsTab from '../components/reminders/ReminderSettingsTab';

export const RemindersPage = () => {
  const { user } = useAuthStore();
  const userTimezone = user?.profile?.timezone || detectBrowserTimezone() || 'Asia/Kolkata';

  // Navigation tab state: 'UPCOMING' | 'HISTORY' | 'SETTINGS'
  const [activeTab, setActiveTab] = useState('UPCOMING');

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Modals state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [snoozeModalOpen, setSnoozeModalOpen] = useState(false);
  const [snoozeTarget, setSnoozeTarget] = useState(null);
  const [showTzPicker, setShowTzPicker] = useState(false);

  const [isPushSubscribed, setIsPushSubscribed] = useState(false);

  useEffect(() => {
    pushNotificationService.isSubscribedOnThisDevice().then(setIsPushSubscribed);
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const data = await reminderService.listReminders();
      setReminders(data.reminders || []);
    } catch (err) {
      showFeedback('Failed to load reminders from server', true);
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

  const handleCancelReminder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reminder?')) return;
    try {
      await reminderService.cancelReminder(id);
      showFeedback('Reminder cancelled');
      loadReminders();
    } catch (err) {
      showFeedback('Failed to cancel reminder', true);
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder permanently?')) return;
    try {
      await reminderService.deleteReminder(id);
      showFeedback('Reminder deleted');
      loadReminders();
    } catch (err) {
      showFeedback('Failed to delete reminder', true);
    }
  };

  const openSnooze = (reminder) => {
    setSnoozeTarget(reminder);
    setSnoozeModalOpen(true);
  };

  const openEdit = (reminder) => {
    setEditingReminder(reminder);
    setConfigModalOpen(true);
  };

  // Group upcoming reminders: Today, Tomorrow, Later
  const upcomingReminders = reminders.filter(
    (r) => r.enabled && ['PENDING', 'SNOOZED', 'PROCESSING'].includes(r.status)
  );

  const historyReminders = reminders.filter(
    (r) => !r.enabled || ['DELIVERED', 'ANSWERED', 'MISSED', 'FAILED', 'CANCELLED'].includes(r.status)
  );

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayGroup = [];
  const tomorrowGroup = [];
  const laterGroup = [];

  upcomingReminders.forEach((r) => {
    const triggerDate = r.nextTriggerAt ? new Date(r.nextTriggerAt) : r.scheduledAt ? new Date(r.scheduledAt) : null;
    if (!triggerDate || isNaN(triggerDate.getTime())) {
      todayGroup.push(r);
      return;
    }
    const dStr = triggerDate.toISOString().split('T')[0];
    if (dStr === todayStr) {
      todayGroup.push(r);
    } else if (dStr === tomorrowStr) {
      tomorrowGroup.push(r);
    } else {
      laterGroup.push(r);
    }
  });

  const renderChannelIcon = (channel) => {
    switch (channel) {
      case 'VOICE':
        return <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
      case 'PUSH':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-primary" />;
    }
  };

  const renderSourceBadge = (sourceType) => {
    const colors = {
      TASK: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      SCHEDULE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      HEALTH: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      COMMUNICATION: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      GOAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      CUSTOM: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    };
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
          colors[sourceType] || colors.CUSTOM
        }`}
      >
        {sourceType}
      </span>
    );
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ANSWERED':
      case 'DELIVERED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            {status === 'ANSWERED' ? 'Answered' : 'Delivered'}
          </span>
        );
      case 'MISSED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
            Missed
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20">
            Failed
          </span>
        );
      case 'SNOOZED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Snoozed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-500/10 text-muted-foreground border border-slate-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-primary/10 text-primary border border-primary/20">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <PageHeader
        title="Reminder Center"
        description="Centralized multi-channel alerts across tasks, schedule, health, communication, and custom routines."
        action={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTzPicker(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted/40 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{getCityOrShortTz(userTimezone)}</span>
            </button>
            <button
              onClick={() => {
                setEditingReminder(null);
                setConfigModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>New Reminder</span>
            </button>
          </div>
        }
      />

      {/* Action Feedbacks */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Tabs Layout: [ Upcoming ] [ History ] [ Settings ] */}
      <div className="flex items-center space-x-1 border-b border-border pb-1">
        {[
          { id: 'UPCOMING', label: 'Upcoming', count: upcomingReminders.length },
          { id: 'HISTORY', label: 'History', count: historyReminders.length },
          { id: 'SETTINGS', label: 'Settings', count: null },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all flex items-center space-x-2 ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. UPCOMING TAB */}
      {activeTab === 'UPCOMING' && (
        <div className="space-y-6">
          {upcomingReminders.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No upcoming reminders"
              description="Stay on track with tasks, routine practice, and health reminders."
              primaryAction={{
                label: 'Create Reminder',
                onClick: () => {
                  setEditingReminder(null);
                  setConfigModalOpen(true);
                },
              }}
            />
          ) : (
            <>
              {/* Today Section */}
              {todayGroup.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Today</span>
                    <span className="text-[11px] font-normal text-muted-foreground">({todayGroup.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {todayGroup.map((r) => (
                      <ReminderCard
                        key={r.id}
                        reminder={r}
                        onEdit={openEdit}
                        onSnooze={openSnooze}
                        onCancel={handleCancelReminder}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tomorrow Section */}
              {tomorrowGroup.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Tomorrow</span>
                    <span className="text-[11px] font-normal text-muted-foreground">({tomorrowGroup.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tomorrowGroup.map((r) => (
                      <ReminderCard
                        key={r.id}
                        reminder={r}
                        onEdit={openEdit}
                        onSnooze={openSnooze}
                        onCancel={handleCancelReminder}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Later Section */}
              {laterGroup.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Upcoming Later</span>
                    <span className="text-[11px] font-normal text-muted-foreground">({laterGroup.length})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {laterGroup.map((r) => (
                      <ReminderCard
                        key={r.id}
                        reminder={r}
                        onEdit={openEdit}
                        onSnooze={openSnooze}
                        onCancel={handleCancelReminder}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* 2. HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4">
          {historyReminders.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No reminder history yet"
              description="Past dispatched and answered alerts will appear here."
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/30 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reminder</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Scheduled Time</th>
                      <th className="px-4 py-3 font-semibold">Channel</th>
                      <th className="px-4 py-3 font-semibold">Result</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {historyReminders.map((r) => {
                      const execDate = r.completedAt || r.lastAttemptAt || r.nextTriggerAt || r.scheduledAt;
                      const dateDisplay = execDate
                        ? new Date(execDate).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : '—';

                      return (
                        <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div>
                              <p className="font-semibold text-foreground">{r.title}</p>
                              {r.statusReason && (
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                  {r.statusReason}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{renderSourceBadge(r.sourceType || 'CUSTOM')}</td>
                          <td className="px-4 py-3 text-muted-foreground font-mono">{dateDisplay}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-1.5 text-foreground">
                              {renderChannelIcon(r.channel)}
                              <span>
                                {r.channel === 'VOICE'
                                  ? 'Voice Call'
                                  : r.channel === 'EMAIL'
                                  ? 'Email'
                                  : r.channel === 'PUSH'
                                  ? 'Push'
                                  : 'In App'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{renderStatusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteReminder(r.id)}
                              className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SETTINGS TAB */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl">
          <ReminderSettingsTab onFeedback={showFeedback} />
        </div>
      )}

      {/* MODALS */}
      {configModalOpen && (
        <ReminderConfigModal
          isOpen={configModalOpen}
          initialData={editingReminder || {}}
          onClose={() => {
            setConfigModalOpen(false);
            setEditingReminder(null);
          }}
          onSaved={() => {
            loadReminders();
            showFeedback('Reminder saved successfully');
          }}
        />
      )}

      {snoozeModalOpen && snoozeTarget && (
        <SnoozeModal
          isOpen={snoozeModalOpen}
          reminder={snoozeTarget}
          onClose={() => {
            setSnoozeModalOpen(false);
            setSnoozeTarget(null);
          }}
          onSnoozed={() => {
            loadReminders();
            showFeedback('Reminder snoozed');
          }}
        />
      )}

      {showTzPicker && (
        <TimezonePickerModal
          isOpen={showTzPicker}
          onClose={() => setShowTzPicker(false)}
          currentTimezone={userTimezone}
          onSave={() => {
            setShowTzPicker(false);
            showFeedback('Timezone updated');
          }}
        />
      )}
    </div>
  );
};

// Reminder Card Sub-component
function ReminderCard({ reminder, onEdit, onSnooze, onCancel }) {
  const triggerDate = reminder.nextTriggerAt ? new Date(reminder.nextTriggerAt) : reminder.scheduledAt ? new Date(reminder.scheduledAt) : null;
  const timeDisplay = triggerDate && !isNaN(triggerDate.getTime())
    ? triggerDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : reminder.time || '—';

  const isVoice = reminder.channel === 'VOICE';

  return (
    <div className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all shadow-xs space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-bold text-foreground">{timeDisplay}</span>
            {reminder.offsetMinutes > 0 && (
              <span className="text-[11px] text-muted-foreground font-medium">
                ({reminder.offsetMinutes}m before)
              </span>
            )}
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${
              reminder.sourceType === 'HEALTH'
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : reminder.sourceType === 'COMMUNICATION'
                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                : reminder.sourceType === 'TASK'
                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                : reminder.sourceType === 'SCHEDULE'
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                : 'bg-primary/10 text-primary border-primary/20'
            }`}
          >
            {reminder.sourceType || 'CUSTOM'}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-foreground line-clamp-1">{reminder.title}</h4>
          {reminder.message && (
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{reminder.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <span className="inline-flex items-center space-x-1 text-muted-foreground">
            {isVoice ? (
              <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
            ) : reminder.channel === 'EMAIL' ? (
              <Mail className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <Bell className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{isVoice ? 'Voice Call' : reminder.channel === 'EMAIL' ? 'Email' : 'In App'}</span>
          </span>

          {reminder.status === 'SNOOZED' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-500 font-medium">
              Snoozed
            </span>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-end space-x-2 text-xs">
        <button
          type="button"
          onClick={() => onEdit(reminder)}
          className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 font-medium transition-colors"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onSnooze(reminder)}
          className="px-2.5 py-1 rounded-lg text-primary hover:bg-primary/10 font-medium transition-colors"
        >
          Snooze
        </button>
        <button
          type="button"
          onClick={() => onCancel(reminder.id)}
          className="px-2.5 py-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
