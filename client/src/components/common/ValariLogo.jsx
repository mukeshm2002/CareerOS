import React from 'react';

/**
 * VALARI Brand Logo Component
 * Geometric "V" with upward-forward growth motion and warm orange-yellow gradient.
 * Inspired by Tamil "வளர்" (Grow).
 */
export const ValariLogo = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  className = '',
  iconOnly = false,
}) => {
  const sizeMap = {
    xs: { icon: 20, text: 'text-sm', markW: 20, markH: 20 },
    sm: { icon: 24, text: 'text-base', markW: 24, markH: 24 },
    md: { icon: 32, text: 'text-lg', markW: 32, markH: 32 },
    lg: { icon: 40, text: 'text-xl', markW: 40, markH: 40 },
    xl: { icon: 48, text: 'text-2xl', markW: 48, markH: 48 },
    '2xl': { icon: 64, text: 'text-3xl', markW: 64, markH: 64 },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Geometric V Mark SVG with upward-forward growth momentum
  const LogoMark = (
    <svg
      width={currentSize.markW}
      height={currentSize.markH}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <defs>
        {/* Brand Orange to Golden Yellow Gradient */}
        <linearGradient id="valariGradPrimary" x1="6" y1="42" x2="42" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="60%" stopColor="#FF9E00" />
          <stop offset="100%" stopColor="#FFC400" />
        </linearGradient>
        <linearGradient id="valariGradAccent" x1="18" y1="40" x2="44" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#FFC400" />
        </linearGradient>
      </defs>

      {/* Background Rounded Shield / Tile */}
      <rect width="48" height="48" rx="13" fill="#0D121C" />

      {/* Geometric V - Primary Downward/Upward Arm */}
      {/* Left arm starts at (11, 13) and leads down to vertex (22, 36) */}
      <path
        d="M11 13L21.5 35.5C22.1 36.8 23.9 36.8 24.5 35.5L37 13"
        stroke="url(#valariGradPrimary)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Forward Arrow Dynamic Accent on right arm: elevated forward slash pointing northeast */}
      <path
        d="M27.5 24L37 8"
        stroke="url(#valariGradAccent)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Arrowhead / Forward Motion Tip */}
      <path
        d="M29 8H37V16"
        stroke="url(#valariGradAccent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (iconOnly || !showWordmark) {
    return <div className={`inline-flex items-center justify-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {LogoMark}
      <div className="flex flex-col justify-center leading-none select-none">
        <span
          className={`font-black tracking-tight text-slate-900 dark:text-[#F8FAFC] ${currentSize.text}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          VALARI
        </span>
        {showTagline && (
          <span className="text-[10px] font-semibold tracking-wider uppercase text-[#FF7A00] mt-0.5">
            Grow Forward
          </span>
        )}
      </div>
    </div>
  );
};
