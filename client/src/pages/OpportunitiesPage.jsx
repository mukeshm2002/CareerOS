import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Archive,
  Trash2,
  DollarSign,
  Building,
  UserCheck,
  ChevronRight,
  X,
  ExternalLink,
  MessageSquare,
  History,
  ListTodo,
} from 'lucide-react';
import { opportunityService } from '../services/opportunityService';

const JOB_STAGES = [
  'SAVED', 'PREPARING', 'APPLIED', 'SCREENING', 'ASSESSMENT',
  'INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'
];

const FREELANCE_STAGES = [
  'LEAD', 'RESEARCHING', 'CONTACTED', 'DISCOVERY', 'PROPOSAL_PREPARATION',
  'PROPOSAL_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'IN_PROGRESS', 'COMPLETED', 'LOST', 'ARCHIVED'
];

const INTERNSHIP_STAGES = [
  'SAVED', 'PREPARING', 'APPLIED', 'SCREENING', 'ASSESSMENT',
  'INTERVIEW', 'OFFER', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'
];

export const OpportunitiesPage = () => {
  const [activeTab, setActiveTab] = useState('JOBS'); // 'JOBS' | 'FREELANCE' | 'INTERNSHIPS'
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [goals, setGoals] = useState([]);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [followUpDueOnly, setFollowUpDueOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [archivedOnly, setArchivedOnly] = useState(false);
  const [sortBy, setSortBy] = useState('RECENT');

  // Modals & Drawers
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newActivityNote, setNewActivityNote] = useState('');

  // Load Goals for linking
  useEffect(() => {
    opportunityService.getGoals()
      .then(setGoals)
      .catch(() => setGoals([]));
  }, []);

  // Fetch Opportunities & Metrics
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        followUpDue: followUpDueOnly ? 'true' : undefined,
        stale: staleOnly ? 'true' : undefined,
        archived: archivedOnly ? 'true' : undefined,
        sortBy,
      };

      const [metricsData, listData] = await Promise.all([
        opportunityService.getMetrics(),
        activeTab === 'JOBS'
          ? opportunityService.getJobs(params)
          : activeTab === 'FREELANCE'
          ? opportunityService.getFreelance(params)
          : opportunityService.getInternships(params)
      ]);

      setMetrics(metricsData);
      setItems(listData?.jobs || listData?.freelance || listData?.internships || []);
      
      // If an item was opened in detail drawer, refresh its view
      if (selectedItem) {
        if (activeTab === 'JOBS') {
          const fresh = await opportunityService.getJob(selectedItem.id);
          setSelectedItem(fresh);
        } else if (activeTab === 'FREELANCE') {
          const fresh = await opportunityService.getFreelanceById(selectedItem.id);
          setSelectedItem(fresh);
        } else {
          const fresh = await opportunityService.getInternshipById(selectedItem.id);
          setSelectedItem(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, statusFilter, priorityFilter, followUpDueOnly, staleOnly, archivedOnly, sortBy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Stage transition handler
  const handleStageChange = async (id, newStatus) => {
    try {
      if (activeTab === 'JOBS') {
        await opportunityService.updateJobStatus(id, { status: newStatus });
      } else if (activeTab === 'FREELANCE') {
        await opportunityService.updateFreelanceStatus(id, { status: newStatus });
      } else {
        await opportunityService.updateInternshipStatus(id, { status: newStatus });
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stage');
    }
  };

  // Archive toggle handler
  const handleToggleArchive = async (id) => {
    try {
      if (activeTab === 'JOBS') {
        await opportunityService.toggleJobArchive(id);
      } else if (activeTab === 'FREELANCE') {
        await opportunityService.toggleFreelanceArchive(id);
      } else {
        await opportunityService.toggleInternshipArchive(id);
      }
      if (selectedItem && selectedItem.id === id) {
        setSelectedItem(null);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle archive');
    }
  };

  // Add activity note
  const handleAddActivity = async (e) => {
    e.preventDefault();
    if (!newActivityNote.trim() || !selectedItem) return;

    try {
      if (activeTab === 'JOBS') {
        await opportunityService.addJobActivity(selectedItem.id, {
          activityType: 'NOTE',
          title: 'Added preparation note',
          description: newActivityNote,
        });
      } else if (activeTab === 'FREELANCE') {
        await opportunityService.addFreelanceActivity(selectedItem.id, {
          activityType: 'NOTE',
          title: 'Added client discussion note',
          description: newActivityNote,
        });
      } else {
        await opportunityService.addInternshipActivity(selectedItem.id, {
          activityType: 'NOTE',
          title: 'Added internship note',
          description: newActivityNote,
        });
      }
      setNewActivityNote('');
      // Refresh item
      if (activeTab === 'JOBS') {
        const fresh = await opportunityService.getJob(selectedItem.id);
        setSelectedItem(fresh);
      } else if (activeTab === 'FREELANCE') {
        const fresh = await opportunityService.getFreelanceById(selectedItem.id);
        setSelectedItem(fresh);
      } else {
        const fresh = await opportunityService.getInternshipById(selectedItem.id);
        setSelectedItem(fresh);
      }
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add activity note');
    }
  };

  // Create Task from Next Action
  const handleCreateTaskFromNextAction = async () => {
    if (!selectedItem) return;
    const defaultTitle = selectedItem.nextAction || `Follow up on ${selectedItem.company || selectedItem.clientName || 'opportunity'}`;
    const dueDate = selectedItem.nextActionDate ? new Date(selectedItem.nextActionDate).toISOString().slice(0, 10) : undefined;

    try {
      if (activeTab === 'JOBS') {
        await opportunityService.createJobTask(selectedItem.id, {
          title: defaultTitle,
          dueDate,
          priority: selectedItem.priority,
          taskType: 'JOB_SEARCH',
        });
      } else if (activeTab === 'FREELANCE') {
        await opportunityService.createFreelanceTask(selectedItem.id, {
          title: defaultTitle,
          dueDate,
          priority: selectedItem.priority,
          taskType: 'JOB_SEARCH',
        });
      } else {
        await opportunityService.createInternshipTask(selectedItem.id, {
          title: defaultTitle,
          dueDate,
          priority: selectedItem.priority,
          taskType: 'JOB_SEARCH',
        });
      }
      alert('Task created and linked to opportunity! It will appear in your planning queue and My Day.');
      setShowTaskModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">OPPORTUNITIES</h1>
          <p className="text-sm text-slate-500 mt-1">
            Turn preparation into real career outcomes.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors shadow-sm shadow-brand-600/20"
        >
          <Plus size={16} />
          <span>
            {activeTab === 'JOBS' ? 'Add Job Opportunity' : activeTab === 'FREELANCE' ? 'Add Freelance Lead' : 'Add Internship'}
          </span>
        </button>
      </div>

      {/* Primary Tabs */}
      <div className="flex items-center gap-3">
        {[
          { id: 'JOBS', label: 'Jobs' },
          { id: 'FREELANCE', label: 'Freelance' },
          { id: 'INTERNSHIPS', label: 'Internships' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setStatusFilter('');
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Factual Count Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {activeTab === 'JOBS' && (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Saved</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics?.jobs?.stages?.SAVED || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Applied</span>
              <p className="text-2xl font-bold text-brand-600 mt-1">{metrics?.jobs?.stages?.APPLIED || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Interview</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {(metrics?.jobs?.stages?.INTERVIEW || 0) + (metrics?.jobs?.stages?.FINAL_INTERVIEW || 0)}
              </p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Offer</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.jobs?.stages?.OFFER || 0}</p>
            </div>
          </>
        )}

        {activeTab === 'FREELANCE' && (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Leads</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics?.freelance?.stages?.LEAD || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Contacted</span>
              <p className="text-2xl font-bold text-brand-600 mt-1">{metrics?.freelance?.stages?.CONTACTED || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Proposals Sent</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics?.freelance?.stages?.PROPOSAL_SENT || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Won</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.freelance?.stages?.WON || 0}</p>
            </div>
          </>
        )}

        {activeTab === 'INTERNSHIPS' && (
          <>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Saved</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics?.internships?.stages?.SAVED || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Applied</span>
              <p className="text-2xl font-bold text-brand-600 mt-1">{metrics?.internships?.stages?.APPLIED || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Interview</span>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics?.internships?.stages?.INTERVIEW || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Offer</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.internships?.stages?.OFFER || 0}</p>
            </div>
          </>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder={activeTab === 'FREELANCE' ? 'Search client or project...' : 'Search company or role...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500 text-slate-700"
        >
          <option value="">All Stages</option>
          {(activeTab === 'JOBS' ? JOB_STAGES : activeTab === 'FREELANCE' ? FREELANCE_STAGES : INTERNSHIP_STAGES).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-brand-500 text-slate-700"
        >
          <option value="">All Priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <button
          onClick={() => setFollowUpDueOnly(!followUpDueOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            followUpDueOnly
              ? 'bg-amber-50 text-amber-700 border-amber-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Follow-up Due
        </button>

        <button
          onClick={() => setStaleOnly(!staleOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            staleOnly
              ? 'bg-rose-50 text-rose-700 border-rose-300'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Stale Only
        </button>

        <button
          onClick={() => setArchivedOnly(!archivedOnly)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            archivedOnly
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Archived
        </button>
      </div>

      {/* Main List / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          Loading opportunities...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase size={22} />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            {activeTab === 'JOBS' && "No job opportunities yet."}
            {activeTab === 'FREELANCE' && "No freelance leads yet."}
            {activeTab === 'INTERNSHIPS' && "No internship opportunities yet."}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'JOBS' && "Save a role you're considering or add an application."}
            {activeTab === 'FREELANCE' && "Add a potential client or project opportunity."}
            {activeTab === 'INTERNSHIPS' && "Track internships, requirements, and interviews."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>
              {activeTab === 'JOBS' && "Add Job Opportunity"}
              {activeTab === 'FREELANCE' && "Add Freelance Lead"}
              {activeTab === 'INTERNSHIPS' && "Add Internship"}
            </span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">
                    {activeTab === 'FREELANCE' ? 'Client' : 'Company'}
                  </th>
                  <th className="py-3 px-4">
                    {activeTab === 'FREELANCE' ? 'Project' : 'Role'}
                  </th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">
                    {activeTab === 'FREELANCE' ? 'Value' : 'Priority'}
                  </th>
                  <th className="py-3 px-4">Next Action</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{item.company || item.clientName}</span>
                        {item.goal && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[120px]">
                            {item.goal.title}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div>{item.role || item.projectName}</div>
                      {item.source && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.source}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => handleStageChange(item.id, e.target.value)}
                        className="text-[11px] font-semibold px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 focus:outline-none focus:border-brand-500"
                      >
                        {(activeTab === 'JOBS' ? JOB_STAGES : activeTab === 'FREELANCE' ? FREELANCE_STAGES : INTERNSHIP_STAGES).map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    <td className="py-3.5 px-4">
                      {activeTab === 'FREELANCE' ? (
                        <span className="font-semibold text-slate-800">
                          {item.currency || 'USD'} {item.agreedValue || item.estimatedValue || item.estimatedAmount || '—'}
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-700'
                              : item.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.priority}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {item.nextAction ? (
                        <span className="truncate block max-w-[180px]">{item.nextAction}</span>
                      ) : (
                        <span className="text-slate-400 italic">None set</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.nextActionDate ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-700">
                            {new Date(item.nextActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          {item.followUpDue && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              {item.daysOverdue > 0 ? `${item.daysOverdue}d overdue` : 'Due today'}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {item.isStale && (
                        <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          Stale: {item.daysSinceLastActivity}d inactive
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="View Details"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Opportunity Detail Drawer */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-50/50">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  {activeTab} OPPORTUNITY
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedItem.role || selectedItem.projectName}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedItem.company || selectedItem.clientName}
                </p>
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-medium text-slate-500">Current Stage</span>
                  <div className="font-bold text-sm text-slate-800 mt-0.5">{selectedItem.status}</div>
                </div>

                <select
                  value={selectedItem.status}
                  onChange={(e) => handleStageChange(selectedItem.id, e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs focus:outline-none focus:border-brand-500"
                >
                  {(activeTab === 'JOBS' ? JOB_STAGES : activeTab === 'FREELANCE' ? FREELANCE_STAGES : INTERNSHIP_STAGES).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Core Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Goal Connected</span>
                  <span className="font-semibold text-slate-800">
                    {selectedItem.goal?.title || 'None'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Priority</span>
                  <span className="font-semibold text-slate-800">{selectedItem.priority}</span>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium">Source</span>
                  <span className="font-semibold text-slate-800">{selectedItem.source || 'Direct'}</span>
                </div>

                {activeTab === 'JOBS' && (
                  <div>
                    <span className="text-slate-400 block font-medium">Work Mode</span>
                    <span className="font-semibold text-slate-800">{selectedItem.workMode}</span>
                  </div>
                )}

                {activeTab === 'FREELANCE' && (
                  <div>
                    <span className="text-slate-400 block font-medium">Commercial Value</span>
                    <span className="font-semibold text-slate-800">
                      {selectedItem.currency} {selectedItem.agreedValue || selectedItem.estimatedValue || '—'}
                    </span>
                  </div>
                )}
              </div>

              {/* Next Action Box */}
              <div className="p-4 rounded-xl border border-brand-100 bg-brand-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                    <Clock size={14} className="text-brand-600" />
                    Next Action
                  </span>
                  {selectedItem.nextActionDate && (
                    <span className="text-[11px] font-semibold text-brand-700">
                      Due: {new Date(selectedItem.nextActionDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 font-medium">
                  {selectedItem.nextAction || 'No immediate action configured.'}
                </p>

                {selectedItem.nextAction && (
                  <button
                    onClick={handleCreateTaskFromNextAction}
                    className="mt-2 text-xs font-bold text-brand-700 bg-white border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors inline-flex items-center gap-1.5"
                  >
                    <ListTodo size={14} />
                    <span>Add Next Action to Tasks</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Notes & Context</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80 whitespace-pre-wrap">
                    {selectedItem.notes}
                  </p>
                </div>
              )}

              {/* Activity Timeline (Immutable History) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <History size={14} className="text-slate-500" />
                    Activity History
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    {selectedItem.activities?.length || 0} events
                  </span>
                </div>

                {/* Add Note / Activity Form */}
                <form onSubmit={handleAddActivity} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Log recruiter call, meeting, or prep note..."
                    value={newActivityNote}
                    onChange={(e) => setNewActivityNote(e.target.value)}
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Log
                  </button>
                </form>

                {/* Timeline Entries */}
                <div className="space-y-3 pt-2">
                  {selectedItem.activities && selectedItem.activities.length > 0 ? (
                    selectedItem.activities.map((act) => (
                      <div key={act.id} className="relative pl-4 border-l-2 border-slate-200 space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">{act.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(act.occurredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {act.description && (
                          <p className="text-slate-600 text-[11px] whitespace-pre-wrap">{act.description}</p>
                        )}
                        {act.fromStatus && act.toStatus && (
                          <span className="inline-block text-[10px] font-semibold text-slate-500">
                            {act.fromStatus} → {act.toStatus}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => handleToggleArchive(selectedItem.id)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg border border-slate-200 bg-white inline-flex items-center gap-1.5"
              >
                <Archive size={14} />
                <span>{selectedItem.archivedAt ? 'Restore Opportunity' : 'Archive'}</span>
              </button>

              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-3 py-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Opportunity Modal */}
      {showAddModal && (
        <CreateOpportunityModal
          tab={activeTab}
          goals={goals}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

// Modal for adding a new Opportunity
const CreateOpportunityModal = ({ tab, goals, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    company: '',
    clientName: '',
    role: '',
    projectName: '',
    goalId: '',
    source: 'LINKEDIN',
    workMode: 'REMOTE',
    employmentType: 'FULL_TIME',
    priority: 'MEDIUM',
    status: tab === 'FREELANCE' ? 'LEAD' : 'SAVED',
    estimatedValue: '',
    currency: 'USD',
    nextAction: '',
    nextActionDate: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (tab === 'JOBS') {
        await opportunityService.createJob({
          company: formData.company,
          role: formData.role,
          goalId: formData.goalId || undefined,
          source: formData.source,
          workMode: formData.workMode,
          employmentType: formData.employmentType,
          priority: formData.priority,
          status: formData.status,
          nextAction: formData.nextAction || undefined,
          nextActionDate: formData.nextActionDate || undefined,
          notes: formData.notes || undefined,
        });
      } else if (tab === 'FREELANCE') {
        await opportunityService.createFreelance({
          clientName: formData.clientName,
          projectName: formData.projectName,
          goalId: formData.goalId || undefined,
          source: formData.source,
          priority: formData.priority,
          status: formData.status,
          estimatedValue: formData.estimatedValue || undefined,
          currency: formData.currency,
          nextAction: formData.nextAction || undefined,
          nextActionDate: formData.nextActionDate || undefined,
          notes: formData.notes || undefined,
        });
      } else {
        await opportunityService.createInternship({
          company: formData.company,
          role: formData.role,
          goalId: formData.goalId || undefined,
          source: formData.source,
          workMode: formData.workMode,
          priority: formData.priority,
          status: formData.status,
          nextAction: formData.nextAction || undefined,
          nextActionDate: formData.nextActionDate || undefined,
          notes: formData.notes || undefined,
        });
      }
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create opportunity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            {tab === 'JOBS' ? 'New Job Opportunity' : tab === 'FREELANCE' ? 'New Freelance Lead' : 'New Internship'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {tab === 'FREELANCE' ? (
            <>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Website Redesign & CMS"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Company *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe, Acme Labs"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Developer"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Linked Goal</label>
              <select
                value={formData.goalId}
                onChange={(e) => setFormData({ ...formData, goalId: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              >
                <option value="">None (Flexible)</option>
                {goals.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Source</label>
              <input
                type="text"
                placeholder="LinkedIn, Referral, Upwork..."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>

            {tab === 'FREELANCE' ? (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estimated Value</label>
                <input
                  type="text"
                  placeholder="e.g. 35000 INR or $2,500"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                />
              </div>
            ) : (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Work Mode</label>
                <select
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">Onsite</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Next Action</label>
              <input
                type="text"
                placeholder="e.g. Follow up on CV"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Next Action Date</label>
              <input
                type="date"
                value={formData.nextActionDate}
                onChange={(e) => setFormData({ ...formData, nextActionDate: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Notes</label>
            <textarea
              rows={3}
              placeholder="Requirements, contact details, links..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
