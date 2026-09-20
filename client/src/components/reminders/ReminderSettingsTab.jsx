import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  PhoneCall,
  Mail,
  Smartphone,
  Moon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from 'lucide-react';
import { reminderService } from '../../services/reminderService';
import PhoneVerificationModal from './PhoneVerificationModal';

export const ReminderSettingsTab = ({ onFeedback }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  const [settings, setSettings] = useState({
    defaultTaskReminderOffset: 10,
    defaultScheduleReminderOffset: 0,
    voiceRemindersEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    fallbackNotificationEnabled: true,
    inAppNotificationsEnabled: true,
    emailNotificationsEnabled: false,
    pushNotificationsEnabled: false,
    phoneVerified: false,
    phoneContact: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await reminderService.getSettings();
      setSettings((prev) => ({
        ...prev,
        ...data,
        ...data.preferences,
        phoneVerified: Boolean(data.phoneVerified),
        phoneContact: data.phoneContact || null,
      }));
    } catch (err) {
      console.error('Failed to load reminder settings:', err);
      if (onFeedback) onFeedback('Failed to load reminder settings', true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      await reminderService.updateSettings({
        defaultTaskReminderOffset: Number(settings.defaultTaskReminderOffset),
        defaultScheduleReminderOffset: Number(settings.defaultScheduleReminderOffset),
        voiceRemindersEnabled: Boolean(settings.voiceRemindersEnabled),
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
        fallbackNotificationEnabled: Boolean(settings.fallbackNotificationEnabled),
        inAppNotificationsEnabled: Boolean(settings.inAppNotificationsEnabled),
        emailNotificationsEnabled: Boolean(settings.emailNotificationsEnabled),
        pushNotificationsEnabled: Boolean(settings.pushNotificationsEnabled),
      });
      if (onFeedback) {
        onFeedback('Reminder settings saved successfully');
      }
    } catch (err) {
      if (onFeedback) {
        onFeedback(err.message || 'Failed to save settings', true);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-primary" />
        <span className="text-xs font-medium">Loading reminder settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSaveSettings} className="space-y-6">
      {/* 1. DEFAULT REMINDERS */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">DEFAULT REMINDERS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Default task reminder
            </label>
            <select
              value={settings.defaultTaskReminderOffset}
              onChange={(e) =>
                setSettings({ ...settings, defaultTaskReminderOffset: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="0">At scheduled time</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Default schedule reminder
            </label>
            <select
              value={settings.defaultScheduleReminderOffset}
              onChange={(e) =>
                setSettings({ ...settings, defaultScheduleReminderOffset: parseInt(e.target.value, 10) })
              }
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            >
              <option value="0">At scheduled time</option>
              <option value="5">5 minutes before</option>
              <option value="10">10 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. CHANNELS */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">CHANNELS</h3>
        </div>

        <div className="space-y-3">
          {/* In-app */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center space-x-3">
              <Bell className="w-4 h-4 text-primary" />
              <div>
                <span className="text-xs font-semibold text-foreground">In-app</span>
                <p className="text-[11px] text-muted-foreground">In-app notifications banner and bell tray</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.inAppNotificationsEnabled}
              onChange={(e) =>
                setSettings({ ...settings, inAppNotificationsEnabled: e.target.checked })
              }
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
          </div>

          {/* Email */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-xs font-semibold text-foreground">Email</span>
                <p className="text-[11px] text-muted-foreground">Email dispatch for upcoming scheduled events</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotificationsEnabled}
              onChange={(e) =>
                setSettings({ ...settings, emailNotificationsEnabled: e.target.checked })
              }
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
          </div>

          {/* Voice Call */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-foreground">Voice Call</span>
                  {settings.phoneVerified ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                      Requires Phone Verification
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">Automated Text-to-Speech outbound phone reminders</p>
              </div>
            </div>
            <input
              type="checkbox"
              disabled={!settings.phoneVerified}
              checked={settings.voiceRemindersEnabled && settings.phoneVerified}
              onChange={(e) =>
                setSettings({ ...settings, voiceRemindersEnabled: e.target.checked })
              }
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 disabled:opacity-40"
            />
          </div>
        </div>
      </div>

      {/* 3. VOICE REMINDERS */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-border pb-3">
          <PhoneCall className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-foreground">VOICE REMINDERS</h3>
        </div>

        {/* Phone row */}
        <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">Phone</span>
            <button
              type="button"
              onClick={() => setVerificationModalOpen(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              {settings.phoneContact ? 'Change number' : 'Verify number'}
            </button>
          </div>

          {settings.phoneContact ? (
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-foreground px-2.5 py-1 bg-muted/40 border border-border rounded-lg">
                {settings.phoneContact.maskedValue}
              </span>
              {settings.phoneVerified ? (
                <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Unverified</span>
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <span>Verify your phone number to enable voice reminders.</span>
              <button
                type="button"
                onClick={() => setVerificationModalOpen(true)}
                className="self-start sm:self-auto px-3 py-1.5 bg-primary text-white font-medium rounded-xl text-xs hover:bg-primary-hover shadow-xs transition"
              >
                Verify Number
              </button>
            </div>
          )}
        </div>

        {/* Quiet Hours */}
        <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
          <div className="flex items-center space-x-2">
            <Moon className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Quiet Hours</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Voice calls during quiet hours are automatically suppressed and redirected to in-app notifications.
          </p>
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="time"
              value={settings.quietHoursStart}
              onChange={(e) => setSettings({ ...settings, quietHoursStart: e.target.value })}
              className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="time"
              value={settings.quietHoursEnd}
              onChange={(e) => setSettings({ ...settings, quietHoursEnd: e.target.value })}
              className="px-3 py-1.5 bg-card border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
            />
          </div>
        </div>

        {/* Fallback notification */}
        <label className="flex items-center space-x-2.5 p-3 rounded-xl bg-background border border-border cursor-pointer">
          <input
            type="checkbox"
            checked={settings.fallbackNotificationEnabled}
            onChange={(e) => setSettings({ ...settings, fallbackNotificationEnabled: e.target.checked })}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <div>
            <span className="text-xs font-medium text-foreground">Fallback notification</span>
            <p className="text-[11px] text-muted-foreground">
              Send an in-app notification if a voice reminder call is missed, unanswered, or suppressed
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Saving...' : 'Save Reminder Settings'}</span>
        </button>
      </div>

      {verificationModalOpen && (
        <PhoneVerificationModal
          isOpen={verificationModalOpen}
          currentMaskedPhone={settings.phoneContact?.maskedValue}
          onClose={() => setVerificationModalOpen(false)}
          onSuccess={(contact) => {
            setSettings((prev) => ({
              ...prev,
              phoneContact: contact,
              phoneVerified: true,
              voiceRemindersEnabled: true,
            }));
            setVerificationModalOpen(false);
            if (onFeedback) onFeedback('Phone number verified successfully! Voice reminders enabled.');
          }}
        />
      )}
    </form>
  );
};

export default ReminderSettingsTab;
