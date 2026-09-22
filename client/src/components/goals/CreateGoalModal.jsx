import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Flag,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ListTodo,
  Milestone,
  RotateCw,
  Sliders,
  Sparkles,
} from 'lucide-react';

const AREAS = [
  { id: 'CAREER', label: 'Career' },
  { id: 'EDUCATION', label: 'Education' },
  { id: 'SKILLS', label: 'Skills' },
  { id: 'LEARNING', label: 'Learning' },
  { id: 'COMMUNICATION', label: 'Communication' },
  { id: 'HEALTH_AND_FITNESS', label: 'Health & Fitness' },
  { id: 'FINANCE', label: 'Finance' },
  { id: 'PERSONAL_GROWTH', label: 'Personal Growth' },
  { id: 'RELATIONSHIPS', label: 'Relationships' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'CREATIVE', label: 'Creative' },
  { id: 'LIFESTYLE', label: 'Lifestyle' },
  { id: 'OTHER', label: 'Other' },
];

const TRACKING_METHODS = [
  {
    id: 'MILESTONES',
    label: 'Milestones',
    desc: 'Break goal into phases & roadmap milestones',
    icon: Milestone,
  },
  {
    id: 'TASKS',
    label: 'Tasks',
    desc: 'Progress updates automatically as tasks are completed',
    icon: ListTodo,
  },
  {
    id: 'NUMBER_TARGET',
    label: 'Number / Target',
    desc: 'Track a numeric target (e.g., ₹1,00,000, 24 books, 100 km)',
    icon: TrendingUp,
  },
  {
    id: 'ROUTINE',
    label: 'Routine / Consistency',
    desc: 'Track recurring frequency (e.g. 4 days every week)',
    icon: RotateCw,
  },
  {
    id: 'MANUAL',
    label: 'Manual Progress',
    desc: 'Manually adjust progress percentage (0–100%)',
    icon: Sliders,
  },
];

const COMMON_UNITS = ['₹', '$', 'books', 'hours', 'km', 'kg', 'pages', 'sessions', 'applications'];

