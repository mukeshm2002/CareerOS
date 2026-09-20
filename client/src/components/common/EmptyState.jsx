import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Reusable Compact Empty State Component
 * Standardized across all EYTHU modules to prevent oversized, viewport-dominating empty cards.
 * Compact height target: ~240–300px.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  compact = true,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-[#263247] shadow-xs text-center flex flex-col items-center justify-center ${
        compact ? 'py-8 px-6 min-h-[240px] max-h-[320px]' : 'py-12 px-6'
      } ${className}`}
    >
      {/* Icon */}
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-brand-soft border border-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center mx-auto mb-3 shrink-0">
          <Icon size={22} strokeWidth={2} />
        </div>
      )}

      {/* Typography */}
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] leading-snug">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-4">
          {primaryAction &&
            (primaryAction.to ? (
              <Link
                to={primaryAction.to}
                onClick={primaryAction.onClick}
                className="h-9 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] active:scale-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
              >
                {primaryAction.icon && <primaryAction.icon size={14} />}
                <span>{primaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="h-9 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] active:scale-95 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                {primaryAction.icon && <primaryAction.icon size={14} />}
                <span>{primaryAction.label}</span>
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.to ? (
              <Link
                to={secondaryAction.to}
                onClick={secondaryAction.onClick}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161E2D] dark:hover:bg-[#1A2434] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold inline-flex items-center gap-1.5 transition"
              >
                {secondaryAction.icon && <secondaryAction.icon size={14} />}
                <span>{secondaryAction.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#161E2D] dark:hover:bg-[#1A2434] text-slate-700 dark:text-[#CBD5E1] text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {secondaryAction.icon && <secondaryAction.icon size={14} />}
                <span>{secondaryAction.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
