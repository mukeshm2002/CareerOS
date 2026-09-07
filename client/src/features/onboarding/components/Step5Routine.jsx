import React, { useMemo } from 'react';
import { ArrowRight, ArrowLeft, Clock, Zap } from 'lucide-react';

export const Step5Routine = ({ routine, onChange, onNext, onBack }) => {
  // Helper to format minutes to "Xh Ym / day"
  const formattedAvailableTime = useMemo(() => {
    const totalMinutes = routine.availableCareerMinutes || 140;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ''} / day`;
  }, [routine.availableCareerMinutes]);

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          When are you actually available?
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          CareerOS plans realistic daily focus blocks around your work and family routine.
        </p>
      </div>

      {/* Routine Time Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Wake-up Time
          </label>
          <input
            type="time"
            value={routine.wakeTime || '06:00'}
            onChange={(e) => onChange({ wakeTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Work / College Start
          </label>
          <input
            type="time"
            value={routine.workStartTime || '08:00'}
            onChange={(e) => onChange({ workStartTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Work / College End
          </label>
          <input
            type="time"
            value={routine.workEndTime || '19:00'}
            onChange={(e) => onChange({ workEndTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Personal / Dinner Start
          </label>
          <input
            type="time"
            value={routine.personalStartTime || '19:00'}
            onChange={(e) => onChange({ personalStartTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Personal / Dinner End
          </label>
          <input
            type="time"
            value={routine.personalEndTime || '20:00'}
            onChange={(e) => onChange({ personalEndTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Sleep Time
          </label>
          <input
            type="time"
            value={routine.sleepTime || '22:30'}
            onChange={(e) => onChange({ sleepTime: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Available Career Time Calculator & Manual Override */}
      <div className="p-5 rounded-2xl bg-brand-50/50 border border-brand-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
            <Zap size={16} className="text-brand-600" />
            <span>Available Career Development Time</span>
          </div>
          <span className="text-base font-extrabold text-brand-600">
            {formattedAvailableTime}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Adjust the slider to match what you can realistically sustain every day without burning out.
        </p>

        <div className="space-y-1">
          <input
            type="range"
            min="30"
            max="360"
            step="15"
            value={routine.availableCareerMinutes || 140}
            onChange={(e) => onChange({ availableCareerMinutes: parseInt(e.target.value, 10) })}
            className="w-full accent-brand-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>30m (Micro-consistency)</span>
            <span>2h 20m (Recommended)</span>
            <span>6h (Full-time switcher)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-sm shadow-brand-600/30 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
