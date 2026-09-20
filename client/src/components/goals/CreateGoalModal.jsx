import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronDown,
  Check,
  Briefcase,
  MessageSquare,
  Activity,
  Sparkles,
  Calendar,
  Clock,
  Bell,
  CheckCircle2,
  ArrowRight,
  Plus,
} from 'lucide-react';

const AREA_OPTIONS = [
  {
    id: 'CAREER',
    title: 'Career',
    description: 'Job, skills, freelancing and professional growth',
    icon: Briefcase,
  },
  {
    id: 'COMMUNICATION',
    title: 'Communication',
    description: 'Speaking, writing, confidence and language',
    icon: MessageSquare,
  },
  {
    id: 'HEALTH',
    title: 'Health',
    description: 'Fitness, sleep, nutrition and wellbeing',
    icon: Activity,
  },
  {
    id: 'PERSONAL',
    title: 'Personal',
    description: 'Habits, finance, relationships and self-development',
    icon: Sparkles,
  },
];

const GOAL_TYPES_BY_AREA = {
  CAREER: [
    { value: 'FIRST_JOB', label: 'First Job' },
    { value: 'JOB_SWITCH', label: 'Job Switch' },
    { value: 'SALARY_GROWTH', label: 'Salary Growth' },
    { value: 'PROMOTION', label: 'Promotion' },
    { value: 'FREELANCING', label: 'Freelancing' },
    { value: 'CAREER_CHANGE', label: 'Career Change' },
    { value: 'SKILL_MASTERY', label: 'Skill Mastery' },
    { value: 'CERTIFICATION', label: 'Certification' },
    { value: 'PORTFOLIO', label: 'Portfolio' },
    { value: 'BUSINESS', label: 'Business' },
    { value: 'CUSTOM', label: 'Custom' },
  ],
  COMMUNICATION: [
    { value: 'ENGLISH_SPEAKING', label: 'English Speaking' },
    { value: 'PUBLIC_SPEAKING', label: 'Public Speaking' },
    { value: 'PROFESSIONAL_COMMUNICATION', label: 'Professional Communication' },
    { value: 'WRITING', label: 'Writing' },
    { value: 'PRESENTATION', label: 'Presentation' },
    { value: 'CONFIDENCE', label: 'Confidence' },
    { value: 'LANGUAGE_LEARNING', label: 'Language Learning' },
    { value: 'INTERVIEW_COMMUNICATION', label: 'Interview Communication' },
    { value: 'CUSTOM', label: 'Custom' },
  ],
  HEALTH: [
    { value: 'FITNESS', label: 'Fitness' },
    { value: 'NUTRITION', label: 'Nutrition' },
    { value: 'SLEEP', label: 'Sleep' },
    { value: 'MENTAL_WELLBEING', label: 'Mental Wellbeing' },
    { value: 'WEIGHT', label: 'Weight' },
    { value: 'DAILY_ACTIVITY', label: 'Daily Activity' },
    { value: 'HEALTH_ROUTINE', label: 'Health Routine' },
    { value: 'CUSTOM', label: 'Custom' },
  ],
  PERSONAL: [
    { value: 'HABIT', label: 'Habit' },
    { value: 'FINANCE', label: 'Finance' },
    { value: 'RELATIONSHIP', label: 'Relationship' },
    { value: 'PRODUCTIVITY', label: 'Productivity' },
    { value: 'SELF_DEVELOPMENT', label: 'Self-Development' },
    { value: 'READING', label: 'Reading' },
    { value: 'LIFE_SKILL', label: 'Life Skill' },
    { value: 'CUSTOM', label: 'Custom' },
  ],
};

const AREA_LABELS = {
  CAREER: 'Career',
  COMMUNICATION: 'Communication',
  HEALTH: 'Health',
  PERSONAL: 'Personal',
};

