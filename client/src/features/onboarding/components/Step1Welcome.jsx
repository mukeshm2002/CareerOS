import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { ValariLogo } from '../../../components/common/ValariLogo';

export const Step1Welcome = ({ onNext }) => {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <ValariLogo size="xl" showWordmark={false} />
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-[#F8FAFC]">
          Welcome to VALARI.
        </h1>
        <p className="text-sm font-bold text-[#FF7A00]">
          Grow Forward.
        </p>
        <p className="text-slate-600 dark:text-[#CBD5E1] text-sm md:text-base leading-relaxed">
          Build a personal growth and career system around your life — with clarity and daily momentum.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#161E2D] border border-slate-200/70 dark:border-[#263247] max-w-md mx-auto text-left space-y-2">
        <p className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">The VALARI Workflow:</p>
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-[#FF7A00] font-medium">
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
          className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] active:bg-[#D95F00] text-white font-semibold text-sm transition-all shadow-sm shadow-[#FF7A00]/30 cursor-pointer"
        >
          <span>Get Started</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
