import React from 'react';
import vazhariMark from '../../assets/brand/vazhari-mark.svg';
import vazhariMarkDark from '../../assets/brand/vazhari-mark-dark.svg';

/**
 * Official BrandLogo Component for VAZHARI — Personal Growth System
 * 
 * Enforces strict width/height boundaries on both container and image elements
 * to guarantee that original asset dimensions NEVER control layout.
 * 
 * Sizing specs:
 * - 'xs': symbol 24px, wordmark 13px, descriptor 10px
 * - 'sm': symbol 30px, wordmark 16px, descriptor 10px (Recommended for Mobile Header: 28–32px)
 * - 'md': symbol 38px, wordmark 19px, descriptor 11px (Recommended for Desktop Sidebar: 34–40px, container 72–84px)
 * - 'lg': symbol 44px, wordmark 22px, descriptor 12px (Recommended for Auth / Modals)
 * - 'xl': symbol 56px, wordmark 26px, descriptor 13px (Recommended for Welcome / Onboarding)
 */
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
  forceLight = false,
  forceDark = false,
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

  // Exact pixel dimension maps for symbol
  const symbolDimensions = {
    xs: 24,
    sm: 30,
    md: 38,
    lg: 44,
    xl: 56,
    '2xl': 64,
  };

  // Typography font size maps for VAZHARI wordmark
  const textStyles = {
    xs: 'text-[13px] tracking-[0.06em]',
    sm: 'text-[16px] tracking-[0.06em]',
    md: 'text-[19px] tracking-[0.06em]',
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

  const symbolDim = symbolDimensions[size] || symbolDimensions.md;
  const textStyle = textStyles[size] || textStyles.md;
  const tagStyle = tagStyles[size] || tagStyles.md;

  // Render official symbol with hard-coded inline bounds to prevent any blowout
  const renderSymbol = () => {
    const symbolElement = (src, extraClass = '') => (
      <img
        src={src}
        alt="VAZHARI"
        width={symbolDim}
        height={symbolDim}
        style={{
          width: `${symbolDim}px`,
          height: `${symbolDim}px`,
          maxWidth: `${symbolDim}px`,
          maxHeight: `${symbolDim}px`,
          objectFit: 'contain',
          display: 'block',
          flexShrink: 0,
        }}
        className={`${extraClass} select-none pointer-events-none`}
        loading="eager"
      />
    );

    return (
      <div
        className={`relative shrink-0 flex items-center justify-center ${symbolClassName}`}
        style={{
          width: `${symbolDim}px`,
          height: `${symbolDim}px`,
          maxWidth: `${symbolDim}px`,
          maxHeight: `${symbolDim}px`,
          flexShrink: 0,
        }}
      >
        {forceDark ? symbolElement(vazhariMarkDark) : symbolElement(vazhariMark)}
      </div>
    );
  };

  // 1. SYMBOL ONLY
  if (effectiveVariant === 'symbol') {
    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: `${symbolDim}px`, height: `${symbolDim}px` }}
        aria-label="VAZHARI"
      >
        {renderSymbol()}
      </div>
    );
  }

  // 2. WORDMARK ONLY
  if (effectiveVariant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col justify-center select-none ${className}`} aria-label="VAZHARI">
        <span className={`font-black text-slate-900 dark:text-[#F8FAFC] leading-none ${textStyle} ${wordmarkClassName}`}>
          VAZHARI
        </span>
        {showTagline && (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagStyle}`}>
            {taglineText}
          </span>
        )}
      </div>
    );
  }

  // 3. VERTICAL STACKED / LOCKUP (Used on Login, Register, Welcome, Settings About)
  if (effectiveVariant === 'lockup') {
    return (
      <div className={`inline-flex flex-col items-center justify-center text-center select-none ${className}`}>
        <div className="flex items-center justify-center shrink-0">
          {renderSymbol()}
        </div>
        <span className={`font-bold text-slate-900 dark:text-[#F8FAFC] leading-none mt-2 ${textStyle} ${wordmarkClassName}`}>
          VAZHARI
        </span>
        <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagStyle}`}>
          {taglineText}
        </span>
      </div>
    );
  }

  // 4. HORIZONTAL ICON + WORDMARK (Default for Desktop Sidebar, Mobile Header, Top Bar)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none shrink-0 ${className}`}>
      {renderSymbol()}

      <div className={`flex flex-col justify-center min-w-0 ${wordmarkClassName}`}>
        <span className={`font-black text-slate-900 dark:text-[#F8FAFC] leading-tight ${textStyle}`}>
          VAZHARI
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

// Aliases for comprehensive backwards and cross-naming compatibility
export const VazhariLogo = BrandLogo;
export default BrandLogo;
