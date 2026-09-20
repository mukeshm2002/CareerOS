import React from 'react';

/**
 * Reusable Standard Page Header Component
 * Standardized across all EYTHU modules for visual consistency and responsive hierarchy.
 * 
 * Mobile:
 *   - Icon + Title (24-26px / 700)
 *   - Short supporting sentence (12-13px)
 *   - Action below or inline
 * 
 * Desktop:
 *   - Title (28-30px / 700) + supporting sentence on left
 *   - Primary action aligned right
 */
export const PageHeader = ({
  icon: Icon,
  title,
  subtitle,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-1 ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-brand-soft border border-[#2A7A3B]/20 text-[#2A7A3B] flex items-center justify-center shrink-0">
              <Icon size={18} strokeWidth={2} />
            </div>
          )}
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] leading-tight truncate">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] max-w-xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-1 sm:pt-0">
          {action}
        </div>
      )}
    </div>
  );
};
