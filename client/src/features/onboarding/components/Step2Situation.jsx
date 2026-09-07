import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

const situationOptions = [
  { value: 'STUDENT', label: 'Student', desc: 'Currently in college or university' },
  { value: 'FRESHER', label: 'Fresher', desc: 'Recent graduate seeking first full-time role' },
  { value: 'WORKING_PROFESSIONAL', label: 'Working Professional', desc: 'Employed, looking to grow or switch' },
  { value: 'FREELANCER', label: 'Freelancer', desc: 'Independent contractor / consultant' },
  { value: 'CAREER_BREAK', label: 'Career Break', desc: 'Returning to the workforce' },
  { value: 'CAREER_SWITCHER', label: 'Career Switcher', desc: 'Transitioning from another domain or field' },
  { value: 'ENTREPRENEUR', label: 'Entrepreneur', desc: 'Building or scaling a business venture' },
  { value: 'OTHER', label: 'Other', desc: 'Custom professional situation' },
];

export const Step2Situation = ({ value, onChange, onNext, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          Where are you right now?
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          This tailors your roadmaps, baseline expectations, and weekly availability.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {situationOptions.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                  {opt.label}
                </span>
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-brand-600" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{opt.desc}</p>
            </button>
          );
        })}
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
          disabled={!value}
          onClick={onNext}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-sm shadow-brand-600/30 disabled:opacity-40 cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
