import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  SunMedium,
  Target,
  CheckSquare,
  TrendingUp,
  LayoutGrid,
} from 'lucide-react';

export const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      label: 'Today',
      to: '/app/today',
      icon: SunMedium,
      isActive: currentPath === '/app' || currentPath === '/app/today',
    },
    {
      label: 'Plan',
      to: '/app/goals',
      icon: Target,
      isActive:
        currentPath.startsWith('/app/goals') ||
        currentPath.startsWith('/app/roadmap') ||
        currentPath.startsWith('/app/skills') ||
        currentPath.startsWith('/app/schedule'),
    },
    {
      label: 'Work',
      to: '/app/tasks',
      icon: CheckSquare,
      isActive:
        currentPath.startsWith('/app/tasks') ||
        currentPath.startsWith('/app/projects'),
    },
    {
      label: 'Progress',
      to: '/app/progress',
      icon: TrendingUp,
      isActive: currentPath.startsWith('/app/progress'),
    },
    {
      label: 'More',
      to: '/app/more',
      icon: LayoutGrid,
      isActive:
        currentPath.startsWith('/app/more') ||
        currentPath.startsWith('/app/opportunities') ||
        currentPath.startsWith('/app/portfolio') ||
        currentPath.startsWith('/app/learning') ||
        currentPath.startsWith('/app/reviews') ||
        currentPath.startsWith('/app/reminders') ||
        currentPath.startsWith('/app/settings') ||
        currentPath.startsWith('/app/overview'),
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#121829]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-[#28324A] shadow-xs pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-16 items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all ${
                active
                  ? 'text-[#6C5CE7] dark:text-[#8B7CF6]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              <div
                className={`relative flex items-center justify-center h-8 w-11 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#EFEDFF] dark:bg-[#272344]'
                    : 'bg-transparent'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
              </div>
              <span
                className={`text-[11px] tracking-tight mt-0.5 leading-none select-none ${
                  active ? 'font-semibold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
