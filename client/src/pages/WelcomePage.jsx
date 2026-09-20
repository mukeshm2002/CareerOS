import React from 'react';
import { Link } from 'react-router-dom';
import { EythuBrand } from '../components/common/BrandLogo';

export const WelcomePage = () => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-[#111827] dark:text-[#F8FAFC] flex flex-col justify-between px-6 py-8 sm:py-12 max-w-md mx-auto select-none">
      {/* Top: EYTHU branding */}
      <header className="pt-2">
        <EythuBrand size="sm" variant="icon-wordmark" />
      </header>

      {/* Center: Calm Product Entrance */}
      <main className="py-6 space-y-8">
        <div className="space-y-4">
          <h1 className="text-[28px] sm:text-[30px] font-bold tracking-tight leading-[1.15] text-[#111827] dark:text-[#F8FAFC]">
            Move forward,<br />
            with direction.
          </h1>
          <p className="text-[15px] sm:text-[16px] text-[#475569] dark:text-[#94A3B8] leading-relaxed max-w-xs sm:max-w-sm">
            Plan your career, strengthen your communication, and build healthier routines — one day at a time.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <Link
            to="/register"
            className="w-full h-12 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center transition shadow-xs shadow-[#2A7A3B]/20"
          >
            Get started
          </Link>

          <div className="text-center pt-1">
            <Link
              to="/login"
              className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC] transition"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom: Creator Endorsement */}
      <footer className="pb-2 text-center">
        <p className="text-xs text-[#64748B] dark:text-[#64748B] font-normal">
          EYTHU — A product by TamZode Technology
        </p>
      </footer>
    </div>
  );
};
