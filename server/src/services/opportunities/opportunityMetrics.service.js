const prisma = require('../../config/db');
const { getUserLocalDate } = require('../../utils/timezone');

class OpportunityMetricsService {
  /**
   * Get user's local today date string
   */
  async getUserLocalToday(userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const tz = profile?.timezone || 'Asia/Kolkata';
    return {
      timezone: tz,
      localTodayStr: getUserLocalDate(tz),
    };
  }

  /**
   * Calculate comprehensive factual metrics for all opportunity types
   */
  async getMetrics(userId) {
    const { timezone, localTodayStr } = await this.getUserLocalToday(userId);

    const [allJobs, allFreelance, allInternships] = await Promise.all([
      prisma.jobOpportunity.findMany({
        where: { userId, archivedAt: null },
        include: { activities: true },
      }),
      prisma.freelanceOpportunity.findMany({
        where: { userId, archivedAt: null },
        include: { activities: true },
      }),
      prisma.internshipOpportunity.findMany({
        where: { userId, archivedAt: null },
        include: { activities: true },
      }),
    ]);

    // 1. Jobs Calculations
    const jobStageCounts = {
      SAVED: 0,
      PREPARING: 0,
      APPLIED: 0,
      SCREENING: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      FINAL_INTERVIEW: 0,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    let jobsActiveCount = 0;
    let jobsApplicationsCount = 0;
    let jobsInterviewsCount = 0;
    let jobsOffersCount = 0;
    let jobsFollowUpDueCount = 0;

    allJobs.forEach((job) => {
      if (jobStageCounts[job.status] !== undefined) {
        jobStageCounts[job.status]++;
      }

      const isTerminal = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'].includes(job.status);
      if (!isTerminal) {
        jobsActiveCount++;
      }

      // Applied count
      const hasAppliedActivity = job.activities.some((a) => a.activityType === 'APPLICATION_SENT');
      if (job.appliedDate || hasAppliedActivity || ['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'ACCEPTED'].includes(job.status)) {
        jobsApplicationsCount++;
      }

      // Interview count
      const hasInterviewActivity = job.activities.some((a) => a.activityType === 'INTERVIEW');
      if (hasInterviewActivity || ['INTERVIEW', 'FINAL_INTERVIEW', 'OFFER', 'ACCEPTED'].includes(job.status)) {
        jobsInterviewsCount++;
      }

      // Offer count
      const hasOfferActivity = job.activities.some((a) => a.activityType === 'OFFER_RECEIVED' || a.activityType === 'OFFER_ACCEPTED');
      if (hasOfferActivity || ['OFFER', 'ACCEPTED'].includes(job.status)) {
        jobsOffersCount++;
      }

      // Follow-up due
      if (job.nextActionDate && !isTerminal) {
        const actionStr = new Date(job.nextActionDate).toISOString().slice(0, 10);
        if (actionStr <= localTodayStr) {
          jobsFollowUpDueCount++;
        }
      }
    });

    const jobInterviewRate = jobsApplicationsCount > 0
      ? Math.round((jobsInterviewsCount / jobsApplicationsCount) * 100)
      : null;

    const jobOfferRate = jobsApplicationsCount > 0
      ? Math.round((jobsOffersCount / jobsApplicationsCount) * 100)
      : null;

    // 2. Freelance Calculations
    const freelanceStageCounts = {
      LEAD: 0,
      RESEARCHING: 0,
      CONTACTED: 0,
      DISCOVERY: 0,
      MEETING: 0,
      PROPOSAL_PREPARATION: 0,
      PROPOSAL_SENT: 0,
      FOLLOW_UP: 0,
      NEGOTIATION: 0,
      WON: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      LOST: 0,
    };

    let freelanceActiveCount = 0;
    let freelanceContactedCount = 0;
    let freelanceProposalsCount = 0;
    let freelanceWonCount = 0;
    let freelanceTotalAgreedValue = 0;
    let freelanceFollowUpDueCount = 0;

    allFreelance.forEach((f) => {
      if (freelanceStageCounts[f.status] !== undefined) {
        freelanceStageCounts[f.status]++;
      }

      const isTerminal = ['COMPLETED', 'LOST', 'ARCHIVED'].includes(f.status);
      if (!isTerminal) {
        freelanceActiveCount++;
      }

      if (f.firstContactDate || ['CONTACTED', 'DISCOVERY', 'MEETING', 'PROPOSAL_PREPARATION', 'PROPOSAL_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'IN_PROGRESS', 'COMPLETED'].includes(f.status)) {
        freelanceContactedCount++;
      }

      const hasProposalActivity = f.activities.some((a) => a.activityType === 'PROPOSAL_SENT');
      if (f.proposalDate || hasProposalActivity || ['PROPOSAL_SENT', 'FOLLOW_UP', 'NEGOTIATION', 'WON', 'IN_PROGRESS', 'COMPLETED'].includes(f.status)) {
        freelanceProposalsCount++;
      }

      const hasWonActivity = f.activities.some((a) => a.activityType === 'WON');
      if (hasWonActivity || ['WON', 'IN_PROGRESS', 'COMPLETED'].includes(f.status)) {
        freelanceWonCount++;
        if (f.agreedValue) {
          freelanceTotalAgreedValue += f.agreedValue;
        }
      }

      if (f.nextActionDate && !isTerminal) {
        const actionStr = new Date(f.nextActionDate).toISOString().slice(0, 10);
        if (actionStr <= localTodayStr) {
          freelanceFollowUpDueCount++;
        }
      }
    });

    const freelanceProposalWinRate = freelanceProposalsCount > 0
      ? Math.round((freelanceWonCount / freelanceProposalsCount) * 100)
      : null;

    // 3. Internship Calculations
    const internshipStageCounts = {
      SAVED: 0,
      PREPARING: 0,
      APPLIED: 0,
      SCREENING: 0,
      ASSESSMENT: 0,
      INTERVIEW: 0,
      OFFER: 0,
      ACCEPTED: 0,
      REJECTED: 0,
      WITHDRAWN: 0,
    };

    let internshipsActiveCount = 0;
    let internshipsFollowUpDueCount = 0;

    allInternships.forEach((it) => {
      if (internshipStageCounts[it.status] !== undefined) {
        internshipStageCounts[it.status]++;
      }

      const isTerminal = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'].includes(it.status);
      if (!isTerminal) {
        internshipsActiveCount++;
      }

      if (it.nextActionDate && !isTerminal) {
        const actionStr = new Date(it.nextActionDate).toISOString().slice(0, 10);
        if (actionStr <= localTodayStr) {
          internshipsFollowUpDueCount++;
        }
      }
    });

    // 4. Source Breakdown across all opportunities
    const sourceMap = {};
    const recordSource = (source, sourceLabel) => {
      let label = source || 'OTHER';
      if (label === 'OTHER' && sourceLabel) {
        label = sourceLabel.trim();
      }
      sourceMap[label] = (sourceMap[label] || 0) + 1;
    };

    const sourceMapJobs = {};
    const sourceMapFreelance = {};

    allJobs.forEach((j) => {
      recordSource(j.source, j.sourceLabel);
      const l = j.sourceLabel?.trim() || j.source || 'UNKNOWN';
      sourceMapJobs[l] = (sourceMapJobs[l] || 0) + 1;
    });
    allFreelance.forEach((f) => {
      recordSource(f.source, f.sourceLabel);
      const l = f.sourceLabel?.trim() || f.source || 'UNKNOWN';
      sourceMapFreelance[l] = (sourceMapFreelance[l] || 0) + 1;
    });
    allInternships.forEach((it) => recordSource(it.source, it.sourceLabel));

    const sourceBreakdown = Object.entries(sourceMap).map(([source, count]) => ({
      source,
      count,
    })).sort((a, b) => b.count - a.count);

    const sourcesJobs = Object.entries(sourceMapJobs).map(([source, count]) => ({
      source,
      count,
    })).sort((a, b) => b.count - a.count);

    const sourcesFreelance = Object.entries(sourceMapFreelance).map(([source, count]) => ({
      source,
      count,
    })).sort((a, b) => b.count - a.count);

    // Total follow-up due
    const totalFollowUpsDue = jobsFollowUpDueCount + freelanceFollowUpDueCount + internshipsFollowUpDueCount;

    return {
      timezone,
      localTodayStr,
      summary: {
        totalOpportunities: allJobs.length + allFreelance.length + allInternships.length,
        totalActive: jobsActiveCount + freelanceActiveCount + internshipsActiveCount,
        totalFollowUpsDue,
      },
      jobs: {
        total: allJobs.length,
        active: jobsActiveCount,
        stages: jobStageCounts,
        applications: jobsApplicationsCount,
        totalApplications: jobsApplicationsCount,
        interviews: jobsInterviewsCount,
        totalInterviews: jobsInterviewsCount,
        offers: jobsOffersCount,
        totalOffers: jobsOffersCount,
        interviewRate: jobInterviewRate,
        offerRate: jobOfferRate,
        followUpsDue: jobsFollowUpDueCount,
      },
      freelance: {
        total: allFreelance.length,
        active: freelanceActiveCount,
        stages: freelanceStageCounts,
        leads: allFreelance.length,
        contacted: freelanceContactedCount,
        proposals: freelanceProposalsCount,
        totalProposals: freelanceProposalsCount,
        won: freelanceWonCount,
        totalWon: freelanceWonCount,
        proposalWinRate: freelanceProposalWinRate,
        totalAgreedValue: freelanceTotalAgreedValue,
        followUpsDue: freelanceFollowUpDueCount,
      },
      internships: {
        total: allInternships.length,
        active: internshipsActiveCount,
        stages: internshipStageCounts,
        followUpsDue: internshipsFollowUpDueCount,
      },
      sources: {
        all: sourceBreakdown,
        jobs: sourcesJobs,
        freelance: sourcesFreelance,
      },
      sourceBreakdown,
    };
  }

  /**
   * Calculate opportunity activity within a specific period (for Weekly Review & Progress)
   * @param {string} userId
   * @param {Date} start
   * @param {Date} end
   */
  async getOpportunityMetricsForPeriod(userId, start, end) {
    const activities = await prisma.opportunityActivity.findMany({
      where: {
        userId,
        occurredAt: { gte: start, lte: end },
      },
    });

    const applicationsSubmitted = activities.filter(
      (a) => a.activityType === 'APPLICATION_SENT' || (a.activityType === 'STATUS_CHANGED' && a.toStatus === 'APPLIED')
    ).length;

    const interviews = activities.filter(
      (a) => a.activityType === 'INTERVIEW' || (a.activityType === 'STATUS_CHANGED' && (a.toStatus === 'INTERVIEW' || a.toStatus === 'FINAL_INTERVIEW'))
    ).length;

    const freelanceOutreach = activities.filter(
      (a) => a.opportunityType === 'FREELANCE' && ['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP'].includes(a.activityType)
    ).length;

    const proposalsSent = activities.filter(
      (a) => a.activityType === 'PROPOSAL_SENT' || (a.activityType === 'STATUS_CHANGED' && a.toStatus === 'PROPOSAL_SENT')
    ).length;

    const freelanceProjectsWon = activities.filter(
      (a) => a.activityType === 'WON' || (a.activityType === 'STATUS_CHANGED' && a.toStatus === 'WON')
    ).length;

    return {
      applicationsSubmitted,
      interviews,
      freelanceOutreach,
      proposalsSent,
      freelanceProjectsWon,
    };
  }

  /**
   * Compact dashboard summary (Section 37 & 38)
   */
  async getDashboardSummary(userId) {
    const { localTodayStr } = await this.getUserLocalToday(userId);
    const [jobs, freelance, internships] = await Promise.all([
      prisma.jobOpportunity.findMany({
        where: { userId, archivedAt: null },
        orderBy: [{ nextActionDate: 'asc' }, { updatedAt: 'desc' }],
      }),
      prisma.freelanceOpportunity.findMany({
        where: { userId, archivedAt: null },
        orderBy: [{ nextActionDate: 'asc' }, { updatedAt: 'desc' }],
      }),
      prisma.internshipOpportunity.findMany({
        where: { userId, archivedAt: null },
        orderBy: [{ nextActionDate: 'asc' }, { updatedAt: 'desc' }],
      }),
    ]);

    const activeJobs = jobs.filter((j) => !['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'].includes(j.status));
    const activeFreelance = freelance.filter((f) => !['COMPLETED', 'LOST', 'ARCHIVED'].includes(f.status));
    const activeInternships = internships.filter((i) => !['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'].includes(i.status));

    const jobInterviews = activeJobs.filter((j) => ['INTERVIEW', 'FINAL_INTERVIEW'].includes(j.status)).length;
    const freelanceProposals = activeFreelance.filter((f) => ['PROPOSAL_PREPARATION', 'PROPOSAL_SENT'].includes(f.status)).length;

    let followUpsDue = 0;
    const countFollowUps = (items) => {
      items.forEach((item) => {
        if (item.nextActionDate) {
          const dStr = new Date(item.nextActionDate).toISOString().slice(0, 10);
          if (dStr <= localTodayStr) {
            followUpsDue++;
          }
        }
      });
    };
    countFollowUps(activeJobs);
    countFollowUps(activeFreelance);
    countFollowUps(activeInternships);

    return {
      jobs: {
        activeCount: activeJobs.length,
        interviewsCount: jobInterviews,
        activeList: activeJobs,
      },
      freelance: {
        activeCount: activeFreelance.length,
        proposalsCount: freelanceProposals,
        activeList: activeFreelance,
      },
      internships: {
        activeCount: activeInternships.length,
        activeList: activeInternships,
      },
      followUpsDue,
    };
  }
}

module.exports = new OpportunityMetricsService();
