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

const navigationGroups = [
  {
    title: null,
    items: [
      { name: 'Overview', path: '/app', icon: Compass, end: true },
    ],
  },
  {
    title: 'TODAY',
    items: [
      { name: 'My Day', path: '/app/today', icon: SunMedium },
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-brand-500/30">
            C
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">CareerOS</h1>
            <p className="text-[11px] text-slate-400 font-medium">Personal Career Operating System</p>
          </div>
        </div>
        {mobileMenuOpen && (
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
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
              <p className="px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
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
                        ? 'bg-brand-50 text-brand-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-brand-100 text-brand-700 font-semibold text-xs flex items-center justify-center shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{displayName}</p>
              <p className="text-[11px] text-slate-400 truncate">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex w-72 flex-1 flex-col bg-white">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 font-medium hidden sm:inline">CareerOS</span>
              <ChevronRight size={14} className="text-slate-300 hidden sm:inline" />
              <span className="text-slate-900 font-semibold text-base">{getPageTitle()}</span>
            </div>
          </div>

          {/* Right Header Section */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Greeting & Date */}
            <div className="hidden lg:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">
                {getGreeting()}, {displayName.split(' ')[0]}
              </span>
              <span className="text-[11px] text-slate-400">{todayFormatted}</span>
            </div>

            {/* Search Input Placeholder */}
            <div className="relative hidden sm:block w-48 lg:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search CareerOS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white transition-all"
              />
            </div>

            {/* Notifications Button & Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen((prev) => !prev)}
                className={`relative p-2 rounded-xl transition-colors ${
                  notificationOpen
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-900/10 z-50 overflow-hidden animate-in fade-in-50 duration-150">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-slate-800">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-semibold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="text-[11px] font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notificationsLoading ? (
                      <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <div className="h-10 w-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                          <Bell size={18} />
                        </div>
                        <p className="text-xs font-semibold text-slate-700">All caught up!</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No notifications right now.</p>
                      </div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 transition-colors flex items-start justify-between gap-3 ${
                            !notif.readAt ? 'bg-brand-50/30 hover:bg-brand-50/50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              {!notif.readAt && (
                                <span className="h-2 w-2 rounded-full bg-brand-600 shrink-0" />
                              )}
                              <p className="text-xs font-semibold text-slate-800 truncate">{notif.title}</p>
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 inline-block">
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
                              className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition-colors shrink-0"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <NavLink
                      to="/app/reminders"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1 transition-colors"
                    >
                      Reminders & Schedule
                      <ChevronRight size={13} />
                    </NavLink>
                    <NavLink
                      to="/app/settings"
                      onClick={() => setNotificationOpen(false)}
                      className="text-[11px] text-slate-400 hover:text-slate-600"
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
              className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <div className="h-6 w-6 rounded-md bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-700 hidden md:inline">{displayName.split(' ')[0]}</span>
            </NavLink>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
