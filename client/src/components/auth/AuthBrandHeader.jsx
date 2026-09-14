import React from 'react';
import vazhariMark from '../../assets/brand/vazhari-mark.svg';

/**
 * Standardized Authentication Brand Header for VAZHARI
 * 
 * Hierarchy:
 *           [VAZHARI MARK] (48px)
 *              (8px gap)
 *              VAZHARI (23px bold)
 *       Personal Growth System (12.5px)
 *              (12px gap)
 *   Plan your growth. Take action. Track progress. (13.5px)
 */
export const AuthBrandHeader = ({
  marketingLine = 'Plan your growth. Take action. Track progress.',
  className = 'mb-8',
}) => {
  return (
    <div className={`text-center select-none ${className}`}>
      {/* 1. Standalone VAZHARI mark (48px) */}
      <div className="flex justify-center">
        <img
          src={vazhariMark}
          alt="VAZHARI"
          width={48}
          height={48}
          style={{
            width: '48px',
            height: '48px',
            maxWidth: '48px',
            maxHeight: '48px',
            objectFit: 'contain',
            display: 'block',
          }}
          className="shrink-0 pointer-events-none"
          loading="eager"
        />
      </div>

      {/* 2. Gap 8px -> VAZHARI wordmark (23px bold) */}
      <h1 className="text-[23px] font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-none mt-2">
        VAZHARI
      </h1>

      {/* 3. Descriptor (12.5px) */}
      <p className="text-[12.5px] font-medium text-slate-500 dark:text-[#94A3B8] mt-1 leading-none">
        Personal Growth System
      </p>

      {/* 4. Marketing Line (13.5px) */}
      {marketingLine && (
        <p className="text-[13.5px] text-slate-500 dark:text-[#94A3B8] mt-3">
          {marketingLine}
        </p>
      )}
    </div>
  );
};

export default AuthBrandHeader;
