import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Target,
  Milestone,
  ListTodo,
  TrendingUp,
  RotateCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const GOAL_AREAS = [
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
    icon: Milestone,
    explanation: 'Break this goal into stages. You can build your roadmap after creating it.',
  },
  {
    id: 'TASKS',
    label: 'Tasks',
    icon: ListTodo,
    explanation: 'Track progress as linked tasks are completed. You can add tasks after creating the goal.',
  },
  {
    id: 'NUMBER_TARGET',
    label: 'Target',
    icon: TrendingUp,
    explanation: 'Track progress toward a measurable number.',
  },
  {
    id: 'ROUTINE',
    label: 'Routine',
    icon: RotateCw,
    explanation: 'Track a repeated action over time.',
  },
  {
    id: 'MANUAL',
    label: 'Manual',
    icon: Sliders,
    explanation: 'Update your progress percentage yourself.',
  },
];

const COMMON_UNITS = ['₹', '$', 'books', 'hours', 'km', 'kg', 'pages', 'sessions'];

export const CreateGoalModal = ({ isOpen, onClose, initialArea = 'CAREER', onGoalCreated }) => {
  const [title, setTitle] = useState('');
  const [area, setArea] = useState(initialArea);
  const [customArea, setCustomArea] = useState('');
  
  // Progressive disclosure for purpose & success
  const [showDetails, setShowDetails] = useState(false);
  const [why, setWhy] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');

  // Tracking method selection (defaults to null if not forced, but initialized safely)
  const [trackingMethod, setTrackingMethod] = useState('MILESTONES');

  // Conditional fields for NUMBER_TARGET
  const [startValue, setStartValue] = useState('0');
  const [currentValue, setCurrentValue] = useState('0');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('₹');
  const [customUnit, setCustomUnit] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  // Conditional fields for ROUTINE
  const [routineFrequency, setRoutineFrequency] = useState('4');
  const [routinePeriod, setRoutinePeriod] = useState('WEEK');

  // Conditional fields for MANUAL
  const [manualProgress, setManualProgress] = useState(0);

  // Dates & Priority
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [hasTargetDate, setHasTargetDate] = useState(true);
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const titleInputRef = useRef(null);

  // Autofocus title field on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Reset or preset area if initialArea changes
  useEffect(() => {
    if (initialArea) {
      setArea(initialArea);
    }
  }, [initialArea]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Enter a goal title.');
      titleInputRef.current?.focus();
      return;
    }

    if (!area) {
      setError('Choose an area.');
      return;
    }

    if (area === 'OTHER' && !customArea.trim()) {
      setError('Enter your custom area.');
      return;
    }

    if (!trackingMethod) {
      setError('Choose how you want to track progress.');
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
      status: 'ACTIVE',
    };

    if (trackingMethod === 'NUMBER_TARGET') {
      const parsedTarget = Number(targetValue);
      if (targetValue === '' || isNaN(parsedTarget)) {
        setError('Enter a valid target number.');
        return;
      }
      const selectedUnit = isCustomUnit ? customUnit.trim() : unit;
      if (!selectedUnit) {
        setError('Choose or specify a unit of measurement.');
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

  const selectedMethodObj = TRACKING_METHODS.find((m) => m.id === trackingMethod);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-goal-title"
    >
      <div className="relative w-full max-w-[680px] bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#263247] shadow-xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* COMPACT HEADER */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-slate-100 dark:border-[#1E293B] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80]">
              <Target size={16} />
            </div>
            <div>
              <h2 id="create-goal-title" className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Create a Goal
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Start simple. You can add details later.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC] rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="mx-5 sm:mx-6 mt-3.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-[#F87171] text-xs shrink-0">
            {error}
          </div>
        )}

        {/* SCROLLABLE FORM CONTENT WITH VERTICAL COMPACTION */}
        <form id="create-goal-form" onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* 1. PRIMARY GOAL FIELD */}
          <div>
            <label htmlFor="goal-title-input" className="block font-semibold text-slate-800 dark:text-[#F8FAFC] mb-1 text-xs">
              What do you want to achieve? <span className="text-red-500">*</span>
            </label>
            <input
              id="goal-title-input"
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Improve my English communication"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] placeholder:text-slate-400 focus:outline-none focus:border-[#2A7A3B] focus:ring-1 focus:ring-[#2A7A3B]"
            />
          </div>

          {/* 2. AREA FIELD */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="goal-area-select" className="font-semibold text-slate-800 dark:text-[#F8FAFC] text-xs">
                Area <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                Choose where this goal belongs
              </span>
            </div>
            <select
              id="goal-area-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
            >
              {GOAL_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>

            {/* CONDITIONAL CUSTOM AREA */}
            {area === 'OTHER' && (
              <div className="mt-2">
                <label htmlFor="goal-custom-area" className="block font-medium text-slate-700 dark:text-[#CBD5E1] mb-1 text-[11px]">
                  Custom area <span className="text-red-500">*</span>
                </label>
                <input
                  id="goal-custom-area"
                  type="text"
                  value={customArea}
                  onChange={(e) => setCustomArea(e.target.value)}
                  placeholder="e.g. Sustainability, Mindfulness"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                />
              </div>
            )}
          </div>

          {/* 3. PROGRESSIVE DISCLOSURE: PURPOSE & SUCCESS */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2A7A3B] dark:text-[#4ADE80] hover:underline cursor-pointer"
            >
              <span>{showDetails ? '− Hide purpose & success details' : '+ Add purpose & success details'}</span>
              {showDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {showDetails && (
              <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/80 dark:border-[#263247] space-y-3">
                <div>
                  <label htmlFor="goal-why-input" className="block font-medium text-slate-700 dark:text-[#CBD5E1] mb-0.5 text-xs">
                    Why does this matter?
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1">
                    What makes this goal important?
                  </p>
                  <textarea
                    id="goal-why-input"
                    rows={2}
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="e.g. It helps me express ideas clearly and speak confidently in interviews."
                    className="w-full px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
                  />
                </div>

                <div>
                  <label htmlFor="goal-outcome-input" className="block font-medium text-slate-700 dark:text-[#CBD5E1] mb-0.5 text-xs">
                    What would success look like?
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1">
                    Describe the outcome you want to reach.
                  </p>
                  <textarea
                    id="goal-outcome-input"
                    rows={2}
                    value={desiredOutcome}
                    onChange={(e) => setDesiredOutcome(e.target.value)}
                    placeholder="e.g. I can hold a 20-minute conversation in English with ease."
                    className="w-full px-3 py-2 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 4. TRACKING METHOD (COMPACT SELECTABLE PILLS) */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-[#F8FAFC] mb-1.5 text-xs">
              How do you want to track progress? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {TRACKING_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = trackingMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setTrackingMethod(method.id)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#2A7A3B] bg-[#2A7A3B]/10 text-[#2A7A3B] dark:text-[#4ADE80] font-bold shadow-xs'
                        : 'border-slate-200 dark:border-[#263247] bg-white dark:bg-[#161E2D] text-slate-600 dark:text-[#94A3B8] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <Icon size={14} className={isSelected ? 'text-[#2A7A3B] dark:text-[#4ADE80]' : 'text-slate-400'} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>

            {/* SINGLE CONTEXTUAL EXPLANATION (NO DUPLICATE HELPER) */}
            {selectedMethodObj && (
              <div className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-2 px-0.5 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">{selectedMethodObj.label}: </span>
                {selectedMethodObj.explanation}
              </div>
            )}
          </div>

          {/* 5. CONDITIONAL TRACKING FIELDS (ONLY RELEVANT INPUTS REVEALED) */}
          {trackingMethod === 'NUMBER_TARGET' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Starting value</label>
                  <input
                    type="number"
                    value={startValue}
                    onChange={(e) => {
                      setStartValue(e.target.value);
                      if (currentValue === startValue) setCurrentValue(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Target value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  {isCustomUnit ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="Unit name"
                        className="w-full px-2 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomUnit(false)}
                        className="px-2 py-1 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  ) : (
                    <select
                      value={unit}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setIsCustomUnit(true);
                        } else {
                          setUnit(e.target.value);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-[#263247] rounded-lg text-xs"
                    >
                      {COMMON_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                      <option value="CUSTOM">+ Custom unit</option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {trackingMethod === 'ROUTINE' && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247]">
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
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700 dark:text-[#CBD5E1]">Starting progress</span>
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

          {/* 6. DATES (START + TARGET SIDE BY SIDE) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label htmlFor="goal-start-date" className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1 text-xs">
                Start date
              </label>
              <input
                id="goal-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="goal-target-date" className="font-semibold text-slate-700 dark:text-[#CBD5E1] text-xs">
                  Target date
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
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
                  id="goal-target-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#161E2D] border border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-800 dark:text-[#F8FAFC]"
                />
              ) : (
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-[#161E2D]/50 border border-dashed border-slate-200 dark:border-[#263247] rounded-xl text-xs text-slate-400">
                  No deadline
                </div>
              )}
            </div>
          </div>

          {/* 7. PRIORITY SEGMENTED CONTROL */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-[#CBD5E1] mb-1 text-xs">
              Priority
            </label>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-[#161E2D] rounded-xl border border-slate-200/60 dark:border-[#263247]">
              {[
                { id: 'LOW', label: 'Low' },
                { id: 'MEDIUM', label: 'Medium' },
                { id: 'HIGH', label: 'High' },
              ].map((p) => {
                const isSelected = priority === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPriority(p.id)}
                    className={`px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-[#CBD5E1]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
        </form>

        {/* STICKY FOOTER (ALWAYS VISIBLE) */}
        <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-[#1E293B] bg-slate-50/80 dark:bg-[#111827]/80 backdrop-blur-xs shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#161E2D] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="create-goal-form"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-[#2A7A3B] hover:bg-[#22653A] text-white rounded-xl font-semibold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating...' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};
