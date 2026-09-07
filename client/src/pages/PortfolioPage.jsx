import React, { useState, useEffect } from 'react';
import {
  Award,
  ExternalLink,
  Github,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  FolderGit2,
  Plus,
  EyeOff,
  Filter,
  Search,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { evidenceService } from '../services/evidenceService';

export const PortfolioPage = () => {
  const [projects, setProjects] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [evidenceFilter, setEvidenceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [assessModalOpen, setAssessModalOpen] = useState(false);
  const [selectedSkillForAssess, setSelectedSkillForAssess] = useState(null);
  const [assessLevel, setAssessLevel] = useState(3);
  const [assessNotes, setAssessNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes, evRes] = await Promise.all([
        projectService.getProjects({ portfolio: true }),
        evidenceService.getEvidence(),
      ]);
      setProjects(projRes.projects || []);
      setEvidenceList(evRes.evidence || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load portfolio records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTogglePortfolio = async (projectId) => {
    try {
      await projectService.togglePortfolio(projectId, false);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssessSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillForAssess) return;
    try {
      await evidenceService.assessSkill({
        skillId: selectedSkillForAssess.id,
        newLevel: parseInt(assessLevel, 10),
        notes: assessNotes,
        evidenceText: `Validated by portfolio project evidence`,
      });
      setAssessModalOpen(false);
      setSelectedSkillForAssess(null);
      setAssessNotes('');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to assess skill');
    }
  };

  // Filter evidence
  const filteredEvidence = evidenceList.filter((item) => {
    if (evidenceFilter !== 'ALL') {
      if (evidenceFilter === 'CODE' && item.evidenceType !== 'GITHUB_REPOSITORY') return false;
      if (evidenceFilter === 'DEMO' && !['LIVE_DEMO', 'VIDEO'].includes(item.evidenceType)) return false;
      if (evidenceFilter === 'DESIGN' && !['DESIGN_FILE', 'CAD_FILE', 'SCREENSHOT'].includes(item.evidenceType)) return false;
      if (evidenceFilter === 'DOCUMENTS' && !['DOCUMENT', 'ARTICLE', 'PRESENTATION'].includes(item.evidenceType)) return false;
      if (evidenceFilter === 'CERTIFICATES' && !['CERTIFICATE', 'ASSESSMENT'].includes(item.evidenceType)) return false;
      if (evidenceFilter === 'WORK' && !['WORK_SAMPLE', 'CUSTOMER_FEEDBACK'].includes(item.evidenceType)) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      return matchTitle || matchDesc;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">Loading portfolio proof of work...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-1">
          <Award className="w-8 h-8 text-amber-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white">PORTFOLIO</h1>
        </div>
        <p className="text-slate-400 text-base">Your strongest proof of work.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {error}
        </div>
      )}

      {/* Featured Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Featured Projects</h2>
            <p className="text-sm text-slate-400">Curated proof of work visible on your portfolio.</p>
          </div>
          <div className="text-sm text-slate-400">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} visible
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <FolderGit2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Projects in Portfolio Yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
              Go to Projects and toggle "Add to Portfolio" to showcase your strongest proof of work.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const readiness = project.portfolioReadiness || { completedChecks: 0, totalChecks: 6, missingItems: [] };
              return (
                <div
                  key={project.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          {project.projectType}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-2">{project.title}</h3>
                        {project.goal && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            Goal: <span className="text-slate-300">{project.goal.title}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleTogglePortfolio(project.id)}
                        title="Remove from Portfolio"
                        className="text-slate-400 hover:text-red-400 text-xs flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </button>
                    </div>

                    {project.description && (
                      <p className="text-sm text-slate-300 line-clamp-2">{project.description}</p>
                    )}

                    {project.problemStatement && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1">
                        <div className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Problem Solved</div>
                        <div className="text-slate-200">{project.problemStatement}</div>
                      </div>
                    )}

                    {/* Skills Demonstrated */}
                    {project.demonstratedSkills && project.demonstratedSkills.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-slate-400">Skills Demonstrated</div>
                        <div className="flex flex-wrap gap-1.5">
                          {project.demonstratedSkills.map((ps) => (
                            <span
                              key={ps.skillId}
                              className="text-xs bg-slate-800 text-cyan-300 border border-slate-700/70 px-2 py-0.5 rounded"
                            >
                              {ps.skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Links */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {project.repositoryUrl && (
                        <a
                          href={project.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                        >
                          <Github className="w-3.5 h-3.5" /> Repository
                        </a>
                      )}
                      {project.liveUrl && (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                        >
                          <Globe className="w-3.5 h-3.5" /> Live Demo
                        </a>
                      )}
                      {project.caseStudyUrl && (
                        <a
                          href={project.caseStudyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5" /> Case Study
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Portfolio Readiness Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Portfolio Readiness</span>
                      <span className="font-semibold text-slate-200">
                        {readiness.completedChecks} of {readiness.totalChecks} complete
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          readiness.completedChecks === readiness.totalChecks
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${(readiness.completedChecks / readiness.totalChecks) * 100}%`,
                        }}
                      />
                    </div>
                    {readiness.missingItems && readiness.missingItems.length > 0 && (
                      <div className="text-[11px] text-amber-400/90 mt-1.5">
                        Missing: {readiness.missingItems.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Evidence Library Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Evidence Library</h2>
            <p className="text-sm text-slate-400">All verified proof artifacts, code repositories, and work samples.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-sm text-white rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Evidence Category Filters */}
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'CODE', label: 'Code & Repos' },
            { id: 'DEMO', label: 'Demos & Videos' },
            { id: 'DESIGN', label: 'Design & CAD' },
            { id: 'DOCUMENTS', label: 'Documents' },
            { id: 'CERTIFICATES', label: 'Certificates' },
            { id: 'WORK', label: 'Work Samples' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setEvidenceFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                evidenceFilter === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Evidence Grid */}
        {filteredEvidence.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm">
            No evidence found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map((ev) => (
              <div
                key={ev.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                      {ev.evidenceType}
                    </span>
                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-white"
                        title="Open External Resource"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-semibold text-white">{ev.title}</h4>
                    {ev.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ev.description}</p>
                    )}
                  </div>

                  {ev.project && (
                    <div className="text-xs text-slate-400">
                      Project: <span className="text-slate-300 font-medium">{ev.project.title}</span>
                    </div>
                  )}

                  {ev.skills && ev.skills.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[11px] text-slate-500">Skills Proved:</div>
                      <div className="flex flex-wrap gap-1">
                        {ev.skills.map((es) => (
                          <button
                            key={es.skillId}
                            onClick={() => {
                              setSelectedSkillForAssess(es.skill);
                              setAssessModalOpen(true);
                            }}
                            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 px-2 py-0.5 rounded cursor-pointer transition-all"
                            title="Click to assess this skill from evidence"
                          >
                            {es.skill.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{new Date(ev.createdAt).toLocaleDateString()}</span>
                  <span className="text-slate-400">Verified Evidence</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Skill Assessment Modal */}
      {assessModalOpen && selectedSkillForAssess && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">Update Skill Assessment</h3>
              <p className="text-xs text-slate-400">
                Deliberate assessment for <span className="text-amber-400 font-semibold">{selectedSkillForAssess.name}</span> backed by proof of work.
              </p>
            </div>

            <form onSubmit={handleAssessSkill} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">New Proficiency Level (1-5)</label>
                <select
                  value={assessLevel}
                  onChange={(e) => setAssessLevel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value={1}>1 - Beginner (Foundation)</option>
                  <option value={2}>2 - Junior (Guided Execution)</option>
                  <option value={3}>3 - Mid-Level (Independent Delivery)</option>
                  <option value={4}>4 - Senior (High Autonomy & Mastery)</option>
                  <option value={5}>5 - Lead / Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Assessment Notes</label>
                <textarea
                  value={assessNotes}
                  onChange={(e) => setAssessNotes(e.target.value)}
                  placeholder="Explain what specific capabilities were demonstrated..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssessModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-sm font-semibold text-slate-950 rounded-lg"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioPage;
