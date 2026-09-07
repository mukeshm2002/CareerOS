const prisma = require('../../config/db');

class OpportunityActivityService {
  /**
   * Record an immutable activity for an opportunity
   * @param {string} userId
   * @param {Object} data
   */
  async recordActivity(userId, data) {
    const {
      opportunityType,
      opportunityId,
      activityType,
      fromStatus = null,
      toStatus = null,
      title,
      description = null,
      occurredAt = new Date(),
    } = data;

    const payload = {
      userId,
      opportunityType,
      opportunityId,
      activityType,
      fromStatus,
      toStatus,
      title,
      description,
      occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
    };

    if (opportunityType === 'JOB') {
      payload.jobOpportunityId = opportunityId;
    } else if (opportunityType === 'FREELANCE') {
      payload.freelanceOpportunityId = opportunityId;
    } else if (opportunityType === 'INTERNSHIP') {
      payload.internshipOpportunityId = opportunityId;
    }

    return prisma.opportunityActivity.create({
      data: payload,
    });
  }

  /**
   * Record a status change if the status actually changed
   * @param {string} userId
   * @param {string} opportunityType - 'JOB' | 'FREELANCE' | 'INTERNSHIP'
   * @param {string} opportunityId
   * @param {string} fromStatus
   * @param {string} toStatus
   * @param {string} notes
   * @param {Object} [tx] - optional prisma transaction client
   */
  async recordStatusChange(userId, opportunityType, opportunityId, fromStatus, toStatus, notes = null, tx = null) {
    // If status did not change, do not create duplicate status history (Section 12)
    if (fromStatus === toStatus) {
      return null;
    }

    const client = tx || prisma;
    const title = `Moved from ${fromStatus} to ${toStatus}`;

    const payload = {
      userId,
      opportunityType,
      opportunityId,
      activityType: 'STATUS_CHANGED',
      fromStatus,
      toStatus,
      title,
      description: notes || null,
      occurredAt: new Date(),
    };

    if (opportunityType === 'JOB') {
      payload.jobOpportunityId = opportunityId;
    } else if (opportunityType === 'FREELANCE') {
      payload.freelanceOpportunityId = opportunityId;
    } else if (opportunityType === 'INTERNSHIP') {
      payload.internshipOpportunityId = opportunityId;
    }

    return client.opportunityActivity.create({
      data: payload,
    });
  }

  /**
   * Fetch activity timeline for an opportunity
   * @param {string} userId
   * @param {string} opportunityType
   * @param {string} opportunityId
   */
  async getActivitiesForOpportunity(userId, opportunityType, opportunityId) {
    return prisma.opportunityActivity.findMany({
      where: {
        userId,
        opportunityType,
        opportunityId,
      },
      orderBy: { occurredAt: 'desc' },
    });
  }
}

module.exports = new OpportunityActivityService();
