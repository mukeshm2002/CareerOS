import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Github,
  Globe,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  Trash2,
  Edit2,
  X,
  FileText,
  ListTodo,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { evidenceService } from '../services/evidenceService';

export const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({
    activeProjects: 0,
    completedProjects: 0,
    portfolioReady: 0,
    evidenceItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Project Detail / Modal
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, milestones, tasks, skills, evidence

  // Create Project Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    projectType: 'PERSONAL',
    status: 'IDEA',
    priority: 'MEDIUM',
    problemStatement: '',
    objective: '',
    repositoryUrl: '',
    liveUrl: '',
    caseStudyUrl: '',
    isPortfolioVisible: false,
  });

  // Milestone / Task modals inside detail
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newEvidence, setNewEvidence] = useState({
    title: '',
    description: '',
    evidenceType: 'GITHUB_REPOSITORY',
    url: '',
  });

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (statusFilter === 'ACTIVE') {
        params.status = 'IN_PROGRESS';
      } else if (statusFilter === 'COMPLETED') {
        params.status = 'COMPLETED';
      } else if (statusFilter === 'PORTFOLIO') {
        params.portfolio = true;
      } else if (statusFilter === 'ARCHIVED') {
        params.archived = true;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await projectService.getProjects(params);
      setProjects(res.projects || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [statusFilter, searchQuery]);

  const loadProjectDetail = async (id) => {
    try {
      const proj = await projectService.getProject(id);
      setSelectedProject(proj);
      setSelectedProjectId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectService.createProject(newProject);
      setCreateModalOpen(false);
      setNewProject({
        title: '',
        description: '',
        projectType: 'PERSONAL',
        status: 'IDEA',
        priority: 'MEDIUM',
        problemStatement: '',
        objective: '',
        repositoryUrl: '',
        liveUrl: '',
        caseStudyUrl: '',
        isPortfolioVisible: false,
      });
      loadProjects();
    } catch (err) {
      console.error(err);
      alert('Failed to create project');
    }
  };

  const handleTogglePortfolio = async (projectId, currentState) => {
    try {
      await projectService.togglePortfolio(projectId, !currentState);
      loadProjects();
      if (selectedProjectId === projectId) {
        loadProjectDetail(projectId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !selectedProjectId) return;
    try {
      await projectService.createMilestone(selectedProjectId, {
        title: newMilestoneTitle.trim(),
      });
      setNewMilestoneTitle('');
      loadProjectDetail(selectedProjectId);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      await projectService.updateMilestoneStatus(selectedProjectId, milestoneId, newStatus);
      loadProjectDetail(selectedProjectId);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTaskFromMilestone = async (milestoneId) => {
    try {
      await projectService.createMilestoneTask(selectedProjectId, milestoneId, {});
      loadProjectDetail(selectedProjectId);
      alert('Task created and added to execution plan!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!newEvidence.title.trim() || !selectedProjectId) return;
    try {
      await evidenceService.createEvidence({
        ...newEvidence,
        projectId: selectedProjectId,
      });
      setNewEvidence({
        title: '',
        description: '',
        evidenceType: 'GITHUB_REPOSITORY',
        url: '',
      });
      loadProjectDetail(selectedProjectId);
      loadProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section 40 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <FolderGit2 className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold tracking-tight text-white">PROJECTS</h1>
          </div>
          <p className="text-slate-400 text-base">Turn skills into proof of work.</p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Top Factual Summary Strip Section 40 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Active Projects</div>
          <div className="text-2xl font-bold text-white mt-1">{summary.activeProjects}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Completed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.completedProjects}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Portfolio Ready</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.portfolioReady}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">Evidence Items</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{summary.evidenceItems}</div>
        </div>
      </div>

      {/* Filters Section 41 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'PORTFOLIO', label: 'Portfolio' },
            { id: 'ARCHIVED', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                statusFilter === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-medium'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-sm text-white rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Project Cards Grid Section 42 */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
          No projects found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => {
            const milestoneText = proj.milestoneProgress && proj.milestoneProgress.totalMilestones > 0
              ? `${proj.milestoneProgress.completedMilestones} / ${proj.milestoneProgress.totalMilestones} milestones`
              : 'No milestones yet';

            return (
              <div
                key={proj.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {proj.projectType} · {proj.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-2">{proj.title}</h3>
                    </div>
                    {proj.isPortfolioVisible && (
                      <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                        Portfolio
                      </span>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>
                  )}

                  {proj.goal && (
                    <div className="text-xs text-slate-400">
                      Goal: <span className="text-slate-300 font-medium">{proj.goal.title}</span>
                    </div>
                  )}

                  {/* Factual Milestone Progress Section 11 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-300 font-medium">{milestoneText}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full"
                        style={{ width: `${proj.progressPercent !== null ? proj.progressPercent : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Skills */}
                  {proj.demonstratedSkills && proj.demonstratedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {proj.demonstratedSkills.slice(0, 3).map((ps) => (
                        <span
                          key={ps.skillId}
                          className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60"
                        >
                          {ps.skill.name}
                        </span>
                      ))}
                      {proj.demonstratedSkills.length > 3 && (
                        <span className="text-[10px] text-slate-500 self-center">
                          +{proj.demonstratedSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {proj.evidence?.length || 0} evidence items
                  </span>
                  <button
                    onClick={() => loadProjectDetail(proj.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                  >
                    Open Project <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Detail Modal / Panel Section 43-48 */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {selectedProject.projectType}
                  </span>
                  <span className="text-xs font-bold uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                    {selectedProject.status.replace('_', ' ')}
                  </span>
                  {selectedProject.isPortfolioVisible && (
                    <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      Portfolio Visible
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-white mt-1">{selectedProject.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 px-6 gap-6 text-sm">
              {['overview', 'milestones', 'tasks', 'skills', 'evidence'].map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`py-3 capitalize font-medium border-b-2 transition-all ${
                    activeTab === t
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'overview' && (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Description</div>
                    <p className="text-slate-300 mt-1">{selectedProject.description || 'No description provided.'}</p>
                  </div>

                  {selectedProject.problemStatement && (
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Problem Statement</div>
                      <p className="text-slate-200 mt-1">{selectedProject.problemStatement}</p>
                    </div>
                  )}

                  {selectedProject.objective && (
                    <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Objective</div>
                      <p className="text-slate-200 mt-1">{selectedProject.objective}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                    <div>
                      <span className="text-xs text-slate-500 block">Priority</span>
                      <span className="text-slate-200 font-medium">{selectedProject.priority}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Focused Time</span>
                      <span className="text-slate-200 font-medium">{selectedProject.focusedMinutes || 0} mins</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Target Date</span>
                      <span className="text-slate-200 font-medium">
                        {selectedProject.targetDate ? new Date(selectedProject.targetDate).toLocaleDateString() : 'None'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Portfolio Ready</span>
                      <button
                        onClick={() => handleTogglePortfolio(selectedProject.id, selectedProject.isPortfolioVisible)}
                        className={`text-xs px-2 py-0.5 rounded font-semibold mt-0.5 ${
                          selectedProject.isPortfolioVisible
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {selectedProject.isPortfolioVisible ? 'Yes (Visible)' : 'No (Hidden)'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddMilestone} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="New milestone title..."
                      value={newMilestoneTitle}
                      onChange={(e) => setNewMilestoneTitle(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 text-sm font-semibold rounded-lg"
                    >
                      Add Milestone
                    </button>
                  </form>

                  <div className="space-y-2">
                    {(selectedProject.milestones || []).map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              m.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : m.status === 'IN_PROGRESS'
                                ? 'bg-cyan-500'
                                : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-white font-medium">{m.title}</span>
                          <span className="text-xs text-slate-500">({m.status})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateMilestoneStatus(m.id, 'COMPLETED')}
                              className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded hover:bg-emerald-500/30"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            onClick={() => handleCreateTaskFromMilestone(m.id)}
                            className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded hover:bg-slate-700"
                          >
                            + Create Task
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="space-y-3">
                  {(selectedProject.tasks || []).length === 0 ? (
                    <div className="text-slate-500 text-sm py-4">No tasks linked to this project yet.</div>
                  ) : (
                    (selectedProject.tasks || []).map((t) => (
                      <div
                        key={t.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-sm"
                      >
                        <div>
                          <div className="font-medium text-white">{t.title}</div>
                          <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                            <span>Status: {t.status}</span>
                            <span>Priority: {t.priority}</span>
                            {t.focusedMinutes > 0 && <span>Focused: {t.focusedMinutes} min</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {(selectedProject.demonstratedSkills || []).map((ps) => (
                      <div
                        key={ps.skillId}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-white">{ps.skill.name}</span>
                        <span className="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                          {ps.usageLevel || 'Demonstrated'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddEvidence} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-sm">
                    <div className="font-semibold text-white">Add Evidence Artifact</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Artifact title (e.g. GitHub Repo)..."
                        value={newEvidence.title}
                        onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                      />
                      <input
                        type="text"
                        placeholder="URL..."
                        value={newEvidence.url}
                        onChange={(e) => setNewEvidence({ ...newEvidence, url: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold rounded-lg text-xs"
                      >
                        Attach Evidence
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {(selectedProject.evidence || []).map((ev) => (
                      <div
                        key={ev.id}
                        className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 flex items-center justify-between text-sm"
                      >
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {ev.title}
                            <span className="text-[10px] uppercase font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                              {ev.evidenceType}
                            </span>
                          </div>
                          {ev.description && <div className="text-xs text-slate-400">{ev.description}</div>}
                        </div>
                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Project Type</label>
                  <select
                    value={newProject.projectType}
                    onChange={(e) => setNewProject({ ...newProject, projectType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="PORTFOLIO">PORTFOLIO</option>
                    <option value="LEARNING">LEARNING</option>
                    <option value="FREELANCE">FREELANCE</option>
                    <option value="OPEN_SOURCE">OPEN_SOURCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select
                    value={newProject.status}
                    onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  >
                    <option value="IDEA">IDEA</option>
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Repository URL (optional)</label>
                <input
                  type="text"
                  value={newProject.repositoryUrl}
                  onChange={(e) => setNewProject({ ...newProject, repositoryUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="portCheck"
                  checked={newProject.isPortfolioVisible}
                  onChange={(e) => setNewProject({ ...newProject, isPortfolioVisible: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950"
                />
                <label htmlFor="portCheck" className="text-xs text-slate-300">
                  Visible on Portfolio
                </label>
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
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-semibold rounded-lg"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
