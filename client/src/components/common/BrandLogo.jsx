import React from 'react';
import eythuLogo from '../../assets/brand/eythu-logo.png';

/**
 * Official BrandLogo Component for EYTHU — Personal Growth System
 *
 * "எய்து" — to reach, attain, or achieve.
 * Brand concept: Set a direction → Plan → Take action → Progress → Achieve.
 *
 * SOURCE OF TRUTH: eythu-logo.png — the official approved bow-and-arrow mark.
 * Do NOT replace this with any generated or alternate logo.
 *
 * Logo MUST be used with:
 *   object-fit: contain  (never stretch)
 *   aspect-ratio: auto   (never force square if not square)
 *   Transparent/neutral background only
 *   No background watermark, no decorative overlay use
 *
 * Sizing specs:
 * - 'xs': symbol 24px
 * - 'sm': symbol 32px  — Mobile header (recommended 30–34px)
 * - 'md': symbol 40px  — Desktop sidebar (recommended 36–42px)
 * - 'lg': symbol 64px  — Auth pages (recommended 56–72px)
 * - 'xl': symbol 88px  — Splash/loading (recommended 72–96px)
 *
 * Variants:
 * - 'symbol'         — logo mark only (no text)
 * - 'wordmark'       — EYTHU text only (no logo)
 * - 'lockup'         — vertical: logo above wordmark (Auth pages)
 * - 'icon-wordmark'  — horizontal: logo left, wordmark right (Sidebar/Mobile)
 *
 * Canonical export: EythuBrand
 * Backward-compat exports: VazhariLogo, BrandLogo
 */
const symbolDimensions = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 88,
  '2xl': 96,
};

const textStyles = {
  xs: 'text-[13px] tracking-[0.06em]',
  sm: 'text-[16px] tracking-[0.06em]',
  md: 'text-[18px] tracking-[0.06em]',
  lg: 'text-[22px] tracking-[0.07em]',
  xl: 'text-[26px] tracking-[0.07em]',
  '2xl': 'text-[30px] tracking-[0.08em]',
};

const tagStyles = {
  xs: 'text-[10px]',
  sm: 'text-[10px]',
  md: 'text-[11px]',
  lg: 'text-[12px]',
  xl: 'text-[13px]',
  '2xl': 'text-[14px]',
};

export const BrandLogo = ({
  size = 'md',
  variant = 'icon-wordmark',
  showWordmark = true,
  showTagline = false,
  taglineText = 'Personal Growth System',
  className = '',
  symbolClassName = '',
  wordmarkClassName = '',
  iconOnly = false,
}) => {
  // Normalize variant
  let effectiveVariant = variant;
  if (iconOnly || (!showWordmark && variant !== 'lockup' && variant !== 'stacked')) {
    effectiveVariant = 'symbol';
  } else if (variant === 'icon') {
    effectiveVariant = 'symbol';
  } else if (variant === 'full' || variant === 'stacked') {
    effectiveVariant = 'lockup';
  }

  const symbolDim = symbolDimensions[size] || symbolDimensions.md;
  const textStyle = textStyles[size] || textStyles.md;
  const tagStyle = tagStyles[size] || tagStyles.md;

  /**
   * Render official EYTHU logo mark.
   * Hard-coded inline dimensions prevent any layout override from causing blowout.
   * object-fit: contain preserves the bow-and-arrow's exact proportions.
   */
  const renderSymbol = () => (
    <div
      className={`shrink-0 flex items-center justify-center ${symbolClassName}`}
      style={{
        width: `${symbolDim}px`,
        height: `${symbolDim}px`,
        maxWidth: `${symbolDim}px`,
        maxHeight: `${symbolDim}px`,
        flexShrink: 0,
      }}
    >
      <img
        src={eythuLogo}
        alt="EYTHU"
        width={symbolDim}
        height={symbolDim}
        style={{
          width: `${symbolDim}px`,
          height: `${symbolDim}px`,
          maxWidth: `${symbolDim}px`,
          maxHeight: `${symbolDim}px`,
          objectFit: 'contain',
          aspectRatio: 'auto',
          display: 'block',
          flexShrink: 0,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
        loading="eager"
        draggable={false}
      />
    </div>
  );

  // 1. SYMBOL ONLY
  if (effectiveVariant === 'symbol') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${symbolDim}px`, height: `${symbolDim}px` }}
        aria-label="EYTHU"
      >
        {renderSymbol()}
      </div>
    );
  }

  // 2. WORDMARK ONLY
  if (effectiveVariant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col justify-center select-none ${className}`} aria-label="EYTHU">
        <span className={`font-black text-slate-900 dark:text-[#F8FAFC] leading-none ${textStyle} ${wordmarkClassName}`}>
          EYTHU
        </span>
        {showTagline && (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagStyle}`}>
            {taglineText}
          </span>
        )}
      </div>
    );
  }

  // 3. VERTICAL STACKED / LOCKUP
  // Auth pages: [logo 64px] → EYTHU (22px bold) → Personal Growth System (12px)
  if (effectiveVariant === 'lockup') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="flex items-center justify-center shrink-0">
          {renderSymbol()}
        </div>
        <span className={`font-bold text-slate-900 dark:text-[#F8FAFC] leading-none mt-3 ${textStyle} ${wordmarkClassName}`}>
          EYTHU
        </span>
        <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagStyle}`}>
          {taglineText}
        </span>
      </div>
    );
  }

  // 4. HORIZONTAL ICON + WORDMARK (Default — Sidebar, Mobile Header)
  // [logo] EYTHU / Personal Growth System
  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {renderSymbol()}
      <div className={`flex flex-col justify-center min-w-0 ${wordmarkClassName}`}>
        <span className={`font-black text-slate-900 dark:text-[#F8FAFC] leading-tight ${textStyle}`}>
          EYTHU
        </span>
        {showTagline && (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-none truncate ${tagStyle}`}>
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};

// Canonical EYTHU export
export const EythuBrand = BrandLogo;

// Backward compatibility aliases — do not remove
export const VazhariLogo = BrandLogo;
export default BrandLogo;
