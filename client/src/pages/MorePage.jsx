import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Briefcase,
  Award,
  GraduationCap,
  RotateCcw,
  Bell,
  Settings,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const MorePage = () => {
  const { user } = useAuthStore();
  const displayName = user?.fullName || 'Professional';

  const menuSections = [
    {
      title: 'CAREER',
      items: [
        {
          name: 'Opportunities',
          path: '/app/opportunities',
          icon: Briefcase,
          desc: 'Job applications, freelance leads & pipeline',
        },
        {
          name: 'Portfolio',
          path: '/app/portfolio',
          icon: Award,
          desc: 'Work artifacts, live demos & proof of work',
        },
        {
          name: 'Learning',
          path: '/app/learning',
          icon: GraduationCap,
          desc: 'Modules, skill tracks & structured practice',
        },
      ],
    },
    {
      title: 'REFLECTION',
      items: [
        {
          name: 'Reviews',
          path: '/app/reviews',
          icon: RotateCcw,
          desc: 'Weekly reflections, retrospectives & snapshots',
        },
        {
          name: 'Reminders',
          path: '/app/reminders',
          icon: Bell,
          desc: 'Daily focus check-ins & notification settings',
        },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        {
          name: 'Settings',
          path: '/app/settings',
          icon: Settings,
          desc: 'Target roles, routine, timezone & preferences',
        },
        {
          name: 'Desktop Overview',
          path: '/app/overview',
          icon: Compass,
          desc: 'Full desktop analytics & high-level mission control',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-[#28324A] pb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">More</h1>
        <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
          Explore secondary career tools, pipelines, reflections, and settings.
        </p>
      </div>

      {/* Menu Groups */}
      <div className="space-y-6">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-400 dark:text-[#64748B] uppercase tracking-wider px-1">
              {section.title}
            </h2>
            <div className="bg-white dark:bg-[#121829] rounded-2xl border border-slate-200/80 dark:border-[#28324A] divide-y divide-slate-100 dark:divide-[#28324A] shadow-xs overflow-hidden">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    className="flex items-center justify-between min-h-[52px] px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#181F34] transition active:bg-slate-100 dark:active:bg-[#1D2540] group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-[#181F34] text-slate-600 dark:text-[#CBD5E1] group-hover:text-[#6C5CE7] dark:group-hover:text-[#8B7CF6] flex items-center justify-center shrink-0 transition-colors">
                        <Icon size={18} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-[#F8FAFC] leading-tight">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-[#94A3B8] mt-0.5 truncate">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 dark:text-[#64748B] shrink-0 ml-2 group-hover:text-slate-500 dark:group-hover:text-[#CBD5E1] transition-colors" />
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
