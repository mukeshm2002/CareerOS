import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notificationService';
import { NotificationSheet } from './NotificationSheet';
import { ProfileSheet } from './ProfileSheet';

export const MobileHeader = () => {
  const { user } = useAuthStore();
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.unreadCount ?? 0;

  const displayName = user?.fullName || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white/95 dark:bg-[#080B14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[rgba(148,163,184,0.14)] px-4 flex items-center justify-between z-30 shrink-0">
        {/* Brand Left */}
        <NavLink to="/app/today" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-[#7C6CF2] flex items-center justify-center text-white font-bold text-sm shadow-xs">
            C
          </div>
          <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-base tracking-tight">CareerOS</span>
        </NavLink>

        {/* Actions Right (44px touch targets) */}
        <div className="flex items-center gap-1">
          {/* Notification Button */}
          <button
            onClick={() => setNotificationSheetOpen(true)}
            className="relative h-11 w-11 flex items-center justify-center rounded-xl text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#192235] active:scale-95 transition"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-[#7C6CF2] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#080B14]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar Button */}
          <button
            onClick={() => setProfileSheetOpen(true)}
            className="h-11 w-11 flex items-center justify-center rounded-xl active:scale-95 transition"
            aria-label="User Profile Menu"
          >
            <div className="h-9 w-9 rounded-full bg-[#7C6CF2] text-white font-semibold text-xs flex items-center justify-center ring-2 ring-[#7C6CF2]/20 dark:ring-[rgba(124,108,242,0.30)]">
              {initial}
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Sheets */}
      <NotificationSheet
        isOpen={notificationSheetOpen}
        onClose={() => setNotificationSheetOpen(false)}
        unreadCount={unreadCount}
      />

      <ProfileSheet
        isOpen={profileSheetOpen}
        onClose={() => setProfileSheetOpen(false)}
      />
    </>
  );
};
