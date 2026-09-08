import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit3,
  Calendar,
  ChevronLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { workLogService } from '../services/workLogService';
import { QuickNoteSheet } from '../components/workLog/QuickNoteSheet';

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  // dateStr is 'YYYY-MM-DD'
  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[targetDate.getMonth()];
  const day = targetDate.getDate();

  if (dateStr === todayStr) {
    return { badge: 'Today', label: `${month} ${day}` };
  }
  if (dateStr === yesterdayStr) {
    return { badge: 'Yesterday', label: `${month} ${day}` };
  }
  return { badge: null, label: `${month} ${day}, ${targetDate.getFullYear()}` };
}

export const WorkLogHistoryPage = () => {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Queries
  const {
    data: todayData,
    isLoading: isTodayLoading,
  } = useQuery({
    queryKey: ['workLog', 'today'],
    queryFn: () => workLogService.getToday(),
  });

  const {
    data: historyData,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['workLog', 'history'],
    queryFn: () => workLogService.listHistory({ limit: 50 }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['workLog', 'stats'],
    queryFn: () => workLogService.getStats(),
  });

  const todayLog = todayData?.data || null;
  const history = historyData?.data || [];
  const stats = statsData?.data || { daysLoggedThisWeek: 0, daysLoggedThisMonth: 0 };

  const hasTodayLog = Boolean(
    todayLog && (
      todayLog.workedOn?.trim() ||
      todayLog.learned?.trim() ||
      todayLog.blockers?.trim() ||
      todayLog.nextStep?.trim()
    )
  );

  const handleEdit = (log) => {
    setSelectedNote(log);
    setSheetOpen(true);
  };

  const handleNewToday = () => {
    setSelectedNote(todayLog);
    setSheetOpen(true);
  };

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['workLog'] });
    queryClient.invalidateQueries({ queryKey: ['todayContext'] });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080B14] pb-24 sm:pb-16 text-slate-900 dark:text-[#F8FAFC]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        
        {/* Navigation / Header */}
        <div className="space-y-3">
          <Link
            to="/app/today"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] transition"
          >
            <ChevronLeft size={16} />
            <span>Back to Today</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen size={22} className="text-[#6C5CE7] dark:text-[#8B7CF6]" />
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                  Career Journal
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
                What did I do for my career today?
              </p>
            </div>

            <button
              onClick={handleNewToday}
              className="h-11 px-4 rounded-xl bg-[#6C5CE7] hover:bg-[#5A4AD1] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition active:scale-95 shrink-0"
            >
              {hasTodayLog ? (
                <>
                  <Edit3 size={15} />
                  <span>Edit Today's Note</span>
                </>
              ) : (
                <>
                  <Plus size={16} />
                  <span>Add Today's Note</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Factual Metrics (No vanity scores) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-[#121829] border border-slate-200/80 dark:border-[#28324A] rounded-2xl p-4 shadow-xs">
            <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">
              {stats.daysLoggedThisWeek ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5 block">
              Days logged this week
            </span>
          </div>

          <div className="bg-white dark:bg-[#121829] border border-slate-200/80 dark:border-[#28324A] rounded-2xl p-4 shadow-xs">
            <span className="text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] block">
              {stats.daysLoggedThisMonth ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-[#94A3B8] font-medium mt-0.5 block">
              Days logged this month
            </span>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-[#64748B]">
              Chronological Logs
            </h2>
            <span className="text-xs text-slate-400 dark:text-[#64748B]">
              {history.length} {history.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {isHistoryLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-400 dark:text-[#94A3B8]">
              <Loader2 size={24} className="animate-spin text-[#6C5CE7]" />
              <p className="text-xs">Loading career journal...</p>
            </div>
          ) : isHistoryError ? (
            <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle size={16} />
                <span>Failed to load journal logs</span>
              </div>
              <button
                onClick={() => refetchHistory()}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#121829] border border-rose-300 dark:border-rose-800 text-xs font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white dark:bg-[#121829] border border-slate-200/80 dark:border-[#28324A] rounded-2xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-[#7C6CF2]/10 border border-violet-100 dark:border-[#7C6CF2]/20 flex items-center justify-center mx-auto text-[#6C5CE7] dark:text-[#8B7CF6]">
                <BookOpen size={22} />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                  No journal entries yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Start recording what you worked on and learned each day to build momentum in your career.
                </p>
              </div>
              <button
                onClick={handleNewToday}
                className="h-10 px-5 rounded-xl bg-[#6C5CE7] hover:bg-[#5A4AD1] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus size={15} />
                <span>Add Today's Note</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {history.map((log) => {
                const dateMeta = formatDateLabel(log.logDate);
                const isToday = dateMeta.badge === 'Today';

                return (
                  <div
                    key={log.id}
                    className={`bg-white dark:bg-[#121829] border ${
                      isToday
                        ? 'border-[#6C5CE7]/40 dark:border-[#8B7CF6]/40 shadow-sm'
                        : 'border-slate-200/80 dark:border-[#28324A]'
                    } rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs transition`}
                  >
                    {/* Entry Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#28324A]/60 pb-3">
                      <div className="flex items-center gap-2">
                        {dateMeta.badge && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isToday
                                ? 'bg-[#6C5CE7] text-white'
                                : 'bg-slate-100 dark:bg-[#181F34] text-slate-600 dark:text-[#94A3B8]'
                            }`}
                          >
                            {dateMeta.badge}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {dateMeta.label}
                        </span>
                      </div>

                      {isToday && (
                        <button
                          onClick={() => handleEdit(log)}
                          className="h-7 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#181F34] dark:hover:bg-[#28324A] text-slate-700 dark:text-[#CBD5E1] text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Edit3 size={12} />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Entry Content */}
                    <div className="space-y-3 text-xs divide-y divide-slate-100 dark:divide-[#28324A]/30">
                      {log.workedOn && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
                            Worked on
                          </span>
                          <p className="text-slate-800 dark:text-[#F8FAFC] font-medium whitespace-pre-line leading-relaxed">
                            {log.workedOn}
                          </p>
                        </div>
                      )}

                      {log.learned && (
                        <div className="pt-2.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#64748B] block">
                            Learned
                          </span>
                          <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line leading-relaxed">
                            {log.learned}
                          </p>
                        </div>
                      )}

                      {log.blockers && (
                        <div className="pt-2.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80 dark:text-rose-400/80 block">
                            Blockers
                          </span>
                          <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line leading-relaxed">
                            {log.blockers}
                          </p>
                        </div>
                      )}

                      {log.nextStep && (
                        <div className="pt-2.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C5CE7] dark:text-[#8B7CF6] block">
                            Next
                          </span>
                          <p className="text-slate-700 dark:text-[#CBD5E1] whitespace-pre-line leading-relaxed">
                            {log.nextStep}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Note Sheet */}
      <QuickNoteSheet
        isOpen={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedNote(null);
        }}
        initialData={selectedNote || todayLog}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
};
