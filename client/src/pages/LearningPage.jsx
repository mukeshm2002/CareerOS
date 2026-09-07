import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  Clock,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  Target,
  CheckSquare,
  Play,
  RotateCcw,
} from 'lucide-react';
import { learningService } from '../services/learningService';

export const LearningPage = () => {
  const [paths, setPaths] = useState([]);
  const [summary, setSummary] = useState({
    activePaths: 0,
    modulesCompletedThisWeek: 0,
    learningMinutes: 0,
    skillsBeingDeveloped: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected path for detail modal
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [selectedPath, setSelectedPath] = useState(null);

  // Create Learning Path Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newPath, setNewPath] = useState({
    title: '',
    description: '',
    provider: '',
    category: '',
    estimatedHours: 10,
  });

  // New module input
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleType, setNewModuleType] = useState('READ');
  const [newModuleMins, setNewModuleMins] = useState(30);

  const loadLearningData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await learningService.getLearningPaths();
      setPaths(res.paths || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load learning paths');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadPathDetail = async (id) => {
    try {
      const path = await learningService.getLearningPath(id);
      setSelectedPath(path);
      setSelectedPathId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePath = async (e) => {
    e.preventDefault();
    try {
      await learningService.createLearningPath(newPath);
      setCreateModalOpen(false);
      setNewPath({
        title: '',
        description: '',
        provider: '',
        category: '',
        estimatedHours: 10,
      });
      loadLearningData();
    } catch (err) {
      console.error(err);
      alert('Failed to create learning path');
    }
  };

  const handleAddModule = async (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim() || !selectedPathId) return;
    try {
      await learningService.createModule(selectedPathId, {
        title: newModuleTitle.trim(),
        moduleType: newModuleType,
        estimatedMinutes: parseInt(newModuleMins, 10) || 30,
      });
      setNewModuleTitle('');
      loadPathDetail(selectedPathId);
      loadLearningData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateModuleStatus = async (moduleId, newStatus) => {
    try {
      await learningService.updateModuleStatus(selectedPathId, moduleId, newStatus);
      loadPathDetail(selectedPathId);
      loadLearningData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTaskFromModule = async (moduleId) => {
    try {
      await learningService.createModuleTask(selectedPathId, moduleId, {});
      loadPathDetail(selectedPathId);
      alert('Module task added to Daily Execution plan!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProjectFromLearning = async () => {
    if (!selectedPath) return;
    const title = prompt('Enter new Project Title:', `Applied Project: ${selectedPath.title}`);
    if (!title) return;
    try {
      await learningService.createProjectFromLearning(selectedPath.id, { title });
      alert('Project successfully created from learning path! View it in Projects.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section 52 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <GraduationCap className="w-8 h-8 text-indigo-400" />
            <h1 className="text-3xl font-bold tracking-tight text-white">LEARNING</h1>
          </div>
          <p className="text-slate-400 text-base">Close skill gaps through focused practice.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Path</span>
        </button>
      </div>

      {/* Top Factual Summary Strip Section 52 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Paths</div>
          <div className="text-2xl font-bold text-white mt-1">{summary.activePaths}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Completed This Week</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.modulesCompletedThisWeek}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Learning Minutes</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">{summary.learningMinutes}m</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Skills Being Developed</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.skillsBeingDeveloped}</div>
        </div>
      </div>

      {/* Learning Path Cards Section 53 */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading learning paths...</div>
      ) : paths.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No learning paths configured yet. Create a learning path to close your skill gaps.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((lp) => {
            const progressMeta = lp.moduleProgress || { completedModules: 0, totalModules: 0 };
            const progressText = progressMeta.totalModules > 0
              ? `${progressMeta.completedModules} / ${progressMeta.totalModules} modules`
              : 'No modules yet';

            return (
              <div
                key={lp.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="space-y-4">
                  <div>
                    {lp.skill && (
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          Skill: {lp.skill.name}
                        </span>
                        {lp.userSkill && (
                          <span className="text-slate-400 font-medium">
                            {lp.userSkill.currentLevel} → {lp.userSkill.targetLevel}
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="text-lg font-bold text-white mt-1">{lp.title}</h3>
                    {lp.provider && (
                      <p className="text-xs text-slate-400 mt-0.5">{lp.provider}</p>
                    )}
                  </div>

                  {/* Factual Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-300 font-medium">{progressText}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${lp.progressPercent !== null ? lp.progressPercent : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Module */}
                  {lp.nextModule && (
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs">
                      <div className="text-[10px] uppercase font-semibold text-slate-500">Next Module</div>
                      <div className="text-slate-200 font-medium mt-0.5 flex items-center gap-1.5">
                        <Play className="w-3 h-3 text-indigo-400" />
                        {lp.nextModule.title}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {lp.estimatedHours ? `${lp.estimatedHours}h estimated` : ''}
                  </span>
                  <button
                    onClick={() => loadPathDetail(lp.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                  >
                    Continue Learning <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Learning Path Detail Modal Section 54-55 */}
      {selectedPath && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    {selectedPath.status.replace('_', ' ')}
                  </span>
                  {selectedPath.skill && (
                    <span className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
                      Skill: {selectedPath.skill.name}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedPath.title}</h2>
                {selectedPath.description && (
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">{selectedPath.description}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedPath(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="bg-slate-950/60 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-4 text-slate-400">
                <span>Focused Time: <strong className="text-white">{selectedPath.focusedMinutes || 0} mins</strong></span>
                <span>Modules: <strong className="text-white">{(selectedPath.modules || []).length}</strong></span>
              </div>
              <button
                onClick={handleCreateProjectFromLearning}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Project from Learning</span>
              </button>
            </div>

            {/* Modules List Section 55 */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Add Module Form */}
              <form onSubmit={handleAddModule} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                <div className="font-semibold text-white">Add Curriculum Module</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Module title (e.g. Spring Data JPA)..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  />
                  <select
                    value={newModuleType}
                    onChange={(e) => setNewModuleType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                  >
                    <option value="READ">READ</option>
                    <option value="WATCH">WATCH</option>
                    <option value="PRACTICE">PRACTICE</option>
                    <option value="BUILD">BUILD</option>
                    <option value="ASSESSMENT">ASSESSMENT</option>
                    <option value="PROJECT">PROJECT</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg text-xs"
                  >
                    Add Module
                  </button>
                </div>
              </form>

              {/* Modules Accordion/List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curriculum Modules</div>
                {(selectedPath.modules || []).map((m, idx) => {
                  const isCompleted = m.status === 'COMPLETED' || m.isCompleted;
                  return (
                    <div
                      key={m.id}
                      className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : m.status === 'IN_PROGRESS'
                              ? 'bg-indigo-500'
                              : 'bg-slate-700'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            <span>{idx + 1}. {m.title}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {m.moduleType}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                            <span>Status: {m.status}</span>
                            <span>Est: {m.estimatedMinutes || 30} mins</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isCompleted ? (
                          <>
                            {m.status !== 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleUpdateModuleStatus(m.id, 'IN_PROGRESS')}
                                className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded hover:bg-indigo-500/30 font-medium"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateModuleStatus(m.id, 'COMPLETED')}
                              className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded hover:bg-emerald-500/30 font-medium"
                            >
                              Complete
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
                          </span>
                        )}

                        <button
                          onClick={() => handleCreateTaskFromModule(m.id)}
                          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-medium"
                          title="Convert this module into an actionable Task"
                        >
                          + Add to Tasks
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Learning Path Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Create Learning Path</h3>
            <form onSubmit={handleCreatePath} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Path Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spring Boot Backend Engineering"
                  value={newPath.title}
                  onChange={(e) => setNewPath({ ...newPath, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="What will you master..."
                  value={newPath.description}
                  onChange={(e) => setNewPath({ ...newPath, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Provider / Platform</label>
                  <input
                    type="text"
                    placeholder="e.g. Documentation, Books"
                    value={newPath.provider}
                    onChange={(e) => setNewPath({ ...newPath, provider: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Estimated Hours</label>
                  <input
                    type="number"
                    value={newPath.estimatedHours}
                    onChange={(e) => setNewPath({ ...newPath, estimatedHours: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg"
                >
                  Create Path
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPage;
