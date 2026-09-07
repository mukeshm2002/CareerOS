import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] px-4 text-center">
      <div className="h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <Compass size={28} />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <p className="text-base font-semibold text-slate-700 mt-1">Page Not Found</p>
      <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
        The destination you navigated to does not exist in this CareerOS workspace.
      </p>
      <Link
        to="/app"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm shadow-brand-600/30 transition-all"
      >
        <ArrowLeft size={14} />
        <span>Return to Overview</span>
      </Link>
    </div>
  );
};
