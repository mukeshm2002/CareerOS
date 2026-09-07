import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Plus, X, Star } from 'lucide-react';

const experienceLevels = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'ENTRY_LEVEL', label: 'Entry Level (0-1 yrs)' },
  { value: 'JUNIOR', label: 'Junior (1-3 yrs)' },
  { value: 'MID_LEVEL', label: 'Mid-Level (3-5 yrs)' },
  { value: 'SENIOR', label: 'Senior (5-8 yrs)' },
  { value: 'LEAD', label: 'Lead / Staff (8+ yrs)' },
  { value: 'MANAGER', label: 'Engineering Manager' },
  { value: 'OTHER', label: 'Other' },
];

export const Step6Skills = ({ profile, skills = [], onUpdateProfile, onUpdateSkills, onNext, onBack }) => {
  const [newSkillName, setNewSkillName] = useState('');

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) return;

    onUpdateSkills([
      ...skills,
      { name: newSkillName.trim(), category: 'TECHNICAL', selfRating: 3 },
    ]);
    setNewSkillName('');
  };

  const handleRemoveSkill = (skillName) => {
    onUpdateSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleRatingChange = (skillName, rating) => {
    onUpdateSkills(
      skills.map((s) => (s.name === skillName ? { ...s, selfRating: rating } : s))
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">
          Career Profile & Skills Baseline
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Define your current role, target role, and baseline skills to establish your growth trajectory.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Current Role / Major
          </label>
          <input
            type="text"
            value={profile.currentRole || ''}
            onChange={(e) => onUpdateProfile({ currentRole: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            placeholder="e.g. Software Developer / CS Student"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Role
          </label>
          <input
            type="text"
            value={profile.targetRole || ''}
            onChange={(e) => onUpdateProfile({ targetRole: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            placeholder="e.g. Full Stack Developer"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Experience Level
          </label>
          <select
            value={profile.experienceLevel || 'MID_LEVEL'}
            onChange={(e) => onUpdateProfile({ experienceLevel: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white cursor-pointer"
          >
            {experienceLevels.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Primary Career Mission / Interest
          </label>
          <input
            type="text"
            value={profile.careerMission || ''}
            onChange={(e) => onUpdateProfile({ careerMission: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
            placeholder="e.g. Backend architecture & distributed systems"
          />
        </div>
      </div>

      {/* Skills Baseline */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Baseline Skills</h3>
            <p className="text-[11px] text-slate-400">
              Ratings are labeled as <strong className="text-slate-600">Self Assessment</strong> (1–5 scale)
            </p>
          </div>
        </div>

        {/* Add Skill form */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSkill(e);
            }}
            placeholder="Add skill (e.g. React, Java, Docker, SQL)..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:bg-white"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        {/* Skills list */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {skills.map((skill) => (
            <div
              key={skill.name}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{skill.name}</span>
                <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Self Assessment
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleRatingChange(skill.name, lvl)}
                      className={`h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors ${
                        lvl <= skill.selfRating
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.name)}
                  className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 py-2.5 px-5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-all shadow-sm shadow-brand-600/30 cursor-pointer"
        >
          <span>Review Summary</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