// Accessible styled custom dropdown component
const CustomSelect = ({ label, value, options, onChange, placeholder = 'Select option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-[#94A3B8] mb-1.5">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2B] border border-slate-200 dark:border-[#253044] rounded-xl text-xs sm:text-sm text-slate-900 dark:text-[#F8FAFC] hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:border-[#2A7A3B] transition-colors cursor-pointer text-left"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 dark:text-[#64748B] transition-transform duration-150 shrink-0 ml-2 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto bg-white dark:bg-[#151D2B] border border-slate-200 dark:border-[#253044] rounded-xl shadow-xl py-1 divide-y divide-slate-100 dark:divide-[#253044]/40 animate-in fade-in zoom-in-95 duration-100">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#2A7A3B]/10 text-[#2A7A3B] font-semibold'
                    : 'text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#1F293D]'
                }`}
                role="option"
                aria-selected={isSelected}
              >
                <span>{opt.label}</span>
                {isSelected && <Check size={14} className="text-[#2A7A3B] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const CreateGoalModal = ({
  isOpen,
  onClose,
  initialArea = 'CAREER',
  onGoalCreated,
}) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdGoal, setCreatedGoal] = useState(null);

  // Form State
  const [selectedArea, setSelectedArea] = useState(initialArea || 'CAREER');
  const [title, setTitle] = useState('');
  const [goalType, setGoalType] = useState('JOB_SWITCH');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [targetRole, setTargetRole] = useState('');

  // Step 3 fields
  const [why, setWhy] = useState('');
  const [weeklyCommitment, setWeeklyCommitment] = useState('5');
  const [firstMilestone, setFirstMilestone] = useState('');
  const [firstAction, setFirstAction] = useState('');

  // Reminder fields
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('DAILY');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderChannel, setReminderChannel] = useState('IN_APP');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMessage('');
      setIsSubmitting(false);
      setCreatedGoal(null);

      const defaultArea =
        initialArea && initialArea !== 'ALL' ? initialArea : 'CAREER';
      setSelectedArea(defaultArea);
      const types = GOAL_TYPES_BY_AREA[defaultArea] || GOAL_TYPES_BY_AREA.CAREER;
      setGoalType(types[0].value);
      setTitle('');
      setTargetDate('');
      setPriority('HIGH');
      setTargetRole('');
      setWhy('');
      setWeeklyCommitment('5');
      setFirstMilestone('');
      setFirstAction('');
      setReminderEnabled(false);
      setReminderFrequency('DAILY');
      setReminderTime('09:00');
      setReminderChannel('IN_APP');

      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialArea]);

  // Update default type when area changes
  const handleAreaSelect = (areaId) => {
    setSelectedArea(areaId);
    const types = GOAL_TYPES_BY_AREA[areaId] || GOAL_TYPES_BY_AREA.CAREER;
    setGoalType(types[0].value);
  };

  // Step navigation
  const handleNextFromStep1 = () => {
    setErrorMessage('');
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setErrorMessage('');
    if (!title.trim()) {
      setErrorMessage('Please enter a goal title.');
      return;
    }
    setStep(3);
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  // Submit Goal Creation
  const handleCreateGoal = async () => {
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        growthArea: selectedArea,
        type: goalType,
        priority,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        targetRole: selectedArea === 'CAREER' && targetRole.trim() ? targetRole.trim() : null,
        why: why.trim() || null,
        description: why.trim() || null,
        weeklyCommitment: weeklyCommitment ? Number(weeklyCommitment) || weeklyCommitment : null,
        firstMilestone: firstMilestone.trim() || null,
        firstAction: firstAction.trim() || null,
        reminder: reminderEnabled
          ? {
              frequency: reminderFrequency,
              time: reminderTime,
              channel: reminderChannel,
            }
          : null,
      };

      const result = await onGoalCreated(payload);
      const newGoalObj = result?.data?.goal || result?.goal || {
        id: result?.data?.id || result?.id,
        title: payload.title,
        firstTask: result?.data?.goal?.firstTask,
      };

      setCreatedGoal({
        ...newGoalObj,
        firstAction: firstAction.trim(),
      });
      setStep('SUCCESS');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to create goal. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog / Mobile Full-Screen Sheet */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[640px] bg-[#111827] border-0 sm:border border-[#253044] rounded-none sm:rounded-2xl shadow-2xl z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#253044] bg-[#111827] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            {step > 1 && step !== 'SUCCESS' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] transition-colors cursor-pointer"
                title="Back"
                aria-label="Back"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] leading-snug">
                  {step === 1 && 'Create a goal'}
                  {step === 2 && `Create a ${AREA_LABELS[selectedArea]} Goal`}
                  {step === 3 && 'Make it actionable'}
                  {step === 'SUCCESS' && 'Goal Created'}
                </h2>
              </div>
              {step !== 'SUCCESS' && (
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Step {step} of 3
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="text-red-400 hover:text-red-300 ml-2"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* ======================================================
              STEP 1: CHOOSE AREA
          ====================================================== */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  What do you want to move forward?
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Choose the area this goal belongs to.
                </p>
              </div>

              <div className="space-y-2.5">
                {AREA_OPTIONS.map((area) => {
                  const isSelected = selectedArea === area.id;
                  const Icon = area.icon;

                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => handleAreaSelect(area.id)}
                      className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#2A7A3B] bg-[rgba(42,122,59,0.06)]'
                          : 'border-[#253044] bg-[#151D2B] hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#2A7A3B]/15 text-[#2A7A3B]'
                              : 'bg-[#111827] text-[#94A3B8] border border-[#253044]'
                          }`}
                        >
                          <Icon size={20} />
                        </div>
                        <div className="truncate">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isSelected ? 'text-[#F8FAFC]' : 'text-slate-200'
                            }`}
                          >
                            {area.title}
                          </h4>
                          <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                            {area.description}
                          </p>
                        </div>
                      </div>

                      {/* Selection Indicator */}
                      <div className="shrink-0 ml-3">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#2A7A3B] bg-[#2A7A3B]'
                              : 'border-[#253044] bg-[#111827]'
                          }`}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================
              STEP 2: DEFINE THE GOAL
          ====================================================== */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Define your {AREAS.find((a) => a.id === selectedArea)?.title} goal
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Be specific about what you want to accomplish.
                </p>
              </div>

              {/* Goal Title */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Goal <span className="text-[#2A7A3B]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    selectedArea === 'CAREER'
                      ? 'e.g. Land a Senior Backend Engineer role'
                      : selectedArea === 'COMMUNICATION'
                      ? 'e.g. Confident English presentation in meetings'
                      : selectedArea === 'HEALTH'
                      ? 'e.g. Complete 30-min morning workout 4x weekly'
                      : 'e.g. Read 15 pages of non-fiction daily'
                  }
                  className="w-full px-3.5 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors"
                  autoFocus
                />
              </div>

              {/* Goal Type & Priority Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <CustomSelect
                  label="Goal Type *"
                  value={goalType}
                  options={GOAL_TYPES_BY_AREA[selectedArea] || []}
                  onChange={setGoalType}
                />

                {/* Priority Selector */}
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Priority
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#151D2B] border border-[#253044] rounded-xl">
                    {['LOW', 'MEDIUM', 'HIGH'].map((p) => {
                      const isSelected = priority === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? p === 'HIGH'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-[#253044] text-[#F8FAFC]'
                              : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                          }`}
                        >
                          {p.charAt(0) + p.slice(1).toLowerCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Target Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B] transition-colors [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Area-Specific Field: Target Role (CAREER only) */}
              {selectedArea === 'CAREER' && (
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Target Role <span className="text-[#64748B] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Full Stack Engineer"
                    className="w-full px-3.5 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors"
                  />
                </div>
              )}
            </div>
          )}

          {/* ======================================================
              STEP 3: MAKE IT ACTIONABLE
          ====================================================== */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Make it actionable
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Turn your goal into something you can start today.
                </p>
              </div>

              {/* Why does this matter? */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  Why does this matter? <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="Why is this goal important to you right now?"
                  className="w-full px-3.5 py-2 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors resize-none"
                />
              </div>

              {/* Weekly Commitment & First Milestone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    Weekly commitment
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={weeklyCommitment}
                      onChange={(e) => setWeeklyCommitment(e.target.value)}
                      placeholder="5"
                      className="w-full pl-3.5 pr-24 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors"
                    />
                    <span className="absolute right-3.5 text-xs text-[#94A3B8] pointer-events-none">
                      hrs / week
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                    First milestone <span className="text-[#64748B] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={firstMilestone}
                    onChange={(e) => setFirstMilestone(e.target.value)}
                    placeholder="e.g. Complete foundational syllabus"
                    className="w-full px-3.5 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors"
                  />
                </div>
              </div>

              {/* First Action */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                  First action <span className="text-[#64748B] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={firstAction}
                  onChange={(e) => setFirstAction(e.target.value)}
                  placeholder="e.g. Research initial curriculum or block calendar"
                  className="w-full px-3.5 py-2.5 bg-[#151D2B] border border-[#253044] rounded-xl text-xs sm:text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#2A7A3B] transition-colors"
                />
              </div>

              {/* Optional Reminder Section */}
              <div className="pt-2 border-t border-[#253044]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-[#2A7A3B]" />
                    <span className="text-xs font-semibold text-[#F8FAFC]">
                      Schedule check-in reminder
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#253044] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2A7A3B]"></div>
                  </label>
                </div>

                {reminderEnabled && (
                  <div className="mt-3 p-3 bg-[#151D2B] border border-[#253044] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in duration-150">
                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">
                        Frequency
                      </label>
                      <select
                        value={reminderFrequency}
                        onChange={(e) => setReminderFrequency(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#111827] border border-[#253044] rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B] cursor-pointer"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKDAYS">Weekdays</option>
                        <option value="WEEKLY">Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#111827] border border-[#253044] rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B] [color-scheme:dark]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#94A3B8] mb-1">
                        Channel
                      </label>
                      <select
                        value={reminderChannel}
                        onChange={(e) => setReminderChannel(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#111827] border border-[#253044] rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#2A7A3B] cursor-pointer"
                      >
                        <option value="IN_APP">In-App</option>
                        <option value="PUSH">Push</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Compact Goal Summary (Bottom of Step 3) */}
              <div className="mt-4 p-3.5 rounded-xl border border-[#253044] bg-[#151D2B]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-[#253044] text-[#94A3B8]">
                    {selectedArea}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {weeklyCommitment || 0} hrs/week
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] truncate">
                  {title || 'Untitled Goal'}
                </h4>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#94A3B8]">
                  <span>Target: {targetDate ? new Date(targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date set'}</span>
                  <span>·</span>
                  <span>Priority: {priority.charAt(0) + priority.slice(1).toLowerCase()}</span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================
              SUCCESS EXPERIENCE
          ====================================================== */}
          {step === 'SUCCESS' && (
            <div className="py-4 text-center space-y-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#2A7A3B]/15 border border-[#2A7A3B]/30 flex items-center justify-center text-[#2A7A3B]">
                <CheckCircle2 size={26} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                  Goal created
                </h3>
                <p className="text-sm font-medium text-slate-300 max-w-sm mx-auto">
                  {createdGoal?.title || title}
                </p>
              </div>

              {/* First Step Card */}
              <div className="p-3.5 rounded-xl border border-[#253044] bg-[#151D2B] text-left max-w-md mx-auto">
                <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Your first step:
                </p>
                <p className="text-xs sm:text-sm font-medium text-[#F8FAFC] mt-1">
                  {createdGoal?.firstAction || firstAction.trim() || 'No first action defined yet.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Reachable on Mobile with safe area padding) */}
        <div className="p-4 sm:p-5 border-t border-[#253044] bg-[#111827] shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 1 && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#2A7A3B]/25 transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2.5 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="px-6 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#2A7A3B]/25 transition-colors cursor-pointer"
              >
                Continue
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCreateGoal}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#2A7A3B]/25 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Creating...</span>
                ) : (
                  <>
                    <span>Create Goal</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5">
              {createdGoal?.firstAction || firstAction.trim() ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/app/today');
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#2A7A3B]/25 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Start now</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (createdGoal?.id) {
                        navigate(`/app/goals/${createdGoal.id}`);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    View goal
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (createdGoal?.id) {
                        navigate(`/app/goals/${createdGoal.id}`);
                      }
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs sm:text-sm font-semibold shadow-sm shadow-[#2A7A3B]/25 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Add first action</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (createdGoal?.id) {
                        navigate(`/app/goals/${createdGoal.id}`);
                      }
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#253044] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#151D2B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    View goal
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
