import React, { useState, useEffect } from 'react';
import {
  X,
  Bell,
  Mail,
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { reminderService } from '../../services/reminderService';
import { contactService } from '../../services/contactService';
import PhoneVerificationModal from './PhoneVerificationModal';

export default function ReminderConfigModal({
  isOpen,
  onClose,
  onSaved,
  initialData = {},
  sourceType = 'CUSTOM',
  sourceId = null,
  linkedTaskId = null,
  linkedScheduleBlockId = null,
  title = 'Configure Reminder',
}) {
  const [reminderTitle, setReminderTitle] = useState(initialData.title || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [offsetMinutes, setOffsetMinutes] = useState(initialData.offsetMinutes !== undefined ? initialData.offsetMinutes : 0);
  const [customOffset, setCustomOffset] = useState('');
  const [isCustomOffset, setIsCustomOffset] = useState(false);
  const [channel, setChannel] = useState(initialData.channel || 'IN_APP');
  const [fallbackToInApp, setFallbackToInApp] = useState(initialData.fallbackToInApp !== false);

  // Phone status state
  const [phoneContact, setPhoneContact] = useState(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingSettings, setFetchingSettings] = useState(false);
  const [error, setError] = useState('');

  // Preset offsets
  const offsetOptions = [
    { label: 'At scheduled time', value: 0 },
    { label: '5 minutes before', value: 5 },
    { label: '10 minutes before', value: 10 },
    { label: '15 minutes before', value: 15 },
    { label: '30 minutes before', value: 30 },
    { label: '1 hour before', value: 60 },
    { label: '1 day before', value: 1440 },
    { label: 'Custom', value: 'custom' },
  ];

  // Initialize date/time and load phone settings
  useEffect(() => {
    if (!isOpen) return;

    setError('');
    setReminderTitle(initialData.title || '');
    setChannel(initialData.channel || 'IN_APP');
    setFallbackToInApp(initialData.fallbackToInApp !== false);

    // Date & Time initial values
    let initDate = '';
    let initTime = '';

    if (initialData.scheduledAt) {
      const d = new Date(initialData.scheduledAt);
      if (!isNaN(d.getTime())) {
        initDate = d.toISOString().split('T')[0];
        initTime = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    } else if (initialData.date) {
      initDate = initialData.date;
      initTime = initialData.startTime || '09:00';
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      initDate = tomorrow.toISOString().split('T')[0];
      initTime = '09:00';
    }

    setDate(initDate);
    setTime(initTime);

    const curOffset = initialData.offsetMinutes !== undefined ? initialData.offsetMinutes : 10;
    const isPredefined = [0, 5, 10, 15, 30, 60, 1440].includes(curOffset);
    if (isPredefined) {
      setOffsetMinutes(curOffset);
      setIsCustomOffset(false);
    } else {
      setOffsetMinutes('custom');
      setIsCustomOffset(true);
      setCustomOffset(String(curOffset));
    }

    // Fetch user phone contact status
    setFetchingSettings(true);
    contactService
      .getPhoneContact()
      .then((res) => {
        setPhoneVerified(Boolean(res.phoneVerified));
        setPhoneContact(res.phoneContact || null);
      })
      .catch((err) => {
        console.error('Failed to load phone contact:', err);
      })
      .finally(() => {
        setFetchingSettings(false);
      });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleOffsetChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomOffset(true);
      setOffsetMinutes('custom');
    } else {
      setIsCustomOffset(false);
      setOffsetMinutes(Number(val));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!reminderTitle.trim()) {
      setError('Reminder title is required');
      return;
    }

    if (channel === 'VOICE' && !phoneVerified) {
      setError('Please verify your phone number before enabling voice reminders.');
      return;
    }

    const finalOffset = isCustomOffset ? parseInt(customOffset, 10) || 0 : Number(offsetMinutes);

    // Calculate scheduledAt in UTC
    let scheduledAt = null;
    if (date && time) {
      const [h, m] = time.split(':').map(Number);
      const localDate = new Date(`${date}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
      if (!isNaN(localDate.getTime())) {
        scheduledAt = localDate.toISOString();
      }
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: reminderTitle.trim(),
        sourceType: initialData.sourceType || sourceType || 'CUSTOM',
        sourceId: initialData.sourceId || sourceId || null,
        linkedTaskId: initialData.linkedTaskId || linkedTaskId || null,
        linkedScheduleBlockId: initialData.linkedScheduleBlockId || linkedScheduleBlockId || null,
        scheduledAt,
        offsetMinutes: finalOffset,
        channel,
        fallbackToInApp: channel === 'VOICE' ? fallbackToInApp : true,
        phoneContactId: phoneContact?.id || null,
      };

      let saved;
      if (initialData.id) {
        saved = await reminderService.updateReminder(initialData.id, payload);
      } else {
        saved = await reminderService.createReminder(payload);
      }

      if (onSaved) onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full sm:max-w-md bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground">Automated multi-channel alerts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Reminder Title</label>
              <input
                type="text"
                placeholder="e.g. Java Problem Solving session"
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>

            {/* When (Date & Time) */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">When</label>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="relative">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
                <div className="relative">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Remind me dropdown */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Remind me</label>
              <select
                value={isCustomOffset ? 'custom' : offsetMinutes}
                onChange={handleOffsetChange}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
              >
                {offsetOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {isCustomOffset && (
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    placeholder="Minutes before"
                    value={customOffset}
                    onChange={(e) => setCustomOffset(e.target.value)}
                    autoFocus
                    className="w-32 px-3 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                  />
                  <span className="text-xs text-muted-foreground">minutes before</span>
                </div>
              )}
            </div>

            {/* Channels Selection */}
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">Notify me by</label>
              <div className="space-y-2">
                {/* In-App */}
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reminder_channel"
                    value="IN_APP"
                    checked={channel === 'IN_APP'}
                    onChange={() => setChannel('IN_APP')}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">In-app notification</span>
                    <p className="text-[11px] text-muted-foreground">Notification bell and in-app alert</p>
                  </div>
                </label>

                {/* Email */}
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reminder_channel"
                    value="EMAIL"
                    checked={channel === 'EMAIL'}
                    onChange={() => setChannel('EMAIL')}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-foreground">Email notification</span>
                    <p className="text-[11px] text-muted-foreground">Delivered to your account email</p>
                  </div>
                </label>

                {/* Voice Call */}
                <label className="flex items-center space-x-3 p-2.5 rounded-xl border border-border bg-background hover:bg-muted/20 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="reminder_channel"
                    value="VOICE"
                    checked={channel === 'VOICE'}
                    onChange={() => setChannel('VOICE')}
                    className="text-primary focus:ring-primary"
                  />
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-medium text-foreground">Voice call</span>
                      {phoneVerified && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Automated phone call with Text-to-Speech reminder</p>
                  </div>
                </label>
              </div>
            </div>

            {/* If Voice Call Selected */}
            {channel === 'VOICE' && (
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-3 animate-fade-in">
                {phoneVerified && phoneContact ? (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Delivery Phone Number</span>
                      <button
                        type="button"
                        onClick={() => setShowVerificationModal(true)}
                        className="text-primary hover:underline text-[11px]"
                      >
                        Change number
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-foreground px-2.5 py-1 bg-background border border-border rounded-lg">
                        {phoneContact.maskedValue}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-500 flex items-center space-x-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Verify your phone number to enable voice reminders.</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowVerificationModal(true)}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl transition-all shadow-xs"
                    >
                      Verify Number
                    </button>
                  </div>
                )}

                {/* Fallback to In-App */}
                <label className="flex items-center space-x-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fallbackToInApp}
                    onChange={(e) => setFallbackToInApp(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-foreground">
                    Send an in-app notification if the call fails or is missed
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 flex justify-end space-x-3 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (channel === 'VOICE' && !phoneVerified)}
                className="px-5 py-2 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Reminder</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {showVerificationModal && (
        <PhoneVerificationModal
          isOpen={showVerificationModal}
          currentMaskedPhone={phoneContact?.maskedValue}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={(verifiedContact) => {
            setPhoneContact(verifiedContact);
            setPhoneVerified(true);
            setShowVerificationModal(false);
          }}
        />
      )}
    </>
  );
}
