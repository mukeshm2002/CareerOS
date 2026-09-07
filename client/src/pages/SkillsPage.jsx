import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningService } from '../features/planning/services/planningService';
import { useAuthStore } from '../store/authStore';
import {
  BrainCircuit,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Trash2,
  Edit3,
  X,
  Sparkles,
  Info,
  Layers,
  History,
} from 'lucide-react';

export const SkillsPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [viewingHistorySkill, setViewingHistorySkill] = useState(null);

  // Form State
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('TECHNICAL');
  const [currentLevel, setCurrentLevel] = useState(2);
  const [targetLevel, setTargetLevel] = useState(4);
  const [evidence, setEvidence] = useState('');
  const [notes, setNotes] = useState('');

  // Queries
  const { data: gapsReportData, isLoading } = useQuery({
    queryKey: ['user-skills-gaps'],
    queryFn: () => planningService.getSkillGapsAndReadiness(),
  });

  const { data: skillHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['user-skill-history', viewingHistorySkill?.id],
    queryFn: () => planningService.getSkillAssessmentHistory(viewingHistorySkill?.id),
    enabled: !!viewingHistorySkill?.id,
  });

  const report = gapsReportData?.data || {};
  const userSkills = report?.gaps || [];
  const topGaps = report?.topGaps || [];
  const hasEnoughData = report?.hasEnoughData;

  // Mutations
  const upsertMutation = useMutation({
    mutationFn: (data) => planningService.upsertUserSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills-gaps'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => planningService.updateUserSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills-gaps'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => planningService.deleteUserSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-skills-gaps'] });
    },
  });

  const resetForm = () => {
    setShowAddModal(false);
    setEditingSkill(null);
    setSkillName('');
    setCategory('TECHNICAL');
    setCurrentLevel(2);
    setTargetLevel(4);
    setEvidence('');
    setNotes('');
  };

  const handleEditClick = (skill) => {
    setEditingSkill(skill);
    setSkillName(skill.skillName);
    setCategory(skill.category);
    setCurrentLevel(skill.currentLevel);
    setTargetLevel(skill.targetLevel);
    setEvidence(skill.evidence || '');
    setNotes(skill.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSkill) {
      updateMutation.mutate({
        id: editingSkill.id,
        data: {
          currentLevel,
          targetLevel,
          evidence,
          notes,
        },
      });
    } else {
      upsertMutation.mutate({
        skillName,
        category,
        currentLevel,
        targetLevel,
        evidence,
        notes,
      });
    }
  };

  // Group skills by category
  const groupedSkills = userSkills.reduce((acc, us) => {
    const cat = us.category || 'OTHER';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(us);
    return acc;
  }, {});

  const renderLevelDots = (level, max = 5, color = 'bg-brand-600') => (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < level ? color : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header (Section 16) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-brand-600" size={22} />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">SKILLS</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Understand where you are and what to improve next.
          </p>
          {user?.profile?.targetRole && (
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Target Role: <span className="text-brand-600">{user.profile.targetRole}</span>
            </p>
          )}
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-brand-600/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Skill</span>
        </button>
      </div>

      {/* Role Readiness Summary Card (Section 16) */}
      {hasEnoughData ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {report.label || 'Self-Assessed Role Readiness'}
              </span>
              <div className="text-4xl font-black text-brand-600">
                {report.readinessScore}%
              </div>
              <p className="text-xs text-slate-500">
                Based on <strong className="text-slate-800">{report.totalSkills} target skills</strong>.
              </p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 max-w-md space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <Info size={15} />
                <span>Competency Disclaimer</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                {report.disclaimer || 'This score is based on your current self assessment, not a verified competency test.'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card text-center space-y-2">
          <h3 className="text-sm font-bold text-slate-800">Self-Assessed Role Readiness</h3>
          <p className="text-xs text-slate-500">
            {report.message || 'Not enough information yet. Add target skills to calculate readiness.'}
          </p>
        </div>
      )}

      {/* TOP SKILL GAPS (Section 16) */}
      {topGaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Top Skill Gaps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topGaps.map((sg) => (
              <div
                key={sg.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-card hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{sg.skillName}</h3>
                    <span className="text-[10px] text-slate-400">{sg.category}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      sg.gapPriority === 'CRITICAL'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : sg.gapPriority === 'HIGH'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {sg.gapPriority}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Current</span>
                    <span className="font-bold text-slate-800">{sg.currentLevel} / 5</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Target</span>
                    <span className="font-bold text-slate-800">{sg.targetLevel} / 5</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gap</span>
                    <span className="font-bold text-brand-600">+{sg.gap}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SKILLS LIST GROUPED BY CATEGORY (Section 16) */}
      {userSkills.length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedSkills).map(([cat, skills]) => (
            <div key={cat} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-card space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers size={14} className="text-brand-600" />
                <span>{cat}</span>
              </h2>

              <div className="space-y-3">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{skill.skillName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            skill.gapPriority === 'READY'
                              ? 'bg-emerald-50 text-emerald-700'
                              : skill.gapPriority === 'CRITICAL'
                              ? 'bg-red-50 text-red-700'
                              : skill.gapPriority === 'HIGH'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {skill.gapPriority}
                        </span>
                      </div>
                      {skill.evidence && (
                        <p className="text-[11px] text-slate-500">
                          Evidence: <span className="text-slate-700">{skill.evidence}</span>
                        </p>
                      )}
                      {skill.notes && (
                        <p className="text-[11px] text-slate-400 italic">{skill.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 shrink-0">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[10px]">Current:</span>
                          {renderLevelDots(skill.currentLevel, 5, 'bg-brand-600')}
                          <span className="font-bold text-slate-700 text-xs w-4">
                            {skill.currentLevel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 text-[10px]">Target:</span>
                          {renderLevelDots(skill.targetLevel, 5, 'bg-emerald-500')}
                          <span className="font-bold text-slate-700 text-xs w-4">
                            {skill.targetLevel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingHistorySkill(skill)}
                          title="View Assessment History"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 cursor-pointer"
                        >
                          <History size={14} />
                        </button>
                        <button
                          onClick={() => handleEditClick(skill)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(skill.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State: Section 32 */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 shadow-card text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto">
            <BrainCircuit size={28} />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              CareerOS doesn't know your skill gaps yet.
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Add your current competencies and target benchmarks to generate an actionable gap matrix.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm shadow-brand-600/30 transition-colors cursor-pointer"
            >
              <Plus size={16} />
              <span>Add Your Skills</span>
            </button>
          </div>
        </div>
      )}

      {/* ADD / EDIT SKILL MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {editingSkill ? 'Edit Skill Assessment' : 'Add New Skill'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Skill Name</label>
                <input
                  type="text"
                  required
                  disabled={!!editingSkill}
                  placeholder="e.g. Spring Boot, System Design, DSA"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden disabled:bg-slate-100"
                />
              </div>

              {!editingSkill && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden bg-white"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="PROFESSIONAL">PROFESSIONAL</option>
                    <option value="COMMUNICATION">COMMUNICATION</option>
                    <option value="DOMAIN">DOMAIN</option>
                    <option value="TOOLS">TOOLS</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Current Level (1–5)</label>
                  <select
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden bg-white"
                  >
                    <option value={1}>1 — Awareness</option>
                    <option value={2}>2 — Beginner</option>
                    <option value={3}>3 — Working Knowledge</option>
                    <option value={4}>4 — Proficient</option>
                    <option value={5}>5 — Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Level (1–5)</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden bg-white"
                  >
                    <option value={1}>1 — Awareness</option>
                    <option value={2}>2 — Beginner</option>
                    <option value={3}>3 — Working Knowledge</option>
                    <option value={4}>4 — Proficient</option>
                    <option value={5}>5 — Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Evidence / Proof of Work</label>
                <input
                  type="text"
                  placeholder="e.g. 2 production microservices, LeetCode 50 problems"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional strategy or focus areas..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={upsertMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 disabled:opacity-50 cursor-pointer"
                >
                  {editingSkill ? 'Save Changes' : 'Add Skill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SKILL ASSESSMENT HISTORY MODAL */}
      {viewingHistorySkill && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="text-brand-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900">
                  Assessment History: {viewingHistorySkill.skillName}
                </h3>
              </div>
              <button
                onClick={() => setViewingHistorySkill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : skillHistoryData?.data?.history?.length > 0 ? (
              <div className="space-y-3">
                {skillHistoryData.data.history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          Lvl {h.previousLevel} → Lvl {h.newLevel}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            h.assessmentType === 'PROJECT_EVIDENCE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {h.assessmentType === 'PROJECT_EVIDENCE' ? 'Project Evidence' : 'Self Assessment'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(h.changedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    {h.evidence && (
                      <p className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-700">Evidence:</span> {h.evidence}
                      </p>
                    )}

                    {h.notes && (
                      <p className="text-[11px] text-slate-400 italic">
                        {h.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No previous level transitions recorded for this skill yet.
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 text-right">
              <button
                onClick={() => setViewingHistorySkill(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
