// Deterministic roadmap templates based on GoalType (Section 4)

const ROADMAP_TEMPLATES = {
  FIRST_JOB: [
    { sequence: 1, title: 'Career Direction', description: 'Define target role, industry, and entry requirements.' },
    { sequence: 2, title: 'Skill Assessment', description: 'Establish baseline technical and soft skill competencies.' },
    { sequence: 3, title: 'Skill Development', description: 'Close high-priority fundamental skill gaps.' },
    { sequence: 4, title: 'Build Projects', description: 'Construct core projects demonstrating practical ability.' },
    { sequence: 5, title: 'Portfolio Ready', description: 'Assemble clean GitHub repositories and portfolio showcase.' },
    { sequence: 6, title: 'Resume & Profile', description: 'Optimize resume, LinkedIn, and online professional profiles.' },
    { sequence: 7, title: 'Applications', description: 'Begin structured job search and tracking pipeline.' },
    { sequence: 8, title: 'Interview Preparation', description: 'Prepare behavioral stories and technical mock interviews.' },
    { sequence: 9, title: 'Interviews', description: 'Execute screening, technical rounds, and follow-ups.' },
    { sequence: 10, title: 'First Job', description: 'Evaluate offer, negotiate terms, and complete onboarding.' },
  ],

  JOB_SWITCH: [
    { sequence: 1, title: 'Define Target Role', description: 'Identify target seniority, domain, and salary tier.' },
    { sequence: 2, title: 'Assess Current Skills', description: 'Benchmark current competency against senior role standards.' },
    { sequence: 3, title: 'Close Critical Skill Gaps', description: 'Master high-leverage frameworks and advanced system architecture.' },
    { sequence: 4, title: 'Strengthen Proof of Work', description: 'Build evidence of production impact and complex problem-solving.' },
    { sequence: 5, title: 'Update Resume & Profiles', description: 'Highlight quantifiable metrics, leadership, and scale.' },
    { sequence: 6, title: 'Prepare for Interviews', description: 'Intensive practice on system design and algorithmic patterns.' },
    { sequence: 7, title: 'Start Applications', description: 'Engage recruiters and targeted employee referral outreach.' },
    { sequence: 8, title: 'Interview Pipeline', description: 'Progress through technical screenings and on-sites.' },
    { sequence: 9, title: 'Evaluate Offers', description: 'Compare compensation, culture, and growth opportunities.' },
    { sequence: 10, title: 'Transition', description: 'Manage current exit and successfully start target role.' },
  ],

  SALARY_GROWTH: [
    { sequence: 1, title: 'Define Salary Target', description: 'Establish realistic and stretch compensation numbers.' },
    { sequence: 2, title: 'Benchmark Current Market', description: 'Research compensation data points for experience and location.' },
    { sequence: 3, title: 'Identify Value Gaps', description: 'Determine missing business value skills and ownership areas.' },
    { sequence: 4, title: 'Strengthen High-Value Skills', description: 'Develop architecture, performance optimization, or cloud expertise.' },
    { sequence: 5, title: 'Build Evidence of Impact', description: 'Document revenue saved, latency reduced, or teams empowered.' },
    { sequence: 6, title: 'Improve Professional Profile', description: 'Position yourself as a specialized problem-solver in high demand.' },
    { sequence: 7, title: 'Internal / External Opportunities', description: 'Open discussions internally and test external market rates.' },
    { sequence: 8, title: 'Negotiation Preparation', description: 'Prepare leverage points, counter-offer strategies, and walk-away points.' },
    { sequence: 9, title: 'Compensation Discussion', description: 'Conduct structured performance or offer negotiation meetings.' },
    { sequence: 10, title: 'Achieve Target', description: 'Lock in revised package and confirm revised responsibilities.' },
  ],

  FREELANCING: [
    { sequence: 1, title: 'Choose Service', description: 'Package a specific high-value service offering.' },
    { sequence: 2, title: 'Define Target Client', description: 'Identify buyer profile, industry, and budget range.' },
    { sequence: 3, title: 'Validate Skills', description: 'Ensure ability to deliver end-to-end client outcomes independently.' },
    { sequence: 4, title: 'Build Proof of Work', description: 'Create focused demo project or case study tailored to clients.' },
    { sequence: 5, title: 'Create Portfolio', description: 'Publish single-page offering with testimonials and social proof.' },
    { sequence: 6, title: 'Define Pricing', description: 'Establish value-based or project-based rate cards.' },
    { sequence: 7, title: 'Create Proposal System', description: 'Standardize scope of work templates and contracts.' },
    { sequence: 8, title: 'Start Outreach', description: 'Execute daily cold outreach and network conversations.' },
    { sequence: 9, title: 'Client Conversations', description: 'Lead discovery calls and send custom proposals.' },
    { sequence: 10, title: 'First Paid Client', description: 'Sign agreement, collect deposit, and deliver successful milestone.' },
  ],

  PROMOTION: [
    { sequence: 1, title: 'Define Target Role', description: 'Review target title expectations and rubric.' },
    { sequence: 2, title: 'Understand Promotion Criteria', description: 'Align with manager on exact deliverables and timeline.' },
    { sequence: 3, title: 'Identify Competency Gaps', description: 'Audit technical and cross-functional blind spots.' },
    { sequence: 4, title: 'Build Required Skills', description: 'Demonstrate next-level technical rigor and mentorship.' },
    { sequence: 5, title: 'Increase Ownership', description: 'Take accountability for critical project or team initiative.' },
    { sequence: 6, title: 'Document Impact', description: 'Maintain brag document tracking key business wins.' },
    { sequence: 7, title: 'Gather Feedback', description: 'Solicit 360 peer feedback and refine execution.' },
    { sequence: 8, title: 'Promotion Discussion', description: 'Present formal promotion case and sponsor support.' },
    { sequence: 9, title: 'Close Remaining Gaps', description: 'Address any committee comments or calibration feedback.' },
    { sequence: 10, title: 'Promotion Decision', description: 'Receive title elevation and compensation adjustment.' },
  ],

  CAREER_CHANGE: [
    { sequence: 1, title: 'Choose Target Career', description: 'Decide on destination domain and target entry role.' },
    { sequence: 2, title: 'Research Role Requirements', description: 'Analyze 20+ job postings for must-have competencies.' },
    { sequence: 3, title: 'Transferable Skills Assessment', description: 'Map existing domain knowledge to new career requirements.' },
    { sequence: 4, title: 'Skill Gap Analysis', description: 'Isolate technical barriers requiring focused study.' },
    { sequence: 5, title: 'Learn Core Skills', description: 'Complete rigorous self-directed curriculum.' },
    { sequence: 6, title: 'Build Relevant Projects', description: 'Create 2 domain-relevant capstone projects.' },
    { sequence: 7, title: 'Reposition Resume & Profile', description: 'Rewrite narrative to bridge past experience with target role.' },
    { sequence: 8, title: 'Build Network', description: 'Connect with practitioners in destination field for insights.' },
    { sequence: 9, title: 'Apply / Transition', description: 'Target companies that value cross-functional backgrounds.' },
    { sequence: 10, title: 'Enter New Career', description: 'Land first opportunity and begin career progression.' },
  ],

  SKILL_MASTERY: [
    { sequence: 1, title: 'Define Skill Outcome', description: 'Specify exact capability to be demonstrated.' },
    { sequence: 2, title: 'Baseline Assessment', description: 'Test existing knowledge boundaries and misconceptions.' },
    { sequence: 3, title: 'Fundamentals', description: 'Study foundational theory and internal mechanics.' },
    { sequence: 4, title: 'Core Practice', description: 'Solve standard problems and build small utilities.' },
    { sequence: 5, title: 'Intermediate Application', description: 'Integrate skill into full-stack project or workflow.' },
    { sequence: 6, title: 'Real Project', description: 'Deploy production-grade implementation solving real problem.' },
    { sequence: 7, title: 'Advanced Practice', description: 'Deep dive into performance optimization and edge cases.' },
    { sequence: 8, title: 'External Feedback', description: 'Conduct code review or community critique.' },
    { sequence: 9, title: 'Demonstrate Competence', description: 'Teach, write technical blog, or deliver public talk.' },
    { sequence: 10, title: 'Maintain Skill', description: 'Establish recurring cadence for practice and upkeep.' },
  ],

  CERTIFICATION: [
    { sequence: 1, title: 'Select Certification', description: 'Choose credential with highest career return.' },
    { sequence: 2, title: 'Understand Exam Requirements', description: 'Review domain weighting, passing score, and question format.' },
    { sequence: 3, title: 'Baseline Assessment', description: 'Take diagnostic mock exam to identify weak topics.' },
    { sequence: 4, title: 'Study Plan', description: 'Map out weekly study schedule and resource allocation.' },
    { sequence: 5, title: 'Core Preparation', description: 'Work through official study guide and video curriculum.' },
    { sequence: 6, title: 'Practice Tests', description: 'Complete full-length timed mock exams.' },
    { sequence: 7, title: 'Gap Revision', description: 'Deep-dive review on incorrect questions.' },
    { sequence: 8, title: 'Exam Readiness', description: 'Consistently score 85%+ on unseen practice exams.' },
    { sequence: 9, title: 'Take Exam', description: 'Complete official proctored test.' },
    { sequence: 10, title: 'Certification Completed', description: 'Add badge to LinkedIn and resume.' },
  ],

  PORTFOLIO: [
    { sequence: 1, title: 'Define Target Audience', description: 'Identify prospective hiring managers and clients.' },
    { sequence: 2, title: 'Select Best Work', description: 'Choose top 3 projects showcasing diverse depth.' },
    { sequence: 3, title: 'Identify Missing Proof', description: 'Spot missing capabilities like testing or deployment.' },
    { sequence: 4, title: 'Build Missing Projects', description: 'Fill technical gaps with clean modern apps.' },
    { sequence: 5, title: 'Prepare Case Studies', description: 'Write problem, solution, metrics, and architecture summaries.' },
    { sequence: 6, title: 'Create Portfolio Structure', description: 'Design clean responsive layout focused on readability.' },
    { sequence: 7, title: 'Build Portfolio', description: 'Develop portfolio site with dark mode and live demos.' },
    { sequence: 8, title: 'Review & Improve', description: 'Audit lighthouse performance, accessibility, and mobile UX.' },
    { sequence: 9, title: 'Publish', description: 'Deploy to custom domain with SSL and analytics.' },
    { sequence: 10, title: 'Maintain', description: 'Regularly update resume link, case studies, and blog posts.' },
  ],

  BUSINESS: [
    { sequence: 1, title: 'Define Professional Offering', description: 'Clarify technical consulting or digital service model.' },
    { sequence: 2, title: 'Identify Target Customer', description: 'Pinpoint specific business niche with urgent pain point.' },
    { sequence: 3, title: 'Validate Problem', description: 'Interview 5 prospective buyers to confirm willingness to pay.' },
    { sequence: 4, title: 'Define Service / Product', description: 'Scope minimum sellable offer with defined deliverables.' },
    { sequence: 5, title: 'Build Minimum Proof', description: 'Create lightweight prototype or working case study.' },
    { sequence: 6, title: 'Pricing', description: 'Set fixed upfront pricing with clear ROI for buyer.' },
    { sequence: 7, title: 'Customer Acquisition Plan', description: 'Establish daily outbound and content distribution cadence.' },
    { sequence: 8, title: 'First Outreach', description: 'Send 20 highly personalized value-first messages.' },
    { sequence: 9, title: 'First Customer', description: 'Sign first contract and onboard buyer.' },
    { sequence: 10, title: 'Review & Improve', description: 'Gather customer feedback and optimize the workflow.' },
  ],
};

class RoadmapTemplateService {
  /**
   * Returns deterministic milestone stages for a goal type
   * Returns null if CUSTOM or unsupported
   */
  getTemplate(goalType) {
    if (!goalType || goalType === 'CUSTOM') {
      return null;
    }
    return ROADMAP_TEMPLATES[goalType] || null;
  }

  /**
   * Generates a preview object for frontend confirmation
   */
  generatePreview(goalType, goalTitle = 'Career Goal') {
    const template = this.getTemplate(goalType);
    if (!template) {
      return {
        goalType,
        goalTitle,
        isCustom: true,
        stagesCount: 0,
        milestones: [],
        message: 'Custom goal. Build milestones manually to fit your specific path.',
      };
    }

    return {
      goalType,
      goalTitle,
      isCustom: false,
      stagesCount: template.length,
      milestones: template.map((m) => ({
        sequence: m.sequence,
        title: m.title,
        description: m.description,
        status: 'NOT_STARTED',
      })),
      message: `Deterministic 10-stage roadmap template for ${goalType.replace('_', ' ')}.`,
    };
  }

  getSupportedTypes() {
    return Object.keys(ROADMAP_TEMPLATES);
  }
}

module.exports = new RoadmapTemplateService();
