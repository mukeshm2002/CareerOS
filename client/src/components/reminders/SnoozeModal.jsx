import React, { useState } from 'react';
import { X, Clock, Loader2 } from 'lucide-react';
import { reminderService } from '../../services/reminderService';

export default function SnoozeModal({ isOpen, onClose, reminder, onSnoozed }) {
  const [selectedMinutes, setSelectedMinutes] = useState(10);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !reminder) return null;

  const quickOptions = [
    { label: '5 min', value: 5 },
    { label: '10 min', value: 10 },
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hour', value: 60 },
  ];

  const handleSnooze = async () => {
    const mins = isCustom ? parseInt(customMinutes, 10) : selectedMinutes;
    if (!mins || mins <= 0) {
      setError('Please enter a valid number of minutes');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await reminderService.snoozeReminder(reminder.id, mins);
      if (onSnoozed) onSnoozed(reminder.id, mins);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to snooze reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-sm bg-card border border-border sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Snooze Reminder</h3>
              <p className="text-xs text-muted-foreground line-clamp-1">{reminder.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}

          <div className="grid grid-cols-3 gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setIsCustom(false);
                  setSelectedMinutes(opt.value);
                }}
                className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                  !isCustom && selectedMinutes === opt.value
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-border bg-background text-foreground hover:bg-muted/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsCustom(true)}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                isCustom
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-border bg-background text-foreground hover:bg-muted/40'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustom && (
            <div className="pt-1">
              <label className="block text-xs font-medium text-foreground mb-1">Minutes to snooze</label>
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="e.g. 45"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              />
            </div>
          )}

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSnooze}
              disabled={loading || (isCustom && !customMinutes)}
              className="px-4 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-sm transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm Snooze</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
