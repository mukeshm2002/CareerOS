import React from 'react';
import vazhariSymbol from '../../assets/vazhari-symbol.png';
import vazhariSymbolDark from '../../assets/vazhari-symbol-dark.png';

/**
 * Official VAZHARI Brand Logo Component
 * 
 * VAZHARI represents personal growth through:
 * Vazhi -> Seyal -> Vetri (Plan -> Act -> Achieve)
 * 
 * Brand hierarchy:
 * [Logo Symbol] + [VAZHARI]
 * Secondary descriptor: "Personal Growth System"
 * Maker: "A product by TamZode Technology"
 * 
 * The symbol and wordmark typography are kept separate as required.
 */
export const VazhariLogo = ({
  variant = 'icon-wordmark',
  size = 'md',
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

  // Symbol sizing maps
  const symbolSizeClasses = {
    xs: 'h-5 w-auto',
    sm: 'h-6.5 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-13 w-auto',
    '2xl': 'h-16 w-auto',
  };

  // Typography font size maps for VAZHARI wordmark
  const textSizeClasses = {
    xs: 'text-xs tracking-wider',
    sm: 'text-sm tracking-wide',
    md: 'text-base tracking-wide',
    lg: 'text-lg tracking-wide',
    xl: 'text-2xl tracking-wide',
    '2xl': 'text-3xl tracking-wide',
  };

  const taglineSizeClasses = {
    xs: 'text-[9px]',
    sm: 'text-[10px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm',
    '2xl': 'text-base',
  };

  const symbolClass = `${symbolSizeClasses[size] || symbolSizeClasses.md} object-contain shrink-0 ${symbolClassName}`;
  const textSize = textSizeClasses[size] || textSizeClasses.md;
  const tagSize = taglineSizeClasses[size] || taglineSizeClasses.md;

  // Render official symbol with dark/light switching
  const renderSymbol = () => {
    if (forceDark) {
      return (
        <img
          src={vazhariSymbolDark}
          alt="VAZHARI"
          className={symbolClass}
          loading="eager"
        />
      );
    }
    if (forceLight) {
      return (
        <img
          src={vazhariSymbol}
          alt="VAZHARI"
          className={symbolClass}
          loading="eager"
        />
      );
    }
    return (
      <>
        <img
          src={vazhariSymbol}
          alt="VAZHARI"
          className={`dark:hidden ${symbolClass}`}
          loading="eager"
        />
        <img
          src={vazhariSymbolDark}
          alt="VAZHARI"
          className={`hidden dark:block ${symbolClass}`}
          loading="eager"
        />
      </>
    );
  };

  // 1. SYMBOL ONLY
  if (effectiveVariant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} aria-label="VAZHARI">
        {renderSymbol()}
      </div>
    );
  }

  // 2. WORDMARK ONLY (Clean typography without bitmap artifacts)
  if (effectiveVariant === 'wordmark') {
    return (
      <div className={`inline-flex flex-col justify-center select-none ${className}`} aria-label="VAZHARI">
        <span className={`font-black tracking-[0.06em] text-slate-900 dark:text-[#F8FAFC] leading-none ${textSize} ${wordmarkClassName}`}>
          VAZHARI
        </span>
        {showTagline && (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagSize}`}>
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
        <div className="flex items-center justify-center mb-2.5">
          {renderSymbol()}
        </div>
        <span className={`font-black tracking-[0.08em] text-slate-900 dark:text-[#F8FAFC] leading-none ${textSize} ${wordmarkClassName}`}>
          VAZHARI
        </span>
        <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-1 leading-none ${tagSize}`}>
          {taglineText}
        </span>
      </div>
    );
  }

  // 4. HORIZONTAL ICON + WORDMARK (Default for Headers, Sidebar, Top Bar)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        {renderSymbol()}
      </div>

      <div className={`flex flex-col justify-center ${wordmarkClassName}`}>
        <span className={`font-black tracking-[0.06em] text-slate-900 dark:text-[#F8FAFC] leading-none ${textSize}`}>
          VAZHARI
        </span>
        {showTagline && (
          <span className={`font-medium text-[#64748B] dark:text-[#94A3B8] mt-0.5 leading-none ${tagSize}`}>
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
