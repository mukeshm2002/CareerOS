import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalService } from '../features/goals/services/goalService';
import { planningService } from '../features/planning/services/planningService';
import {
  ArrowLeft,
  Target,
  Calendar,
  DollarSign,
  Milestone,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  Archive,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';

export const GoalDetailPage = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualStages, setManualStages] = useState([
    { title: 'Stage 1: Exploration & Planning', description: 'Analyze requirements and outline scope.' },
    { title: 'Stage 2: Execution & Proof of Work', description: 'Build deliverables and gather proof.' },
  ]);

  // Query Goal
  const { data: goalData, isLoading: goalLoading, isError: goalError, error } = useQuery({
    queryKey: ['goal', goalId],
    queryFn: () => goalService.getGoalById(goalId),
    enabled: !!goalId,
  });

  // Query Roadmap for this goal
  const { data: roadmapData, isLoading: roadmapLoading } = useQuery({
    queryKey: ['roadmap', goalId],
    queryFn: () => planningService.getRoadmapByGoal(goalId),
    enabled: !!goalId,
  });

  // Query Roadmap Template Preview (for preview modal)
  const goal = goalData?.data?.goal;
  const { data: previewData } = useQuery({
    queryKey: ['roadmap-preview', goal?.type, goal?.title],
    queryFn: () => planningService.getTemplatePreview(goal?.type, goal?.title),
    enabled: !!goal && showPreviewModal,
  });

  // Mutation: Goal Status
  const statusMutation = useMutation({
    mutationFn: (newStatus) => goalService.updateGoalStatus(goalId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Mutation: Create Roadmap from template
  const createTemplateRoadmapMutation = useMutation({
    mutationFn: () => planningService.createRoadmap(goalId, { useTemplate: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      setShowPreviewModal(false);
    },
  });

  // Mutation: Create Manual Roadmap
  const createManualRoadmapMutation = useMutation({
    mutationFn: (stages) =>
      planningService.createRoadmap(goalId, {
        useTemplate: false,
        title: manualTitle || `${goal?.title} Roadmap`,
        milestones: stages,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', goalId] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      setShowManualModal(false);
    },
  });

  if (goalLoading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (goalError || !goal) {
    return (
      <div className="space-y-4">
        <Link
          to="/app/goals"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={14} />
          <span>Back to Goals</span>
        </Link>
        <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error?.response?.data?.message || 'Goal not found or access unauthorized.'}</span>
        </div>
      </div>
    );
  }

  const formattedTargetDate = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Dec 31, 2026';

  const roadmap = roadmapData?.data?.roadmap;
  const milestones = roadmap?.milestones || [];
  const completedMilestones = milestones.filter((m) => m.status === 'COMPLETED').length;
  const currentMilestone = milestones.find((m) => m.status === 'IN_PROGRESS') || milestones.find((m) => m.status === 'NOT_STARTED');

  return (
    <div className="space-y-6">
      {/* Header Back & Action Row */}
      <div className="flex items-center justify-between">
        <Link
          to="/app/goals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Goals</span>
        </Link>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          {goal.status === 'ACTIVE' && (
            <button
              onClick={() => statusMutation.mutate('PAUSED')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              <PauseCircle size={14} />
              <span>Pause</span>
            </button>
          )}

          {goal.status === 'PAUSED' && (
            <button
              onClick={() => statusMutation.mutate('ACTIVE')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <PlayCircle size={14} />
              <span>Resume</span>
            </button>
          )}

          {goal.status !== 'COMPLETED' && (
            <button
              onClick={() => statusMutation.mutate('COMPLETED')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              <CheckCircle2 size={14} />
              <span>Complete</span>
            </button>
          )}

          {goal.status !== 'ARCHIVED' && (
            <button
              onClick={() => statusMutation.mutate('ARCHIVED')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
            >
              <Archive size={14} />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Goal Overview Card (Section 9) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-card space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            {goal.type?.replace('_', ' ')}
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
              goal.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : goal.status === 'PAUSED'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {goal.status}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Priority: {goal.priority}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">{goal.title}</h1>
          {goal.description && (
            <p className="text-xs md:text-sm text-slate-600 mt-2 leading-relaxed max-w-3xl">
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-500">Milestone Progress</span>
            <span className="text-brand-600 font-bold">{goal.progress || 0}% Completed</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${goal.progress || 0}%` }}
            />
          </div>
        </div>

        {/* Target Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-slate-400 block mb-1">Target Date</span>
            <span className="font-bold text-slate-800 text-sm">{formattedTargetDate}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-slate-400 block mb-1">Target Role</span>
            <span className="font-bold text-slate-800 text-sm">
              {goal.targetRole || 'Not specified'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
            <span className="text-slate-400 block mb-1">Target Compensation</span>
            <span className="font-bold text-slate-800 text-sm">
              {goal.targetSalary ? `${goal.targetSalary} (${goal.salaryCurrency})` : 'Flexible'}
            </span>
          </div>
        </div>

        {/* Notes */}
        {goal.notes && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-800 block">Notes & Strategy:</span>
            <p className="leading-relaxed text-slate-600">{goal.notes}</p>
          </div>
        )}
      </div>

      {/* ROADMAP SECTION (Section 9) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-card space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Milestone size={20} className="text-brand-600" />
            <h2 className="text-base font-bold text-slate-900">Career Roadmap</h2>
          </div>

          {roadmap && (
            <Link
              to={`/app/roadmap?goalId=${goal.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>View Roadmap</span>
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {roadmap ? (
          /* Roadmap Active Summary */
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Current Stage
                </span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {currentMilestone?.title || 'All Milestones Completed!'}
                </p>
                {currentMilestone?.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{currentMilestone.description}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-brand-600">
                  {completedMilestones} / {milestones.length} milestones complete
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">{roadmap.progress}% overall progress</p>
              </div>
            </div>

            {/* Quick Preview Stages List */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Roadmap Stages Overview
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                        {m.sequence}
                      </span>
                      <span className={`font-semibold truncate ${m.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {m.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ml-2 ${
                        m.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : m.status === 'IN_PROGRESS'
                          ? 'bg-brand-50 text-brand-700'
                          : m.status === 'BLOCKED'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Empty State: No Roadmap Yet (Section 5 & 9) */
          <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
              <Milestone size={24} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">No roadmap yet.</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Turn this goal into a clear step-by-step path with sequential milestone targets.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowPreviewModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Generate Roadmap</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Layers size={14} />
                <span>Build Manually</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ROADMAP PREVIEW MODAL (Section 5) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Roadmap Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">{goal.title}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Based on your goal type (<strong className="text-brand-700">{goal.type?.replace('_', ' ')}</strong>), CareerOS has prepared a deterministic 10-stage execution path:
            </p>

            <div className="space-y-2">
              {previewData?.data?.preview?.milestones?.map((m) => (
                <div
                  key={m.sequence}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-2.5 text-xs"
                >
                  <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {m.sequence}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800">{m.title}</h4>
                    {m.description && <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createTemplateRoadmapMutation.mutate()}
                disabled={createTemplateRoadmapMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {createTemplateRoadmapMutation.isPending ? 'Creating...' : 'Create Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BUILD MANUALLY MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Build Roadmap Manually</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define custom milestones for {goal.title}</p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Roadmap Title</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder={`${goal.title} Roadmap`}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Initial Milestone Stages</label>
                {manualStages.map((st, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1.5">
                    <input
                      type="text"
                      value={st.title}
                      onChange={(e) => {
                        const updated = [...manualStages];
                        updated[idx].title = e.target.value;
                        setManualStages(updated);
                      }}
                      className="w-full font-bold text-xs bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                    />
                    <input
                      type="text"
                      value={st.description}
                      onChange={(e) => {
                        const updated = [...manualStages];
                        updated[idx].description = e.target.value;
                        setManualStages(updated);
                      }}
                      className="w-full text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => createManualRoadmapMutation.mutate(manualStages)}
                disabled={createManualRoadmapMutation.isPending}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {createManualRoadmapMutation.isPending ? 'Creating...' : 'Create Manual Roadmap'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
