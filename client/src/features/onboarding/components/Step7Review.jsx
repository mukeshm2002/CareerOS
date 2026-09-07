import React from 'react';
import { ArrowLeft, Sparkles, CheckCircle2, Clock, Target, User, Briefcase } from 'lucide-react';

export const Step7Review = ({
  situation,
  goals = [],
  routine,
  profile,
  skills = [],
  isSubmitting,
  onSubmit,
  onBack,
}) => {
  const primaryGoal = goals[0];
  const secondaryGoals = goals.slice(1);

  const formatMinutes = (mins) => {
    const total = mins || 140;
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${m > 0 ? `${m}m` : ''} / day`;
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          Review & Create Your CareerOS
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Everything is aligned. Confirm your system setup to launch your personal career OS.
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Current Situation
            </span>
            <span className="text-sm font-bold text-slate-800">
              {situation?.replace('_', ' ') || 'Working Professional'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Target Career Time
            </span>
            <span className="text-sm font-bold text-brand-600">
              {formatMinutes(routine?.availableCareerMinutes)}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Current Role
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {profile?.currentRole || 'Software Professional'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
              Target Role
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {profile?.targetRole || 'Full Stack Developer'}
            </span>
          </div>
        </div>

        {/* Primary Goal */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-brand-50/50 border border-brand-200/70">
          <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider block">
            Primary Career Goal
          </span>
          <p className="text-sm font-bold text-slate-900">
            {primaryGoal?.title || 'Advance to target software developer role'}
          </p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
            <span>Target Date: <strong className="text-slate-700">{primaryGoal?.targetDate ? primaryGoal.targetDate.split('T')[0] : 'Dec 31, 2026'}</strong></span>
            <span>•</span>
            <span>Priority: <strong className="text-brand-700">{primaryGoal?.priority || 'HIGH'}</strong></span>
          </div>
        </div>

        {/* Secondary Goals */}
        {secondaryGoals.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Additional Goals ({secondaryGoals.length})
            </span>
            <div className="space-y-1.5">
              {secondaryGoals.map((g, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs border border-slate-200/60">
                  <span className="font-semibold text-slate-800">{g.title}</span>
                  <span className="text-[10px] text-slate-500">{g.targetDate ? g.targetDate.split('T')[0] : 'Dec 31, 2026'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Baseline skills summary */}
        {skills.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Baseline Skills Assessed ({skills.length}):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s.name} className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
                  {s.name} <span className="text-brand-600 font-bold">({s.selfRating}/5)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
          className="flex items-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs transition-all shadow-sm shadow-brand-600/30 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          <span>Create My CareerOS</span>
        </button>
      </div>
    </div>
  );
};
