import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Sparkles, FileText } from 'lucide-react';
import { workLogService } from '../../services/workLogService';

export const QuickNoteSheet = ({ isOpen, onClose, initialData, onSaveSuccess }) => {
  const [workedOn, setWorkedOn] = useState('');
  const [learned, setLearned] = useState('');
  const [blockers, setBlockers] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWorkedOn(initialData?.workedOn || '');
      setLearned(initialData?.learned || '');
      setBlockers(initialData?.blockers || '');
      setNextStep(initialData?.nextStep || '');
      setErrorMsg('');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialData]);

  // ESC key handler
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
    try {
      setSaving(true);
      setErrorMsg('');
      const result = await workLogService.saveToday({
        workedOn: workedOn.trim() || null,
        learned: learned.trim() || null,
        blockers: blockers.trim() || null,
        nextStep: nextStep.trim() || null,
      });
      if (onSaveSuccess) {
        onSaveSuccess(result.data);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#111827] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[rgba(148,163,184,0.14)] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Pull Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700/60" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[rgba(148,163,184,0.14)] flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-[#131A2A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7C6CF2]/10 text-[#7C6CF2] dark:text-[#8B7CF6]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] leading-tight">
                {initialData?.id ? "Edit Today's Note" : "Today's Work Note"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-0.5">
                What did you do for your career today?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#192235] transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-[rgba(251,113,133,0.10)] border border-rose-200 dark:border-[rgba(251,113,133,0.25)] rounded-xl text-xs font-semibold text-rose-700 dark:text-[#FB7185]">
                {errorMsg}
              </div>
            )}

            {/* Field 1: What did you work on? */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-[#CBD5E1] mb-1.5">
                What did you work on?
              </label>
              <textarea
                rows={3}
                value={workedOn}
                onChange={(e) => setWorkedOn(e.target.value)}
                placeholder="e.g. Built automated test suite for reminder scheduler"
                className="w-full p-3 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2] transition resize-none leading-relaxed"
              />
            </div>

            {/* Field 2: What did you learn? */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-[#CBD5E1] mb-1.5">
                What did you learn?
              </label>
              <textarea
                rows={2}
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                placeholder="e.g. Learned how IANA timezone offset calculations handle daylight-saving transitions"
                className="w-full p-3 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2] transition resize-none leading-relaxed"
              />
            </div>

            {/* Field 3: Any blocker? */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-[#CBD5E1] mb-1.5">
                Any blocker?
              </label>
              <textarea
                rows={2}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g. Waiting on third-party webhook confirmation / DNS propogation"
                className="w-full p-3 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2] transition resize-none leading-relaxed"
              />
            </div>

            {/* Field 4: What's the next step? */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-[#CBD5E1] mb-1.5">
                What's the next step?
              </label>
              <textarea
                rows={2}
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="e.g. Deploy to staging, verify mobile layout at 390px"
                className="w-full p-3 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2] transition resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-[rgba(148,163,184,0.14)] flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-[#111827] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] sm:pb-5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl border border-slate-200 dark:border-[rgba(148,163,184,0.18)] text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#192235] font-semibold text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-11 px-6 rounded-xl bg-[#7C6CF2] hover:bg-[#8B7CF6] active:scale-98 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-[#7C6CF2]/20 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  <span>Save Today's Note</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
