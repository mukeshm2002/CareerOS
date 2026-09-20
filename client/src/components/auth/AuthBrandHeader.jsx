import React from 'react';
import eythuLogo from '../../assets/brand/eythu-logo.png';

/**
 * Standardized Authentication Brand Header for EYTHU — Personal Growth System
 *
 * Uses the official approved EYTHU bow-and-arrow PNG logo.
 * SOURCE OF TRUTH: eythu-logo.png — do not substitute.
 *
 * Brand Hierarchy:
 *         [EYTHU MARK] (64px — auth recommended 56–72px)
 *              EYTHU  (bold, 22px)
 *       Personal Growth System  (12px muted)
 *              Plan. Act. Achieve. (13px tagline)
 */
export const AuthBrandHeader = ({
  marketingLine = 'Plan. Act. Achieve.',
  className = 'mb-8',
}) => {
  return (
    <div className={`text-center select-none ${className}`}>
      {/* 1. Official EYTHU bow-and-arrow logo mark (64px) */}
      <div className="flex justify-center">
        <img
          src={eythuLogo}
          alt="EYTHU"
          width={64}
          height={64}
          style={{
            width: '64px',
            height: '64px',
            maxWidth: '64px',
            maxHeight: '64px',
            objectFit: 'contain',
            aspectRatio: 'auto',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          loading="eager"
          draggable={false}
        />
      </div>

      {/* 2. EYTHU wordmark (22px bold) */}
      <h1 className="text-[22px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-none mt-3">
        EYTHU
      </h1>

      {/* 3. Descriptor */}
      <p className="text-[12px] font-medium text-slate-500 dark:text-[#94A3B8] mt-1 leading-none">
        Personal Growth System
      </p>

      {/* 4. Marketing Tagline */}
      {marketingLine && (
        <p className="text-[13px] text-slate-500 dark:text-[#94A3B8] mt-3">
          {marketingLine}
        </p>
      )}
    </div>
  );
};

export default AuthBrandHeader;
