import React, { useState } from 'react';
import { Bell, PhoneCall, Clock, Mail, MessageSquare } from 'lucide-react';
import SnoozeModal from './SnoozeModal';

export default function ReminderBadge({ reminder, onSnoozed, onClick }) {
  const [showSnooze, setShowSnooze] = useState(false);

  if (!reminder || reminder.enabled === false) return null;

  // Channel icon
  const getIcon = () => {
    switch (reminder.channel) {
      case 'VOICE':
        return <PhoneCall className="w-3 h-3 text-emerald-500" />;
      case 'EMAIL':
        return <Mail className="w-3 h-3 text-blue-500" />;
      case 'PUSH':
        return <MessageSquare className="w-3 h-3 text-purple-500" />;
      default:
        return <Bell className="w-3 h-3 text-primary" />;
    }
  };

  // Human readable indicator label
  const getLabel = () => {
    if (reminder.status === 'SNOOZED') {
      return 'Snoozed';
    }

    if (reminder.offsetMinutes !== undefined && reminder.offsetMinutes !== null && reminder.offsetMinutes > 0) {
      if (reminder.offsetMinutes === 60) return '1h before';
      if (reminder.offsetMinutes === 1440) return '1d before';
      return `${reminder.offsetMinutes}m before`;
    }

    if (reminder.scheduledAt || reminder.nextTriggerAt) {
      const d = new Date(reminder.nextTriggerAt || reminder.scheduledAt);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      }
    }

    if (reminder.time) {
      return reminder.time;
    }

    return 'Active';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(reminder);
    } else {
      setShowSnooze(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={`Reminder: ${reminder.channel === 'VOICE' ? 'Voice Call' : 'In-App'} (${getLabel()}). Click to snooze.`}
        className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors shadow-2xs"
      >
        {getIcon()}
        <span>{getLabel()}</span>
      </button>

      {showSnooze && (
        <SnoozeModal
          isOpen={showSnooze}
          onClose={() => setShowSnooze(false)}
          reminder={reminder}
          onSnoozed={(id, mins) => {
            if (onSnoozed) onSnoozed(id, mins);
            setShowSnooze(false);
          }}
        />
      )}
    </>
  );
}
