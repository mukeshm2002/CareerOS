import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, X, ChevronRight } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

export const NotificationSheet = ({ isOpen, onClose, unreadCount }) => {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.listNotifications({ limit: 10 }),
    enabled: isOpen,
  });

  const recentNotifications = notificationsData?.notifications || [];

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Lock body scroll when sheet is open
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="relative w-full md:max-w-md bg-white dark:bg-[#111827] rounded-t-[24px] md:rounded-2xl border-t md:border border-slate-200 dark:border-[rgba(148,163,184,0.14)] shadow-2xl z-10 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 md:zoom-in-95 duration-200">
        {/* Mobile Pull Bar */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-[#192235]" />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-[rgba(148,163,184,0.10)] flex items-center justify-between bg-slate-50/70 dark:bg-[#131A2A]">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand-soft text-[#2A7A3B] text-[11px] font-semibold border border-[#2A7A3B]/25">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-[#2A7A3B] hover:text-[#22653A] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-[#192235] transition"
              >
                <CheckCheck size={14} />
                <span>Mark read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#192235] transition"
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.10)] min-h-[160px]">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-[#94A3B8]">Loading notifications...</div>
          ) : recentNotifications.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 dark:bg-[#192235] text-slate-400 dark:text-[#94A3B8] flex items-center justify-center mb-2">
                <Bell size={20} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC]">All caught up!</p>
              <p className="text-xs text-slate-400 dark:text-[#94A3B8]">No new notifications right now.</p>
            </div>
          ) : (
            recentNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 transition-colors flex items-start justify-between gap-3 ${
                  !notif.readAt ? 'bg-brand-soft/40 dark:bg-brand-soft/20' : 'bg-white dark:bg-[#111827]'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!notif.readAt && (
                      <span className="h-2 w-2 rounded-full bg-[#2A7A3B] shrink-0" />
                    )}
                    <p className="text-xs font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
                      {notif.title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-[#CBD5E1] leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-1.5 inline-block">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {!notif.readAt && (
                  <button
                    onClick={() => markReadMutation.mutate(notif.id)}
                    title="Mark as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-[#2A7A3B] hover:bg-white dark:hover:bg-[#192235] border border-slate-200 dark:border-[rgba(148,163,184,0.14)] transition shrink-0"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-[rgba(148,163,184,0.10)] bg-slate-50/70 dark:bg-[#131A2A] flex items-center justify-between text-xs pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
          <NavLink
            to="/app/reminders"
            onClick={onClose}
            className="text-xs font-medium text-[#2A7A3B] hover:text-[#22653A] flex items-center gap-1"
          >
            Manage Reminders
            <ChevronRight size={13} />
          </NavLink>
          <NavLink
            to="/app/settings"
            onClick={onClose}
            className="text-xs text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#CBD5E1]"
          >
            Preferences
          </NavLink>
        </div>
      </div>
    </div>
  );
};
