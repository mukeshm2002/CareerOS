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
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { useAuthStore } from '../store/authStore';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Career Preferences', icon: Sliders },
  { id: 'schedule', label: 'Schedule Routine', icon: Calendar },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security & Auth', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'account', label: 'Account', icon: Key },
];

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
];

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

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

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

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
          <Settings className="text-brand-600" size={22} />
          <h1 className="text-xl font-bold text-slate-900">Workspace Settings</h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure personal profile, career preferences, notification reminders, and security credentials.
        </p>
      </div>

      {/* Notifications banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-xl">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-xl">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
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
                    ? 'bg-brand-50 text-brand-700 border border-brand-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IANA Timezone</label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-500"
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
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
                      setPreferences({ ...preferences, theme: themeName });
                      await settingsService.updatePreferences({ theme: themeName });
                      showNotification(`Theme set to ${themeName}`);
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      preferences.theme === themeName
                        ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500 text-brand-900'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <p className="text-xs font-bold">{themeName}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
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
    </div>
  );
};
