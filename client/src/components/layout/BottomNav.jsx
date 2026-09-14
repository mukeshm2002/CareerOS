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
        currentPath.startsWith('/app/communication') ||
        currentPath.startsWith('/app/health') ||
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#0B0F17] border-t border-[#E5E7EB] dark:border-[#253044] pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-[64px] items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center h-full py-1 transition-colors select-none ${
                active
                  ? 'text-[#FF7A00]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#111827] dark:hover:text-[#F8FAFC]'
              }`}
            >
              <div className="relative flex items-center justify-center h-6 w-6">
                <Icon
                  size={20}
                  strokeWidth={active ? 2.2 : 1.75}
                  className={active ? 'text-[#FF7A00]' : 'text-[#64748B] dark:text-[#94A3B8]'}
                />
              </div>
              <span
                className={`text-[11px] tracking-tight mt-1 leading-none ${
                  active ? 'font-semibold text-[#FF7A00]' : 'font-medium text-[#64748B] dark:text-[#94A3B8]'
                }`}
              >
                {item.label}
              </span>
              {/* Subtle active indicator dot */}
              <span
                className={`h-1 w-1 rounded-full mt-1 transition-all ${
                  active ? 'bg-[#FF7A00] opacity-100' : 'bg-transparent opacity-0'
                }`}
              />
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
