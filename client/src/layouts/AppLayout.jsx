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
import { BottomNav } from '../components/layout/BottomNav';
import { MobileHeader } from '../components/layout/MobileHeader';

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
    title: 'CAREER',
    items: [
      { name: 'Goals', path: '/app/goals', icon: Target },
      { name: 'Roadmap', path: '/app/roadmap', icon: Milestone },
      { name: 'Skills', path: '/app/skills', icon: BrainCircuit },
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
      { name: 'Overview', path: '/app/overview', icon: Compass },
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
    if (path.includes('/app/today')) return 'My Day';
    if (path.includes('/app/tasks')) return 'Tasks';
    if (path.includes('/app/schedule')) return 'Schedule';
    if (path.includes('/app/goals')) return 'Goals';
    if (path.includes('/app/roadmap')) return 'Roadmap';
    if (path.includes('/app/skills')) return 'Skills';
    if (path.includes('/app/opportunities')) return 'Opportunities';
    if (path.includes('/app/projects')) return 'Projects';
    if (path.includes('/app/learning')) return 'Learning';
    if (path.includes('/app/progress')) return 'Progress';
    if (path.includes('/app/reviews')) return 'Reviews';
    if (path.includes('/app/reminders')) return 'Reminders';
    if (path.includes('/app/settings')) return 'Settings';
    return 'CareerOS';
  };

  const displayName = user?.fullName || 'Professional';
  const displayRole = user?.profile?.currentRole || user?.profile?.targetRole || 'Member';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#121829] border-r border-slate-200 dark:border-[#28324A] select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-[#28324A] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#6C5CE7] dark:bg-[#8B7CF6] flex items-center justify-center text-white font-bold text-lg shadow-xs">
            C
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-[#F8FAFC] text-base leading-tight tracking-tight">CareerOS</h1>
            <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] font-medium">Personal Career Operating System</p>
          </div>
        </div>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#181F34]"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigationGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.title && (
              <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-[#64748B] uppercase mb-2">
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
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#EFEDFF] dark:bg-[#272344] text-[#6C5CE7] dark:text-[#8B7CF6] font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#181F34]'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom User Profile Card */}
      <div className="p-3 border-t border-slate-100 dark:border-[#28324A] bg-slate-50/50 dark:bg-[#121829]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#181F34] border border-slate-200/70 dark:border-[#28324A] shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-100 dark:bg-[#272344] text-[#6C5CE7] dark:text-[#8B7CF6] font-semibold text-xs flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-[#F8FAFC] truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 dark:text-[#94A3B8] truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 dark:text-[#94A3B8] hover:text-red-600 dark:hover:text-[#F87171] hover:bg-red-50 dark:hover:bg-[#EF4444]/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#0B1020]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-1 flex-col bg-white dark:bg-[#121829]">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Header (md:hidden) */}
        <MobileHeader />

        {/* Desktop Top Header (hidden md:flex) */}
        <header className="hidden md:flex h-16 bg-white dark:bg-[#121829] border-b border-slate-200 dark:border-[#28324A] items-center justify-between px-6 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-[#181F34]"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 dark:text-[#64748B] font-medium hidden sm:inline">CareerOS</span>
              <ChevronRight size={14} className="text-slate-300 dark:text-[#28324A] hidden sm:inline" />
              <span className="text-slate-900 dark:text-[#F8FAFC] font-semibold text-base">{getPageTitle()}</span>
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

            {/* Search Input Placeholder */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search CareerOS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181F34] border border-slate-200 dark:border-[#28324A] text-xs rounded-xl pl-9 pr-3 py-2 text-slate-700 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-brand-500 dark:focus:ring-[#8B7CF6] focus:bg-white dark:focus:bg-[#181F34] transition-all"
              />
            </div>

            {/* Notifications Button & Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition-colors ${
                  notificationOpen
                    ? 'bg-[#EFEDFF] dark:bg-[#272344] text-[#6C5CE7] dark:text-[#8B7CF6]'
                    : 'text-slate-500 dark:text-[#CBD5E1] hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#181F34]'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#6C5CE7] dark:bg-[#8B7CF6] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#121829] shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#121829] border border-slate-200 dark:border-[#28324A] shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in-50 duration-150">
                  <div className="p-3.5 border-b border-slate-100 dark:border-[#28324A] flex items-center justify-between bg-slate-50/50 dark:bg-[#181F34]/60">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#EFEDFF] dark:bg-[#272344] text-[#6C5CE7] dark:text-[#8B7CF6] text-[10px] font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="text-[11px] font-medium text-[#6C5CE7] dark:text-[#8B7CF6] hover:text-[#5B4BD8] dark:hover:text-[#9D91FF] flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#28324A]">
                    {notificationsLoading ? (
                      <div className="p-6 text-center text-xs text-slate-400 dark:text-[#94A3B8]">Loading notifications...</div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 dark:bg-[#181F34] text-slate-400 dark:text-[#94A3B8] flex items-center justify-center mb-2">
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
                            !notif.readAt ? 'bg-brand-50/30 dark:bg-[#272344]/50 hover:bg-brand-50/50 dark:hover:bg-[#272344]/80' : 'hover:bg-slate-50 dark:hover:bg-[#181F34]'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              {!notif.readAt && (
                                <span className="h-2 w-2 rounded-full bg-[#6C5CE7] dark:bg-[#8B7CF6] shrink-0" />
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
                              className="p-1 rounded-lg text-slate-400 hover:text-[#6C5CE7] dark:hover:text-[#8B7CF6] hover:bg-white dark:hover:bg-[#181F34] transition-colors shrink-0"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-slate-100 dark:border-[#28324A] bg-slate-50/50 dark:bg-[#181F34]/40 flex items-center justify-between text-xs">
                    <NavLink
                      to="/app/reminders"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] font-semibold text-[#6C5CE7] dark:text-[#8B7CF6] hover:text-[#5B4BD8] dark:hover:text-[#9D91FF] flex items-center gap-1 transition-colors"
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
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-slate-200 dark:border-[#28324A] hover:bg-slate-50 dark:hover:bg-[#181F34] transition-colors"
            >
              <div className="h-6 w-6 rounded-md bg-[#6C5CE7] dark:bg-[#8B7CF6] text-white text-[11px] font-bold flex items-center justify-center">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-[#CBD5E1] hidden md:inline">{displayName.split(' ')[0]}</span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>

        {/* Mobile Fixed Bottom Navigation (md:hidden) */}
        <BottomNav />
      </div>
    </div>
  );
};
