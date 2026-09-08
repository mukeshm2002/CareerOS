import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut, X, Compass, Bell, Shield, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

export const ProfileSheet = ({ isOpen, onClose }) => {
  const { user, refreshToken, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = user?.fullName || 'Career Member';
  const displayEmail = user?.email || '';
  const displayRole = user?.profile?.currentRole || user?.profile?.targetRole || 'Professional';
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    onClose();
    try {
      await authService.logout(refreshToken);
    } catch {
      // Ignore network errors
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full md:max-w-sm bg-white dark:bg-[#121829] rounded-t-[24px] md:rounded-2xl border-t md:border border-slate-200 dark:border-[#28324A] shadow-2xl z-10 overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200">
        {/* Mobile Pull Bar */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* User Card Header */}
        <div className="p-5 border-b border-slate-100 dark:border-[#28324A] flex items-start justify-between bg-slate-50/70 dark:bg-[#181F34]">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-[#6C5CE7] dark:bg-[#8B7CF6] text-white font-bold text-lg flex items-center justify-center shadow-md shadow-brand-600/20">
              {initial}
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC] leading-tight">{displayName}</h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5">{displayRole}</p>
              {displayEmail && <p className="text-[11px] text-slate-400 dark:text-[#64748B] mt-0.5">{displayEmail}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#181F34] transition"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-3 space-y-1">
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#181F34] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition"
          >
            <Settings size={18} className="text-slate-400 dark:text-[#94A3B8]" />
            <span>Profile & Settings</span>
          </NavLink>

          <NavLink
            to="/app/overview"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#181F34] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition"
          >
            <Compass size={18} className="text-slate-400 dark:text-[#94A3B8]" />
            <span>Desktop Overview Dashboard</span>
          </NavLink>

          <NavLink
            to="/app/reminders"
            onClick={onClose}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#CBD5E1] hover:bg-slate-50 dark:hover:bg-[#181F34] hover:text-slate-900 dark:hover:text-[#F8FAFC] transition"
          >
            <Bell size={18} className="text-slate-400 dark:text-[#94A3B8]" />
            <span>Notification & Reminders</span>
          </NavLink>
        </div>

        {/* Logout Action */}
        <div className="p-3 border-t border-slate-100 dark:border-[#28324A] bg-slate-50/50 dark:bg-[#121829] pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-[#F87171] hover:bg-rose-50 dark:hover:bg-[#EF4444]/10 border border-rose-200/60 dark:border-[#EF4444]/30 transition"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
