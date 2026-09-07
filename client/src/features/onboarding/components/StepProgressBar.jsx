import React from 'react';

export const StepProgressBar = ({ currentStep, totalSteps = 7 }) => {
  return (
    <div className="w-full max-w-xl mx-auto mb-6 select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400">Onboarding Progress</span>
        <span className="text-xs font-bold text-brand-600">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      <div className="relative flex items-center justify-between">
        {/* Background track line */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
        {/* Filled track line */}
        <div
          className="absolute left-3 top-1/2 -translate-y-1/2 h-0.5 bg-brand-600 transition-all duration-300 -z-0"
          style={{
            width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
          }}
        />

        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isDone = step < currentStep;
          const isCurrent = step === currentStep;

          return (
            <div
              key={step}
              className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200 ${
                isDone
                  ? 'bg-brand-600 text-white shadow-xs'
                  : isCurrent
                  ? 'bg-white border-2 border-brand-600 text-brand-600 ring-4 ring-brand-100 shadow-xs'
                  : 'bg-slate-100 border border-slate-200 text-slate-400'
              }`}
            >
              {isDone ? '✓' : step}
            </div>
          );
        })}
      </div>
    </div>
  );
};
