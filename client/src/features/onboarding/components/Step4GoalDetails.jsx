import React from 'react';
import { ArrowRight, ArrowLeft, Target, Calendar, DollarSign } from 'lucide-react';

const supportedCurrencies = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'A$', label: 'AUD ($)' },
  { code: 'SGD', symbol: 'S$', label: 'SGD ($)' },
  { code: 'AED', symbol: 'AED', label: 'AED (د.إ)' },
];

export const Step4GoalDetails = ({ goals = [], onUpdateGoal, onNext, onBack }) => {
  const canContinue = goals.length > 0 && goals.every((g) => g.title?.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          Set targets for your goals
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Specify target completion dates, target compensation, and currency for each outcome.
        </p>
      </div>

      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
        {goals.map((goal, index) => (
          <div
            key={goal.type || index}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md">
                Goal #{index + 1} • {goal.type?.replace('_', ' ')}
              </span>
              <div className="flex items-center gap-1">
                {['HIGH', 'MEDIUM', 'LOW'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onUpdateGoal(index, { priority: p })}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      goal.priority === p
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Goal Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={goal.title}
                onChange={(e) => onUpdateGoal(index, { title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                placeholder="e.g. Get a better-paying Software Developer role"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Target Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={goal.targetDate ? goal.targetDate.split('T')[0] : '2026-12-31'}
                  onChange={(e) => onUpdateGoal(index, { targetDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                />
              </div>

              {/* Target Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Role
                </label>
                <input
                  type="text"
                  value={goal.targetRole || ''}
                  onChange={(e) => onUpdateGoal(index, { targetRole: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  placeholder="e.g. Full Stack Developer"
                />
              </div>

              {/* Currency */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  value={goal.salaryCurrency || 'USD'}
                  onChange={(e) => onUpdateGoal(index, { salaryCurrency: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
                >
                  {supportedCurrencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Salary */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Salary
                </label>
                <input
                  type="text"
                  value={goal.targetSalary || ''}
                  onChange={(e) => onUpdateGoal(index, { targetSalary: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
                  placeholder="e.g. 120,000 / yr"
                />
              </div>
            </div>
          </div>
        ))}
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
          disabled={!canContinue}
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
