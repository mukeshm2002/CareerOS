import React, { useState, useEffect } from 'react';
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
  BookOpen,
  Download,
  Check,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { pwaService } from '../services/pwaService';
import { PageHeader } from '../components/common/PageHeader';

export const MorePage = () => {
  const { user } = useAuthStore();
  const displayName = user?.fullName || 'Professional';
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(pwaService.isStandalone());
    const unsub = pwaService.onInstallChange(setCanInstall);
    return () => unsub();
  }, []);

  const menuSections = [
    {
      title: 'MY GROWTH',
      items: [
        {
          name: 'Communication',
          path: '/app/communication',
          icon: MessageSquare,
          desc: 'Speaking, writing, confidence & interview skills',
        },
        {
          name: 'Health',
          path: '/app/health',
          icon: Activity,
          desc: 'Movement, sleep, energy & wellbeing habits',
        },
      ],
    },
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
          name: 'Journal',
          path: '/app/work-log',
          icon: BookOpen,
          desc: 'Daily work logs, learnings, blockers & next steps',
        },
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
      <PageHeader
        icon={Compass}
        title="More"
        subtitle="Explore tools, pipelines, reflections, and settings."
      />

      {/* PWA Install Card (Section 5) */}
      {(canInstall || isStandalone) && (
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] p-4 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-brand-soft border border-[#FF7A00]/20 text-[#FF7A00] flex items-center justify-center shrink-0">
              <Download size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                {isStandalone ? 'EYTHU is installed' : 'Install EYTHU'}
              </p>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] truncate">
                {isStandalone
                  ? 'Running as standalone app on your home screen'
                  : 'Add EYTHU to your home screen for faster access.'}
              </p>
            </div>
          </div>

          {isStandalone ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 shrink-0">
              <Check size={12} strokeWidth={2.5} />
              <span>Installed</span>
            </span>
          ) : (
            <button
              onClick={() => pwaService.promptInstall()}
              className="h-9 px-4 rounded-xl bg-[#FF7A00] hover:bg-[#EA6700] text-white font-semibold text-xs transition active:scale-95 shrink-0 shadow-xs"
            >
              Install
            </button>
          )}
        </div>
      )}

      {/* Menu Groups */}
      <div className="space-y-6">
        {menuSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-2">
            <h2 className="text-xs font-semibold text-slate-400 dark:text-[#64748B] uppercase tracking-wider px-1">
              {section.title}
            </h2>
            <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-[#263247] divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.10)] shadow-xs overflow-hidden">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={iIdx}
                    to={item.path}
                    className="flex items-center justify-between min-h-[52px] px-4 py-3 hover:bg-slate-50 dark:hover:bg-[#161E2D] transition active:bg-slate-100 dark:active:bg-[#1A2434] group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-[#161E2D] text-slate-600 dark:text-[#CBD5E1] group-hover:text-[#FF7A00] dark:group-hover:text-[#FF8A1F] flex items-center justify-center shrink-0 transition-colors">
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

      {/* Brand Ownership Footer */}
      <div className="pt-4 pb-8 text-center select-none">
        <p className="text-xs font-bold text-slate-800 dark:text-[#F8FAFC]">EYTHU</p>
        <p className="text-[11px] font-semibold text-[#FF7A00] mt-0.5">Personal Growth System</p>
        <p className="text-[11px] text-slate-400 dark:text-[#64748B] mt-1">
          A product by TamZode Technology
        </p>
      </div>
    </div>
  );
};
