import React from 'react';
import valariSymbol from '../../assets/valari-symbol.png';
import valariSymbolDark from '../../assets/valari-symbol-dark.png';
import valariWordmark from '../../assets/valari-wordmark.png';
import valariWordmarkDark from '../../assets/valari-wordmark-dark.png';
import valariLockup from '../../assets/valari-lockup.png';
import valariLockupDark from '../../assets/valari-lockup-dark.png';

/**
 * Official VALARI Brand Logo Component
 * 
 * The single source of truth for the VALARI product brand identity:
 * - Stylized V-shaped mark with charcoal left stroke and orange-to-gold upward arrow
 * - Official VALARI typography & "GROW FORWARD" lockup
 * 
 * Supported variants:
 * 1. 'symbol' (or 'icon'): Only the official V + upward arrow symbol.
 * 2. 'wordmark': Official VALARI wordmark typography.
 * 3. 'lockup' (or 'full'): Full vertical brand lockup (Symbol + Wordmark + Tagline).
 * 4. 'icon-wordmark': Horizontal lockup of official symbol + wordmark.
 */
export const ValariLogo = ({
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
  if (iconOnly || (!showWordmark && variant !== 'lockup')) {
    effectiveVariant = 'symbol';
  } else if (variant === 'icon') {
    effectiveVariant = 'symbol';
  } else if (variant === 'full') {
    effectiveVariant = 'lockup';
  }

  // Symbol sizing maps
  const symbolSizeClasses = {
    xs: 'h-5 w-auto',
    sm: 'h-6.5 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto',
    xl: 'h-14 w-auto',
    '2xl': 'h-18 w-auto',
  };

  // Wordmark sizing maps
  const wordmarkSizeClasses = {
    xs: 'h-3.5 w-auto',
    sm: 'h-4.5 w-auto',
    md: 'h-5.5 w-auto',
    lg: 'h-7 w-auto',
    xl: 'h-9 w-auto',
    '2xl': 'h-11 w-auto',
  };

  // Lockup sizing maps
  const lockupSizeClasses = {
    xs: 'w-28 max-w-full h-auto',
    sm: 'w-36 max-w-full h-auto',
    md: 'w-44 max-w-full h-auto',
    lg: 'w-52 max-w-full h-auto',
    xl: 'w-60 max-w-full h-auto',
    '2xl': 'w-72 max-w-full h-auto',
  };

  const symbolClass = `${symbolSizeClasses[size] || symbolSizeClasses.md} object-contain shrink-0 ${symbolClassName}`;
  const wordmarkClass = `${wordmarkSizeClasses[size] || wordmarkSizeClasses.md} object-contain shrink-0 ${wordmarkClassName}`;
  const lockupClass = `${lockupSizeClasses[size] || lockupSizeClasses.md} object-contain mx-auto ${className}`;

  // 1. FULL BRAND LOCKUP (Used on Login, Register, Onboarding, Splash)
  if (effectiveVariant === 'lockup') {
    if (forceDark) {
      return (
        <div className={`inline-flex flex-col items-center justify-center ${className}`}>
          <img
            src={valariLockupDark}
            alt="VALARI — Grow Forward"
            className={lockupClass}
            loading="eager"
          />
        </div>
      );
    }
    if (forceLight) {
      return (
        <div className={`inline-flex flex-col items-center justify-center ${className}`}>
          <img
            src={valariLockup}
            alt="VALARI — Grow Forward"
            className={lockupClass}
            loading="eager"
          />
        </div>
      );
    }
    return (
      <div className={`inline-flex flex-col items-center justify-center ${className}`}>
        <img
          src={valariLockup}
          alt="VALARI — Grow Forward"
          className={`dark:hidden ${lockupClass}`}
          loading="eager"
        />
        <img
          src={valariLockupDark}
          alt="VALARI — Grow Forward"
          className={`hidden dark:block ${lockupClass}`}
          loading="eager"
        />
      </div>
    );
  }

  // 2. VALARI SYMBOL (Only the official V + arrow symbol)
  if (effectiveVariant === 'symbol') {
    if (forceDark) {
      return (
        <div className={`inline-flex items-center justify-center ${className}`} aria-label="VALARI">
          <img
            src={valariSymbolDark}
            alt="VALARI"
            className={symbolClass}
            loading="eager"
          />
        </div>
      );
    }
    if (forceLight) {
      return (
        <div className={`inline-flex items-center justify-center ${className}`} aria-label="VALARI">
          <img
            src={valariSymbol}
            alt="VALARI"
            className={symbolClass}
            loading="eager"
          />
        </div>
      );
    }
    return (
      <div className={`inline-flex items-center justify-center ${className}`} aria-label="VALARI">
        <img
          src={valariSymbol}
          alt="VALARI"
          className={`dark:hidden ${symbolClass}`}
          loading="eager"
        />
        <img
          src={valariSymbolDark}
          alt="VALARI"
          className={`hidden dark:block ${symbolClass}`}
          loading="eager"
        />
      </div>
    );
  }

  // 3. VALARI WORDMARK ONLY
  if (effectiveVariant === 'wordmark') {
    if (forceDark) {
      return (
        <div className={`inline-flex items-center ${className}`} aria-label="VALARI">
          <img
            src={valariWordmarkDark}
            alt="VALARI"
            className={wordmarkClass}
            loading="eager"
          />
        </div>
      );
    }
    if (forceLight) {
      return (
        <div className={`inline-flex items-center ${className}`} aria-label="VALARI">
          <img
            src={valariWordmark}
            alt="VALARI"
            className={wordmarkClass}
            loading="eager"
          />
        </div>
      );
    }
    return (
      <div className={`inline-flex items-center ${className}`} aria-label="VALARI">
        <img
          src={valariWordmark}
          alt="VALARI"
          className={`dark:hidden ${wordmarkClass}`}
          loading="eager"
        />
        <img
          src={valariWordmarkDark}
          alt="VALARI"
          className={`hidden dark:block ${wordmarkClass}`}
          loading="eager"
        />
      </div>
    );
  }

  // 4. ICON + WORDMARK (Horizontal side-by-side for headers & sidebars)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Symbol */}
      <div className="shrink-0 flex items-center justify-center">
        <img
          src={valariSymbol}
          alt="VALARI"
          className={`dark:hidden ${symbolClass}`}
          loading="eager"
        />
        <img
          src={valariSymbolDark}
          alt="VALARI"
          className={`hidden dark:block ${symbolClass}`}
          loading="eager"
        />
      </div>

      {/* Official Wordmark or Tagline text */}
      <div className={`flex flex-col justify-center select-none ${wordmarkClassName}`}>
        <div className="flex items-center">
          <img
            src={valariWordmark}
            alt="VALARI"
            className={`dark:hidden ${wordmarkClass}`}
            loading="eager"
          />
          <img
            src={valariWordmarkDark}
            alt="VALARI"
            className={`hidden dark:block ${wordmarkClass}`}
            loading="eager"
          />
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium tracking-normal text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
