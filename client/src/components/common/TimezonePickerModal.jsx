import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Globe, Sparkles } from 'lucide-react';
import { TIMEZONES, getTimezoneInfo, detectBrowserTimezone, getUtcOffset } from '../../utils/timezones';

export const TimezonePickerModal = ({ isOpen, onClose, selectedTimezone, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const detectedTz = useMemo(() => detectBrowserTimezone(), []);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard navigation & ESC handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter timezones based on query
  const filteredTimezones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return TIMEZONES;

    return TIMEZONES.filter((tz) => {
      if (tz.name.toLowerCase().includes(q)) return true;
      if (tz.location.toLowerCase().includes(q)) return true;
      if (tz.value.toLowerCase().includes(q)) return true;
      if (tz.keywords?.some((k) => k.toLowerCase().includes(q))) return true;

      // Match offset like +05:30 or 05:30
      const offset = getUtcOffset(tz.value).toLowerCase();
      if (offset.includes(q)) return true;

      return false;
    });
  }, [searchQuery]);

  // Suggested timezones: detected browser timezone + current selected if different
  const suggestedTimezones = useMemo(() => {
    if (searchQuery.trim()) return []; // Hide suggested while actively searching
    const list = [];
    if (detectedTz) {
      const info = getTimezoneInfo(detectedTz);
      list.push({ ...info, tag: 'Browser Detected' });
    }
    if (selectedTimezone && selectedTimezone !== detectedTz) {
      const info = getTimezoneInfo(selectedTimezone);
      list.push({ ...info, tag: 'Current' });
    }
    return list;
  }, [detectedTz, selectedTimezone, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (tzValue) => {
    onSelect(tzValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet */}
      <div className="relative w-full sm:max-w-md bg-white dark:bg-[#111827] rounded-t-[24px] sm:rounded-2xl border border-slate-200 dark:border-[rgba(148,163,184,0.14)] shadow-2xl z-10 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[520px] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Mobile Pull Bar */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1 rounded-full bg-slate-300 dark:bg-slate-700/60" />
        </div>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-[rgba(148,163,184,0.14)] flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#131A2A]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#7C6CF2]/10 text-[#7C6CF2] dark:text-[#8B7CF6]">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-[#F8FAFC] leading-none">
                Select Timezone
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] mt-1">
                Used for reminders and daily schedules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#192235] transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar - Sticky */}
        <div className="p-3 border-b border-slate-100 dark:border-[rgba(148,163,184,0.10)] bg-white dark:bg-[#111827] shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#64748B]" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search timezone, city, or country..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-[#131A2A] border border-slate-200 dark:border-[rgba(148,163,184,0.18)] rounded-xl text-xs sm:text-sm text-slate-800 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#7C6CF2] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-[#F8FAFC]"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* List Content - Scrollable */}
        <div className="overflow-y-auto max-h-[320px] p-2 space-y-3 divide-y divide-slate-100 dark:divide-[rgba(148,163,184,0.06)]">
          {/* Suggested Group */}
          {suggestedTimezones.length > 0 && (
            <div className="space-y-1 pb-1">
              <div className="px-2.5 pt-1 pb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
                <Sparkles size={12} className="text-[#7C6CF2]" />
                <span>Suggested</span>
              </div>
              {suggestedTimezones.map((item) => {
                const isSelected = selectedTimezone === item.iana;
                return (
                  <button
                    key={`suggested-${item.iana}`}
                    onClick={() => handleSelect(item.iana)}
                    className={`w-full min-h-[46px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-[#7C6CF2]/10 dark:bg-[rgba(124,108,242,0.14)] text-[#7C6CF2] dark:text-[#F8FAFC] border border-[#7C6CF2]/20 dark:border-[rgba(124,108,242,0.30)]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#131A2A] text-slate-700 dark:text-[#CBD5E1]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold">{item.name}</span>
                        {item.tag && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#7C6CF2]/15 text-[#7C6CF2] dark:text-[#A99CFF] font-medium">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                        {item.location} · {item.offset}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-[#7C6CF2] dark:text-[#8B7CF6] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timezones Group */}
          <div className="space-y-1 pt-1">
            <div className="px-2.5 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
              {searchQuery ? 'Search Results' : 'All Timezones'}
            </div>

            {filteredTimezones.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-[#94A3B8] text-xs">
                No matching timezones found for "{searchQuery}"
              </div>
            ) : (
              filteredTimezones.map((tz) => {
                const isSelected = selectedTimezone === tz.value;
                const offset = getUtcOffset(tz.value);
                return (
                  <button
                    key={tz.value}
                    onClick={() => handleSelect(tz.value)}
                    className={`w-full min-h-[46px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-[#7C6CF2]/10 dark:bg-[rgba(124,108,242,0.14)] text-[#7C6CF2] dark:text-[#F8FAFC] border border-[#7C6CF2]/20 dark:border-[rgba(124,108,242,0.30)]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#131A2A] text-slate-700 dark:text-[#CBD5E1]'
                    }`}
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-semibold leading-snug">{tz.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-[#94A3B8]">
                        {tz.location} · {offset}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={16} className="text-[#7C6CF2] dark:text-[#8B7CF6] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
