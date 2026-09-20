import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  SunMedium,
  CheckSquare,
  Calendar,
  Target,
  Milestone,
  BrainCircuit,
  MessageSquare,
  Activity,
  Briefcase,
  FolderGit2,
  Award,
  GraduationCap,
  TrendingUp,
  RotateCcw,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  ChevronRight,
  User as UserIcon,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';
import { detectBrowserTimezone } from '../utils/timezones';
import { pwaService } from '../services/pwaService';
import { BottomNav } from '../components/layout/BottomNav';
import { MobileHeader } from '../components/layout/MobileHeader';
import { BrandLogo } from '../components/common/BrandLogo';

const navigationGroups = [
  {
    title: 'EXECUTION',
    items: [
      { name: 'Today', path: '/app/today', icon: SunMedium },
      { name: 'Tasks', path: '/app/tasks', icon: CheckSquare },
      { name: 'Schedule', path: '/app/schedule', icon: Calendar },
    ],
  },
  {
    title: 'MY GROWTH',
    items: [
      { name: 'Goals', path: '/app/goals', icon: Target },
      { name: 'Roadmap', path: '/app/roadmap', icon: Milestone },
      { name: 'Skills', path: '/app/skills', icon: BrainCircuit },
      { name: 'Communication', path: '/app/communication', icon: MessageSquare },
      { name: 'Health', path: '/app/health', icon: Activity },
    ],
  },
  {
    title: 'CAREER',
    items: [
      { name: 'Opportunities', path: '/app/opportunities', icon: Briefcase },
      { name: 'Projects', path: '/app/projects', icon: FolderGit2 },
      { name: 'Portfolio', path: '/app/portfolio', icon: Award },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { name: 'Learning', path: '/app/learning', icon: GraduationCap },
      { name: 'Progress', path: '/app/progress', icon: TrendingUp },
      { name: 'Reviews', path: '/app/reviews', icon: RotateCcw },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Reminders', path: '/app/reminders', icon: Bell },
      { name: 'Settings', path: '/app/settings', icon: Settings },
    ],
  },
];

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const notificationRef = useRef(null);
  const queryClient = useQueryClient();

  const { user, refreshToken, clearAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const unsub = pwaService.onUpdateChange(setHasUpdate);
    return () => unsub();
  }, []);

  // Notification Queries
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000,
  });
  const unreadCount = unreadData?.unreadCount ?? 0;

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['notifications', 'recent'],
    queryFn: () => notificationService.listNotifications({ limit: 6 }),
    enabled: notificationOpen,
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    };
    if (notificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationOpen]);

  // Automatic timezone detection on first authenticated use if unconfigured or default UTC
  useEffect(() => {
    const syncBrowserTimezone = async () => {
      if (!user) return;
      const explicitChoice = localStorage.getItem('careeros_tz_explicit');
      if (explicitChoice) return;

      const currentTz = user.profile?.timezone;
      if (!currentTz || currentTz === 'UTC') {
        const detected = detectBrowserTimezone();
        if (detected && detected !== 'UTC' && detected !== currentTz) {
          try {
            await settingsService.updateProfile({ timezone: detected });
            useAuthStore.getState().updateUser({
              ...user,
              profile: { ...(user.profile || {}), timezone: detected },
            });
          } catch {
            // Silently ignore network errors
          }
        }
      }
    };
    syncBrowserTimezone();
  }, [user]);

  const handleLogout = async () => {
    try {
      await authService.logout(refreshToken);
    } catch {
      // Ignore network errors during logout
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format today's date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  // Derive current page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/app') return 'Overview';
    if (path.includes('/app/today')) return 'Today';
    if (path.includes('/app/tasks')) return 'Tasks';
    if (path.includes('/app/schedule')) return 'Schedule';
    if (path.includes('/app/goals')) return 'Goals';
    if (path.includes('/app/roadmap')) return 'Roadmap';
    if (path.includes('/app/skills')) return 'Skills';
    if (path.includes('/app/communication')) return 'Communication';
    if (path.includes('/app/health')) return 'Health';
    if (path.includes('/app/opportunities')) return 'Opportunities';
    if (path.includes('/app/projects')) return 'Projects';
    if (path.includes('/app/learning')) return 'Learning';
    if (path.includes('/app/progress')) return 'Progress';
    if (path.includes('/app/reviews')) return 'Reviews';
    if (path.includes('/app/reminders')) return 'Reminders';
    if (path.includes('/app/settings')) return 'Settings';
    return 'EYTHU';
  };

  const displayName = user?.fullName || 'User';
  const displayRole = user?.profile?.currentRole || user?.profile?.targetRole || 'Member';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#0B0F17] border-r border-[#E5E7EB] dark:border-[#253044] select-none">
      {/* Desktop Brand Header: [EYTHU symbol] EYTHU / Personal Growth System */}
      <div className="h-20 px-5 border-b border-[#E5E7EB] dark:border-[#253044] flex items-center justify-between shrink-0">
        <NavLink to="/app/today" className="flex items-center min-w-0">
          <BrandLogo size="md" variant="icon-wordmark" showTagline={true} taglineText="Personal Growth System" />
        </NavLink>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#151D2B]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.title && (
              <p className="px-3 text-[10px] font-bold tracking-[0.08em] text-[#64748B] uppercase mb-1.5">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-[#151D2B] text-slate-900 dark:text-[#F8FAFC] font-semibold'
                        : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#151D2B]/60'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={17}
                        className={`shrink-0 transition-colors ${
                          isActive
                            ? 'text-[#2A7A3B] dark:text-[#34A854]'
                            : 'text-[#64748B] dark:text-[#94A3B8]'
                        }`}
                      />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-[#E5E7EB] dark:border-[#253044] bg-[#F8FAFC] dark:bg-[#0B0F17]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#253044]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-lg bg-[#2A7A3B] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">{displayName}</p>
              <p className="text-[10px] text-slate-400 dark:text-[#94A3B8] truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-[#F87171] hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut size={15} />
          </button>
        </div>

        {/* Desktop Footer */}
        <div className="pt-2 text-center select-none">
          <p className="text-[10px] text-slate-400 dark:text-[#64748B]">
            © 2026 TamZode Technology. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B0F17]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 overflow-hidden">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 dark:bg-[#090D16]/80 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-1 flex-col bg-white dark:bg-[#0D121C]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header (md:hidden) */}
        <MobileHeader />

        {/* Desktop Top Header (hidden md:flex) */}
        <header className="hidden md:flex h-16 bg-white dark:bg-[#0B0F17] border-b border-[#E5E7EB] dark:border-[#253044] items-center justify-between px-6 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#151D2B]"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#64748B] font-semibold hidden sm:inline">EYTHU</span>
              <ChevronRight size={14} className="text-[#64748B] hidden sm:inline" />
              <span className="text-slate-900 dark:text-[#F8FAFC] font-bold text-base">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Greeting & Date */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC]">
                {getGreeting()}, {displayName.split(' ')[0]}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-[#94A3B8]">{todayFormatted}</span>
            </div>

            {/* Search Input */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search EYTHU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/70 dark:bg-[rgba(255,255,255,0.035)] border border-[#E5E7EB] dark:border-[#253044] text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2A7A3B] focus:border-[#2A7A3B] transition-all"
              />
            </div>

            {/* Notifications Button & Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className={`relative h-10 w-10 flex items-center justify-center rounded-xl transition-colors ${
                  notificationOpen
                    ? 'bg-[rgba(42,122,59,0.12)] text-[#2A7A3B]'
                    : 'text-slate-500 dark:text-[#CBD5E1] hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[rgba(255,255,255,0.04)]'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full bg-[#2A7A3B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0B0F17] shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#253044] shadow-2xl shadow-slate-900/15 z-50 overflow-hidden animate-in fade-in-50 duration-150">
                  <div className="p-3.5 border-b border-[#E5E7EB] dark:border-[#253044] flex items-center justify-between bg-slate-50/50 dark:bg-[#151D2B]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[rgba(42,122,59,0.14)] text-[#2A7A3B] text-[10px] font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="text-[11px] font-semibold text-[#2A7A3B] hover:text-[#22653A] flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#263247]">
                    {notificationsLoading ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-[#94A3B8]">Loading notifications...</div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-[#161E2D] text-slate-400 dark:text-[#94A3B8] flex items-center justify-center mb-2">
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-[#CBD5E1]">All caught up!</p>
                        <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] mt-0.5">No notifications right now.</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                            !notif.readAt ? 'bg-[rgba(42,122,59,0.06)] dark:bg-[rgba(42,122,59,0.10)] hover:bg-[rgba(42,122,59,0.12)]' : 'hover:bg-slate-50 dark:hover:bg-[#161E2D]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              {!notif.readAt && (
                                <span className="h-2 w-2 rounded-full bg-[#2A7A3B] shrink-0" />
                              )}
                              <p className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">{notif.title}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-[#CBD5E1] line-clamp-2 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-[#94A3B8] mt-1 inline-block">
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
                              className="p-1 rounded-lg text-slate-400 hover:text-[#2A7A3B] hover:bg-white dark:hover:bg-[#161E2D] transition-colors shrink-0 cursor-pointer"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-[#E5E7EB] dark:border-[#263247] bg-slate-50/50 dark:bg-[#161E2D] flex items-center justify-between text-xs">
                    <NavLink
                      to="/app/reminders"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] font-semibold text-[#2A7A3B] hover:text-[#22653A] flex items-center gap-1 transition-colors"
                    >
                      Reminders & Schedule
                      <ChevronRight size={13} />
                    </NavLink>
                    <NavLink
                      to="/app/settings"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] text-slate-400 dark:text-[#94A3B8] hover:text-slate-600 dark:hover:text-[#CBD5E1]"
                    >
                      Preferences
                    </NavLink>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Link */}
            <NavLink
              to="/app/settings"
              className="h-10 flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#263247] hover:bg-slate-100/70 dark:hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <div className="h-6 w-6 rounded-md bg-[#2A7A3B] text-white text-[11px] font-bold flex items-center justify-center">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-[#CBD5E1] hidden md:inline">{displayName.split(' ')[0]}</span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-[1320px] mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Subtle PWA Update Banner */}
        {hasUpdate && (
          <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 bg-[#111827] border border-[#2A7A3B]/40 rounded-2xl p-3 sm:px-4 shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#2A7A3B] animate-pulse" />
              <span className="text-xs font-semibold text-slate-200">EYTHU update available</span>
            </div>
            <button
              onClick={() => pwaService.updateApp()}
              className="h-8 px-3 rounded-xl bg-[#2A7A3B] hover:bg-[#22653A] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              Update
            </button>
          </div>
        )}

        {/* Mobile Fixed Bottom Navigation (md:hidden) */}
        <BottomNav />
      </div>
    </div>
  );
};
