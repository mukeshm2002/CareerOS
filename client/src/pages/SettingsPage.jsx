import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Sliders,
  Calendar,
  Bell,
  Shield,
  Palette,
  Key,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Loader2,
  Smartphone,
  Laptop,
  Download,
  Trash2,
  Send,
  Info,
  Check,
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { pushNotificationService } from '../services/pushNotificationService';
import { pwaService } from '../services/pwaService';
import { useAuthStore } from '../store/authStore';
import { applyTheme } from '../utils/theme';
import { formatFriendlyTimezone, detectBrowserTimezone } from '../utils/timezones';
import { TimezonePickerModal } from '../components/common/TimezonePickerModal';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Career Preferences', icon: Sliders },
  { id: 'schedule', label: 'Schedule Routine', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Auth', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account', icon: Key },
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showTzPicker, setShowTzPicker] = useState(false);

  const { user, updateUser, clearAuth } = useAuthStore();

  // Settings state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    currentRole: '',
    targetRole: '',
    targetSalary: '',
    experienceLevel: 'MID_LEVEL',
    currentSituation: 'WORKING_PROFESSIONAL',
    timezone: 'Asia/Kolkata',
    country: '',
    bio: '',
  });

  const [preferences, setPreferences] = useState({
    defaultFocusMinutes: 25,
    weeklyCareerMinutesTarget: 600,
    preferredDays: 'MON,TUE,WED,THU,FRI',
    preferredStartTime: '09:00',
    preferredEndTime: '18:00',
    defaultCurrency: 'USD',
    defaultOpportunityPriority: 'HIGH',
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    dailyReviewReminderEnabled: true,
    dailyReviewReminderTime: '20:00',
    careerReviewReminderEnabled: true,
    careerReviewReminderTime: '08:00',
    weeklyReviewReminderEnabled: true,
    weeklyReviewDay: 0,
    weeklyReviewTime: '20:00',
    opportunityFollowUpReminderEnabled: true,
    taskDueReminderEnabled: true,
    theme: 'SYSTEM',
  });

  const [securityData, setSecurityData] = useState({
    activeSessions: 1,
    lastLoginAt: null,
  });

  // Push & PWA state (Phase 2B Step 2)
  const [pushStatus, setPushStatus] = useState({
    supported: false,
    permission: 'default',
    isSubscribedLocally: false,
    subscriptionCount: 0,
  });
  const [pushDevices, setPushDevices] = useState([]);
  const [pushLoading, setPushLoading] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadSettings();
    loadPushData();

    setIsPwaInstalled(pwaService.isStandalone());
    const unsubInstall = pwaService.onInstallChange((can) => {
      setCanInstallPwa(can);
    });

    return () => {
      unsubInstall();
    };
  }, []);

  const loadPushData = async () => {
    try {
      const supported = pushNotificationService.isSupported();
      const permission = pushNotificationService.getPermission();
      const isSubscribedLocally = await pushNotificationService.isSubscribedOnThisDevice();
      let statusRes = null;
      let devicesRes = null;

      if (supported) {
        statusRes = await pushNotificationService.getStatus().catch(() => null);
        devicesRes = await pushNotificationService.listSubscriptions().catch(() => null);
      }

      setPushStatus({
        supported,
        permission,
        isSubscribedLocally,
        subscriptionCount: statusRes?.data?.subscriptionCount || 0,
      });

      if (devicesRes?.data) {
        setPushDevices(devicesRes.data);
      }
    } catch (err) {
      console.warn('[PUSH] Failed loading push data:', err);
    }
  };

  const handleEnablePush = async () => {
    try {
      setPushLoading(true);
      await pushNotificationService.subscribe();
      showNotification('Push notifications enabled on this device');
      await loadPushData();
    } catch (err) {
      if (err.code === 'PERMISSION_DENIED') {
        showNotification('Notifications blocked in browser settings. Enable them in site settings.', true);
      } else {
        showNotification(err.message || 'Failed to enable push notifications', true);
      }
      await loadPushData();
    } finally {
      setPushLoading(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      setPushLoading(true);
      await pushNotificationService.unsubscribe();
      showNotification('Push notifications disabled on this device');
      await loadPushData();
    } catch (err) {
      showNotification('Failed to disable push notifications', true);
    } finally {
      setPushLoading(false);
    }
  };

  const handleSendTestPush = async () => {
    try {
      setPushLoading(true);
      await pushNotificationService.sendTestNotification();
      showNotification('Test notification sent! Check your notification center.');
    } catch (err) {
      showNotification('Failed to send test push notification', true);
    } finally {
      setPushLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId) => {
    try {
      setPushLoading(true);
      await pushNotificationService.deleteSubscription(deviceId);
      showNotification('Device removed');
      await loadPushData();
    } catch (err) {
      showNotification('Failed to remove device', true);
    } finally {
      setPushLoading(false);
    }
  };

  const handleInstallPwa = async () => {
    const result = await pwaService.promptInstall();
    if (result.outcome === 'accepted') {
      showNotification('CareerOS added to home screen!');
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSettings();
      if (data.profile) {
        setProfile((prev) => ({
          ...prev,
          ...data.profile,
          firstName: data.profile.firstName || '',
          lastName: data.profile.lastName || '',
          displayName: data.profile.displayName || data.user?.fullName || '',
          targetRole: data.profile.targetRole || '',
          targetSalary: data.profile.targetSalary || '',
          country: data.profile.country || '',
          timezone: data.profile.timezone || 'Asia/Kolkata',
        }));
      }
      if (data.preferences) {
        setPreferences((prev) => ({
          ...prev,
          ...data.preferences,
        }));
        if (data.preferences.theme) {
          applyTheme(data.preferences.theme);
        }
      }
      if (data.security) {
        setSecurityData(data.security);
      }
    } catch (err) {
      setSaveError('Failed to load settings from server');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, isErr = false) => {
    if (isErr) {
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 4000);
    } else {
      setSaveSuccess(msg);
      setTimeout(() => setSaveSuccess(''), 3000);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const updated = await settingsService.updateProfile(profile);
      updateUser({
        ...user,
        fullName: profile.displayName || `${profile.firstName} ${profile.lastName}`.trim() || user.fullName,
        profile: updated.profile || profile,
      });
      localStorage.setItem('careeros_tz_explicit', 'true');
      showNotification('Profile updated successfully');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update profile', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updatePreferences(preferences);
      showNotification('Career preferences saved');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save preferences', true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await settingsService.updateNotifications(preferences);
      showNotification('Notification settings updated');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update notifications', true);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('New passwords do not match', true);
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showNotification('New password must be at least 8 characters long', true);
      return;
    }

    try {
      setSaving(true);
      await settingsService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showNotification('Password changed. All other sessions have been logged out.');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Password update failed', true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm('Are you sure you want to log out from all sessions? You will be returned to the login screen.')) {
      try {
        await settingsService.logoutAll();
        clearAuth();
        window.location.href = '/login';
      } catch (err) {
        showNotification('Failed to revoke sessions', true);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="animate-spin text-brand-600 mr-2" size={24} />
        <span className="text-sm font-medium">Loading workspace settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="text-[#6C5CE7] dark:text-[#8B7CF6]" size={22} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC]">Workspace Settings</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
          Configure personal profile, career preferences, notification reminders, and security credentials.
        </p>
      </div>

      {/* Notifications banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-[#22C55E]/10 border border-emerald-200 dark:border-[#22C55E]/30 text-emerald-800 dark:text-[#22C55E] text-xs px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="shrink-0 text-[#16A34A] dark:text-[#22C55E]" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-[#EF4444]/10 border border-red-200 dark:border-[#EF4444]/30 text-red-800 dark:text-[#F87171] text-xs px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="shrink-0 text-[#EF4444] dark:text-[#F87171]" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation Sidebar */}
        <div className="w-full md:w-56 shrink-0 space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#F0EEFF] dark:bg-[#211D3A] text-[#6C5CE7] dark:text-[#8B7CF6] border border-[#6C5CE7]/30 dark:border-[#8B7CF6]/30 shadow-xs'
                    : 'text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#172033] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#6C5CE7] dark:text-[#8B7CF6]' : 'text-slate-400 dark:text-[#64748B]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#243044] p-6 shadow-card">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] border-b border-slate-100 dark:border-[#243044] pb-2">
                Personal & Career Identity
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={profile.displayName}
                  onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                  placeholder="e.g. Alex Hunter"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Role</label>
                  <input
                    type="text"
                    value={profile.currentRole || ''}
                    onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Role</label>
                  <input
                    type="text"
                    value={profile.targetRole || ''}
                    onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                    placeholder="e.g. Senior Backend Architect"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Salary / Rate</label>
                  <input
                    type="text"
                    value={profile.targetSalary || ''}
                    onChange={(e) => setProfile({ ...profile, targetSalary: e.target.value })}
                    placeholder="e.g. $140,000 / yr"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                    Timezone
                  </label>
                  <div className="p-3 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {formatFriendlyTimezone(profile.timezone || 'Asia/Kolkata')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                        Used for reminders, schedules and daily planning.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTzPicker(true)}
                      className="px-3 py-1.5 bg-[#7C6CF2]/10 hover:bg-[#7C6CF2]/15 text-[#7C6CF2] dark:text-[#A99CFF] rounded-lg text-xs font-semibold transition shrink-0"
                    >
                      Change timezone
                    </button>
                  </div>
                </div>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country / Region</label>
                <input
                  type="text"
                  value={profile.country || ''}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  placeholder="e.g. United States, India, Germany"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PREFERENCES */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSavePreferences} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Career Planning & Focus Defaults
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Focus Session (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="240"
                    value={preferences.defaultFocusMinutes}
                    onChange={(e) => setPreferences({ ...preferences, defaultFocusMinutes: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Weekly Career Target (Minutes)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={preferences.weeklyCareerMinutesTarget}
                    onChange={(e) => setPreferences({ ...preferences, weeklyCareerMinutesTarget: parseInt(e.target.value, 10) })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Start Time</label>
                  <input
                    type="text"
                    placeholder="09:00"
                    value={preferences.preferredStartTime || ''}
                    onChange={(e) => setPreferences({ ...preferences, preferredStartTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred End Time</label>
                  <input
                    type="text"
                    placeholder="18:00"
                    value={preferences.preferredEndTime || ''}
                    onChange={(e) => setPreferences({ ...preferences, preferredEndTime: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
                  <select
                    value={preferences.defaultCurrency}
                    onChange={(e) => setPreferences({ ...preferences, defaultCurrency: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="CAD">CAD ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Opportunity Priority</label>
                  <select
                    value={preferences.defaultOpportunityPriority}
                    onChange={(e) => setPreferences({ ...preferences, defaultOpportunityPriority: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Career Preferences'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Daily Routine & Rhythm Overview
              </h2>
              <p className="text-xs text-slate-500">
                Configure your daily energy windows. CareerOS schedules focused sessions around these parameters.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">Wake Time</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">{profile.wakeTime || '06:00'}</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">Work Energy Window</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">
                    {profile.workStartTime || '09:00'} - {profile.workEndTime || '18:00'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">Personal Career Window</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">
                    {profile.personalStartTime || '19:00'} - {profile.personalEndTime || '21:00'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-xs font-bold text-slate-800">Sleep Time</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">{profile.sleepTime || '23:00'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Notification Delivery & Check-in Reminders
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Email Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive transactional review and task reminders via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailNotificationsEnabled}
                    onChange={(e) => setPreferences({ ...preferences, emailNotificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">In-App Notifications</p>
                    <p className="text-[11px] text-slate-500">Show notification items and count in top header</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.inAppNotificationsEnabled}
                    onChange={(e) => setPreferences({ ...preferences, inAppNotificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Push Notifications</p>
                    <p className="text-[11px] text-slate-500">Receive browser alerts for focus check-ins and due tasks</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.pushNotificationsEnabled}
                    onChange={(e) => setPreferences({ ...preferences, pushNotificationsEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Daily Review Reminder</p>
                      <p className="text-[11px] text-slate-500">Prompt to complete your daily shutdown and tomorrow plan</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.dailyReviewReminderEnabled}
                      onChange={(e) => setPreferences({ ...preferences, dailyReviewReminderEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  {preferences.dailyReviewReminderEnabled && (
                    <div className="flex items-center gap-2 pt-1">
                      <Clock size={14} className="text-slate-400" />
                      <span className="text-xs text-slate-600">Reminder Time:</span>
                      <input
                        type="text"
                        value={preferences.dailyReviewReminderTime || '20:00'}
                        onChange={(e) => setPreferences({ ...preferences, dailyReviewReminderTime: e.target.value })}
                        className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 w-24"
                      />
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Weekly Review Reminder</p>
                      <p className="text-[11px] text-slate-500">Scheduled prompt to reflect and freeze weekly metrics snapshot</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyReviewReminderEnabled}
                      onChange={(e) => setPreferences({ ...preferences, weeklyReviewReminderEnabled: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                  </div>
                  {preferences.weeklyReviewReminderEnabled && (
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600">Day:</span>
                        <select
                          value={preferences.weeklyReviewDay}
                          onChange={(e) => setPreferences({ ...preferences, weeklyReviewDay: parseInt(e.target.value, 10) })}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                        >
                          <option value="0">Sunday</option>
                          <option value="1">Monday</option>
                          <option value="5">Friday</option>
                          <option value="6">Saturday</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs text-slate-600">Time:</span>
                        <input
                          type="text"
                          value={preferences.weeklyReviewTime || '20:00'}
                          onChange={(e) => setPreferences({ ...preferences, weeklyReviewTime: e.target.value })}
                          className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 w-20"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <Save size={15} />
                  <span>{saving ? 'Saving...' : 'Save Notification Settings'}</span>
                </button>
              </div>

              {/* Push Device Management & Testing (Phase 2B Step 2) */}
              <div className="pt-5 border-t border-slate-200 dark:border-[#28324A] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-[#7C6CF2] dark:text-[#8B7CF6]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">Push Notifications on This Device</h3>
                  </div>
                  <span className={`self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    !pushStatus.supported
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      : pushStatus.permission === 'denied'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                      : pushStatus.isSubscribedLocally
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-[#181F34] dark:text-[#94A3B8]'
                  }`}>
                    {!pushStatus.supported
                      ? 'Not Supported'
                      : pushStatus.permission === 'denied'
                      ? 'Blocked in Browser'
                      : pushStatus.isSubscribedLocally
                      ? 'Enabled on this device'
                      : 'Not enabled'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                  Push notifications depend on OS/browser notification permissions and delivery policies.
                  They provide timely check-in prompts even when CareerOS is inactive.
                </p>

                {pushStatus.permission === 'denied' && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl text-xs text-rose-700 dark:text-rose-400 flex items-start gap-2">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>Notifications blocked in browser settings. Please click the site settings or padlock icon in your browser address bar to allow notifications for CareerOS.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {pushStatus.isSubscribedLocally ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSendTestPush}
                        disabled={pushLoading}
                        className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#181F34] dark:hover:bg-[#28324A] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Send size={13} />
                        <span>{pushLoading ? 'Sending...' : 'Send Test Notification'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDisablePush}
                        disabled={pushLoading}
                        className="h-9 px-3.5 rounded-xl bg-white dark:bg-[#121829] border border-slate-200 dark:border-[#28324A] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 dark:text-[#94A3B8] text-xs font-semibold transition disabled:opacity-50"
                      >
                        <span>Disable on this device</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushLoading || !pushStatus.supported || pushStatus.permission === 'denied'}
                      className="h-9 px-4 rounded-xl bg-[#7C6CF2] hover:bg-[#6C5CE7] text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                    >
                      <Bell size={13} />
                      <span>{pushLoading ? 'Enabling...' : 'Enable Push Notifications'}</span>
                    </button>
                  )}
                </div>

                {/* Registered Devices List */}
                {pushDevices.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-[#CBD5E1] uppercase tracking-wider">
                      Notification Devices ({pushDevices.length})
                    </h4>
                    <div className="space-y-2">
                      {pushDevices.map((device) => (
                        <div key={device.id} className="p-3 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Laptop size={15} className="text-slate-500 dark:text-[#94A3B8] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">{device.deviceLabel}</p>
                              <p className="text-[10px] text-slate-400 dark:text-[#64748B]">
                                Registered {new Date(device.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDevice(device.id)}
                            className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold p-1 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PWA Home Screen Installation (Phase 2B Step 2) */}
              <div className="pt-5 border-t border-slate-200 dark:border-[#28324A] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Download size={16} className="text-[#7C6CF2] dark:text-[#8B7CF6]" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">App Installation</h3>
                  </div>
                  {isPwaInstalled ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Check size={11} />
                      <span>CareerOS is installed</span>
                    </span>
                  ) : null}
                </div>

                {isPwaInstalled ? (
                  <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                    CareerOS is installed on your device. You are running in standalone app mode.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">Install CareerOS</p>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        Add CareerOS to your home screen for faster access and standalone app experience.
                      </p>
                    </div>
                    {canInstallPwa ? (
                      <button
                        type="button"
                        onClick={handleInstallPwa}
                        className="h-9 px-4 rounded-xl bg-[#7C6CF2] hover:bg-[#6C5CE7] text-white text-xs font-semibold shrink-0 transition"
                      >
                        Install
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-[#64748B] font-medium">
                        Use your browser's "Add to Home Screen" option
                      </span>
                    )}
                  </div>
                )}
              </div>
            </form>
          )}

          {/* TAB 5: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Change Password
                </h2>
                <p className="text-xs text-slate-500">
                  Changing your password invalidates all existing login sessions across devices.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">New Password (8+ chars)</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Key size={15} />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-900">Active Login Sessions</h3>
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      Active Refresh Tokens: <span className="text-brand-600">{securityData.activeSessions}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Last Login: {securityData.lastLoginAt ? new Date(securityData.lastLoginAt).toLocaleString() : 'Just now'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoutAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Sign Out Everywhere</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Interface Appearance
              </h2>
              <p className="text-xs text-slate-500">
                Choose your visual theme preference for CareerOS.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {['LIGHT', 'DARK', 'SYSTEM'].map((themeName) => (
                  <button
                    key={themeName}
                    type="button"
                    onClick={async () => {
                      applyTheme(themeName);
                      localStorage.setItem('careeros_theme', themeName);
                      setPreferences({ ...preferences, theme: themeName });
                      await settingsService.updatePreferences({ theme: themeName });
                      showNotification(`Theme set to ${themeName}`);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      preferences.theme === themeName
                        ? 'border-[#6C5CE7] dark:border-[#8B7CF6] bg-[#F0EEFF] dark:bg-[#211D3A] ring-1 ring-[#6C5CE7] dark:ring-[#8B7CF6] text-[#6C5CE7] dark:text-[#8B7CF6]'
                        : 'border-slate-200 dark:border-[#243044] hover:bg-slate-50 dark:hover:bg-[#172033] text-slate-700 dark:text-[#CBD5E1]'
                    }`}
                  >
                    <p className="text-xs font-bold">{themeName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                      {themeName === 'SYSTEM'
                        ? 'Follow operating system theme'
                        : `${themeName.charAt(0) + themeName.slice(1).toLowerCase()} color scheme`}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: ACCOUNT */}
          {activeTab === 'account' && (
            <div className="space-y-5">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Account Details & Retention Policy
              </h2>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Account ID / Primary Email</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.email}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Workspace Role</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{user?.role || 'USER'}</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-[11px] text-slate-400 font-semibold uppercase">Member Since</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800">Account Deletion Policy</h3>
                <p className="text-xs text-slate-500 mt-1">
                  CareerOS preserves historical focus sessions, weekly review snapshots, and evidence records to maintain factual career integrity. Full self-service account deletion will be available after v1.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timezone Searchable Picker */}
      <TimezonePickerModal
        isOpen={showTzPicker}
        onClose={() => setShowTzPicker(false)}
        selectedTimezone={profile.timezone}
        onSelect={(newTz) => {
          setProfile((prev) => ({ ...prev, timezone: newTz }));
          localStorage.setItem('careeros_tz_explicit', 'true');
        }}
      />
    </div>
  );
};
