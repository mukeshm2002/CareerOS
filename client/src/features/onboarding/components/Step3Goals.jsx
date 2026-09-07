import React from 'react';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';

const goalOptions = [
  { key: 'FIRST_JOB', title: 'Get my first job', tag: 'Job Search' },
  { key: 'JOB_SWITCH', title: 'Switch jobs', tag: 'Career Move' },
  { key: 'SALARY_GROWTH', title: 'Increase my salary', tag: 'Compensation' },
  { key: 'PROMOTION', title: 'Get promoted', tag: 'Advancement' },
  { key: 'FREELANCING', title: 'Start freelancing', tag: 'Independent' },
  { key: 'CAREER_CHANGE', title: 'Change career', tag: 'Transition' },
  { key: 'SKILL_MASTERY', title: 'Master a skill', tag: 'Competency' },
  { key: 'PORTFOLIO', title: 'Build my portfolio', tag: 'Evidence' },
  { key: 'CERTIFICATION', title: 'Get a certification', tag: 'Credential' },
  { key: 'BUSINESS', title: 'Start a business', tag: 'Entrepreneurship' },
  { key: 'CUSTOM', title: 'Custom Goal', tag: 'Personal' },
];

export const Step3Goals = ({ selectedGoals = [], onToggleGoal, onNext, onBack }) => {
  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          What do you want to achieve?
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Select all outcomes that apply. You can configure target dates and priorities in the next step.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {goalOptions.map((opt) => {
          const isSelected = selectedGoals.some((g) => g.type === opt.key);

          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onToggleGoal(opt)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-brand-600 bg-brand-50/60 ring-2 ring-brand-500/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div>
                <p className={`text-xs font-bold ${isSelected ? 'text-brand-900' : 'text-slate-800'}`}>
                  {opt.title}
                </p>
                <span className="text-[10px] text-slate-400 font-medium">{opt.tag}</span>
              </div>

              <div
                className={`h-5 w-5 rounded-lg flex items-center justify-center text-xs transition-colors ${
                  isSelected ? 'bg-brand-600 text-white' : 'border border-slate-300'
                }`}
              >
                {isSelected && <Check size={12} strokeWidth={3} />}
              </div>
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
          disabled={selectedGoals.length === 0}
          onClick={onNext}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-sm shadow-brand-600/30 disabled:opacity-40 cursor-pointer"
        >
          <span>Continue ({selectedGoals.length} selected)</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
