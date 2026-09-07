import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';

export const Step1Welcome = ({ onNext }) => {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="inline-flex h-16 w-16 rounded-2xl bg-brand-50 text-brand-600 items-center justify-center shadow-xs">
        <Compass size={32} />
      </div>

      <div className="space-y-3 max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Welcome to CareerOS.
        </h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Let's build a career system around your life — not the other way around.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 max-w-md mx-auto text-left space-y-2">
        <p className="text-xs font-semibold text-slate-700">The CareerOS Workflow:</p>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-brand-700 font-medium">
          <span>Goal</span>
          <span>→</span>
          <span>Roadmap</span>
          <span>→</span>
          <span>Skill Gap</span>
          <span>→</span>
          <span>Schedule</span>
          <span>→</span>
          <span>Today's Action</span>
          <span>→</span>
          <span>Evidence</span>
        </div>
      </div>

      <div className="pt-4 max-w-md mx-auto">
        <button
          type="button"
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-sm shadow-brand-600/30 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
