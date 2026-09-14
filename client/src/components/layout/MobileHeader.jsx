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
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-white dark:bg-[#0B0F17] border-b border-[#E5E7EB] dark:border-[#253044] px-4 flex items-center justify-between z-30 shrink-0">
        {/* Left: Clean [VAZHARI symbol] VAZHARI branding */}
        <NavLink to="/app/today" className="flex items-center py-1 shrink-0">
          <BrandLogo size="sm" variant="icon-wordmark" />
        </NavLink>

        {/* Right: Actions (Notification + Profile Avatar) */}
        <div className="flex items-center gap-1.5">
          {/* Notification Icon */}
          <button
            onClick={() => setNotificationSheetOpen(true)}
            className="relative h-10 w-10 flex items-center justify-center rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#151D2B] transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4 h-4 px-1 rounded-full bg-[#FF7A00] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0B0F17]">
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
            <div className="h-8 w-8 rounded-full bg-[#FF7A00] text-white font-semibold text-xs flex items-center justify-center">
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
