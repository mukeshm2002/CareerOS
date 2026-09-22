import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { notificationService } from '../../services/notificationService';
import { BrandLogo } from '../common/BrandLogo';
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
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white dark:bg-[#080B08] border-b border-[#E5E7EB] dark:border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Clean [EYTHU symbol] EYTHU branding */}
        <NavLink to="/app/today" className="flex items-center py-1 shrink-0">
          <BrandLogo size="sm" variant="icon-wordmark" />
        </NavLink>

        {/* Right: Actions (Notification + Profile Avatar) */}
        <div className="flex items-center gap-1.5">
          {/* Notification Icon */}
          <button
            onClick={() => setNotificationSheetOpen(true)}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-[#A8B2A8] hover:text-slate-900 dark:hover:text-[#F5F7F5] hover:bg-slate-100 dark:hover:bg-[#121912] transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-[#2A7A3B] dark:bg-[#A3E635] text-white dark:text-[#080B08] text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#080B08]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Avatar */}
          <button
            onClick={() => setProfileSheetOpen(true)}
            className="h-10 w-10 flex items-center justify-center rounded-lg transition cursor-pointer"
            aria-label="User Profile Menu"
          >
            <div className="h-8 w-8 rounded-full bg-[#2A7A3B] dark:bg-[#162E1A] text-white dark:text-[#A3E635] font-semibold text-xs flex items-center justify-center border border-transparent dark:border-[#A3E635]/20">
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
