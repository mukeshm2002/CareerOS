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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0D121C]/95 backdrop-blur-md border-t border-[#E5E7EB] dark:border-[#263247] shadow-xs pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-[66px] items-center px-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all ${
                active
                  ? 'text-[#FF7A00]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <div
                className={`relative flex items-center justify-center h-8 w-12 rounded-xl transition-colors ${
                  active
                    ? 'bg-[#FFF3E4] dark:bg-[rgba(255,122,0,0.12)]'
                    : 'bg-transparent'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.2 : 1.75} className={active ? 'text-[#FF7A00]' : 'text-[#64748B] dark:text-[#94A3B8]'} />
              </div>
              <span
                className={`text-[11px] tracking-tight mt-0.5 leading-none select-none ${
                  active ? 'font-bold text-[#FF7A00]' : 'font-medium'
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