export const CreateGoalModal = ({ isOpen, onClose, initialArea = 'CAREER', onGoalCreated }) => {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(initialArea);
  const [customArea, setCustomArea] = useState('');
  const [why, setWhy] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [trackingMethod, setTrackingMethod] = useState('MILESTONES');

  // Conditional fields for NUMBER_TARGET
  const [startValue, setStartValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('₹');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnit, setCustomUnit] = useState('');

  // Conditional fields for ROUTINE
  const [routineFrequency, setRoutineFrequency] = useState(4);
  const [routinePeriod, setRoutinePeriod] = useState('WEEK');

  // Conditional fields for MANUAL
  const [manualProgress, setManualProgress] = useState(0);

  // Dates & Priority
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hasTargetDate, setHasTargetDate] = useState(true);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState('MEDIUM');
  const [status, setStatus] = useState('ACTIVE');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialArea) {
        const found = AREAS.find((a) => a.id === initialArea || a.id.toLowerCase() === initialArea.toLowerCase());
        setArea(found ? found.id : 'CAREER');
      }
    }
  }, [isOpen, initialArea]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please specify what you want to achieve.');
      return;
    }

    if (area === 'OTHER' && !customArea.trim()) {
      setError('Please specify your custom area.');
      return;
    }

    const payload = {
      title: title.trim(),
      area,
      customArea: area === 'OTHER' ? customArea.trim() : undefined,
      why: why.trim() || undefined,
      desiredOutcome: desiredOutcome.trim() || undefined,
      trackingMethod,
      startDate: startDate || undefined,
      targetDate: hasTargetDate && targetDate ? targetDate : null,
      priority,
      status,
    };

    if (trackingMethod === 'NUMBER_TARGET') {
      const parsedTarget = Number(targetValue);
      if (targetValue === '' || isNaN(parsedTarget)) {
        setError('Please enter a valid numeric target value.');
        return;
      }
      const selectedUnit = isCustomUnit ? customUnit.trim() : unit;
      if (!selectedUnit) {
        setError('Please select or specify a unit of measurement.');
        return;
      }
      payload.startValue = Number(startValue) || 0;
      payload.currentValue = currentValue !== '' ? Number(currentValue) : payload.startValue;
      payload.targetValue = parsedTarget;
      payload.unit = selectedUnit;
    } else if (trackingMethod === 'ROUTINE') {
      payload.routineFrequency = Number(routineFrequency) || 1;
      payload.routinePeriod = routinePeriod;
    } else if (trackingMethod === 'MANUAL') {
      payload.manualProgress = Number(manualProgress) || 0;
    }

    try {
      setLoading(true);
      await onGoalCreated(payload);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1E293B]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80]">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">Create a Goal</h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">Simple by default. Powerful when needed.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-[#F87171] text-xs">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Goal Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              What do you want to achieve? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Improve English communication, Save ₹1,00,000, Learn React"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B] focus:ring-1 focus:ring-[#2A7A3B]"
              autoFocus
            />
          </div>

          {/* Area Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1.5">
              Which area does this goal belong to? <span className="text-red-500">*</span>
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
            >
              {AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            {area === 'OTHER' && (
              <div className="mt-2">
                <input
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="Specify custom area..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
                />
              </div>
            )}
          </div>

          {/* Why it matters (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              Why does this matter to you? <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">What makes this goal important?</p>
            <textarea
              rows={2}
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="e.g., I want to communicate confidently in professional and everyday situations."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
            />
          </div>

          {/* What would success look like? (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
              What would success look like? <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">Describe your desired outcome</p>
            <input
              type="text"
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              placeholder="e.g., I can confidently hold a 20-minute conversation in English."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
            />
          </div>

          {/* Tracking Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-2">
              How will you track progress? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TRACKING_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = trackingMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setTrackingMethod(method.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2A7A3B] bg-emerald-50/50 dark:bg-[#2A7A3B]/10 text-slate-900 dark:text-[#F8FAFC]'
                        : 'border-slate-200 dark:border-[#263247] hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-[#94A3B8]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg mt-0.5 ${
                        isSelected
                          ? 'bg-[#2A7A3B] text-white'
                          : 'bg-slate-100 dark:bg-[#161E2D] text-slate-500'
                      }`}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight">{method.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#94A3B8] leading-normal mt-0.5">
                        {method.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Tracking Fields */}
          {trackingMethod === 'NUMBER_TARGET' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">Numeric Target Settings</div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Starting</label>
                  <input
                    type="number"
                    value={startValue}
                    onChange={(e) => setStartValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Current</label>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Target <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Unit <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {COMMON_UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => {
                        setUnit(u);
                        setIsCustomUnit(false);
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                        !isCustomUnit && unit === u
                          ? 'bg-[#2A7A3B] text-white'
                          : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#263247]'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCustomUnit(true)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      isCustomUnit
                        ? 'bg-[#2A7A3B] text-white'
                        : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-[#263247]'
                    }`}
                  >
                    Custom
                  </button>
                </div>
                {isCustomUnit && (
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    placeholder="e.g., articles, pull-ups, leads"
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                  />
                )}
              </div>
            </div>
          )}

          {trackingMethod === 'ROUTINE' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] space-y-2">
              <div className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">Routine Frequency</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-[#94A3B8]">Repeat</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={routineFrequency}
                  onChange={(e) => setRoutineFrequency(e.target.value)}
                  className="w-16 px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs font-semibold text-center"
                />
                <span className="text-xs text-slate-600 dark:text-[#94A3B8]">times per</span>
                <select
                  value={routinePeriod}
                  onChange={(e) => setRoutinePeriod(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                >
                  <option value="DAY">Day</option>
                  <option value="WEEK">Week</option>
                  <option value="MONTH">Month</option>
                </select>
              </div>
            </div>
          )}

          {trackingMethod === 'MANUAL' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">Initial Progress</span>
                <span className="font-bold text-[#2A7A3B]">{manualProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualProgress}
                onChange={(e) => setManualProgress(e.target.value)}
                className="w-full accent-[#2A7A3B]"
              />
            </div>
          )}

          {/* Dates & Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">
                  Target Date
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hasTargetDate}
                    onChange={(e) => setHasTargetDate(!e.target.checked)}
                    className="rounded text-[#2A7A3B] focus:ring-[#2A7A3B]"
                  />
                  <span>No deadline</span>
                </label>
              </div>
              {hasTargetDate ? (
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC]"
                />
              ) : (
                <div className="px-3 py-2 bg-slate-100 dark:bg-[#161E2D]/50 border border-dashed border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-400">
                  Open-ended / No target date
                </div>
              )}
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs"
              >
                <option value="ACTIVE">Active</option>
                <option value="PLANNED">Planned</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1E293B]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#161E2D] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-[#2A7A3B]/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
