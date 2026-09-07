const prisma = require('../../config/db');
const opportunityActivityService = require('./opportunityActivity.service');
const { getUserLocalDate } = require('../../utils/timezone');

const TERMINAL_FREELANCE_STAGES = ['COMPLETED', 'LOST', 'ARCHIVED'];

class FreelanceOpportunityService {
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

  async validateGoalOwnership(userId, goalId) {
    if (!goalId) return;
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      const err = new Error('Referenced goal not found or does not belong to user');
      err.statusCode = 404;
      throw err;
    }
  }

  enrichFreelance(f, localTodayStr) {
    const isTerminal = TERMINAL_FREELANCE_STAGES.includes(f.status);
    let followUpDue = false;
    let daysOverdue = 0;

    if (f.nextActionDate && !isTerminal) {
      const actionDateStr = new Date(f.nextActionDate).toISOString().slice(0, 10);
      if (actionDateStr <= localTodayStr) {
        followUpDue = true;
        const diffMs = new Date(localTodayStr) - new Date(actionDateStr);
        daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // Staleness: CONTACTED, PROPOSAL_SENT, FOLLOW_UP with >= 10 days
    let isStale = false;
    let daysSinceLastActivity = 0;
    let staleReason = null;

    if (['CONTACTED', 'PROPOSAL_SENT', 'FOLLOW_UP'].includes(f.status) && !isTerminal) {
      const latestDate = f.activities && f.activities.length > 0
        ? new Date(f.activities[0].occurredAt)
        : (f.proposalDate ? new Date(f.proposalDate) : new Date(f.updatedAt));

      const now = new Date();
      const diffDays = Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));
      daysSinceLastActivity = Math.max(0, diffDays);

      if (diffDays >= 10) {
        isStale = true;
        staleReason = `No activity recorded for ${diffDays} days in ${f.status} stage`;
      }
    }

    return {
      ...f,
      followUpDue,
      daysOverdue,
      isStale,
      daysSinceLastActivity,
      staleReason,
    };
  }

  async listFreelance(userId, query = {}) {
    const { timezone, localTodayStr } = await this.getUserLocalToday(userId);

    const where = {
      userId,
    };

    if (query.archived) {
      where.archivedAt = { not: null };
    } else {
      where.archivedAt = null;
    }

    if (query.status) {
      where.status = query.status;
    }
    if (query.goalId) {
      where.goalId = query.goalId;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.source) {
      where.source = query.source;
    }
    if (query.search) {
      where.OR = [
        { clientName: { contains: query.search, mode: 'insensitive' } },
        { projectName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { updatedAt: 'desc' };
    if (query.sortBy === 'NEXT_ACTION') {
      orderBy = { nextActionDate: 'asc' };
    } else if (query.sortBy === 'PRIORITY') {
      orderBy = { priority: 'asc' };
    } else if (query.sortBy === 'CREATED') {
      orderBy = { createdAt: 'desc' };
    }

    const items = await prisma.freelanceOpportunity.findMany({
      where,
      include: {
        goal: { select: { id: true, title: true } },
        activities: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
      orderBy,
    });

    let enriched = items.map((f) => this.enrichFreelance(f, localTodayStr));

    if (query.followUpDue) {
      enriched = enriched.filter((f) => f.followUpDue);
    }
    if (query.stale) {
      enriched = enriched.filter((f) => f.isStale);
    }

    return {
      timezone,
      freelance: enriched,
      count: enriched.length,
    };
  }

  async getFreelanceById(userId, freelanceId) {
    const { localTodayStr } = await this.getUserLocalToday(userId);

    const item = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
      include: {
        goal: { select: { id: true, title: true } },
        activities: {
          orderBy: { occurredAt: 'desc' },
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!item) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    return this.enrichFreelance(item, localTodayStr);
  }

  async createFreelance(userId, data) {
    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.freelanceOpportunity.create({
        data: {
          userId,
          goalId: data.goalId || null,
          clientName: data.clientName,
          projectName: data.projectName,
          source: data.source || null,
          sourceLabel: data.sourceLabel || null,
          projectType: data.projectType || null,
          estimatedValue: data.estimatedValue || (data.estimatedAmount ? String(data.estimatedAmount) : null),
          estimatedAmount: data.estimatedAmount !== undefined ? data.estimatedAmount : null,
          currency: data.currency || 'USD',
          status: data.status || 'LEAD',
          priority: data.priority || 'MEDIUM',
          firstContactDate: data.firstContactDate ? new Date(data.firstContactDate) : null,
          proposalDate: data.proposalDate ? new Date(data.proposalDate) : (data.status === 'PROPOSAL_SENT' ? new Date() : null),
          nextAction: data.nextAction || null,
          nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
          expectedStartDate: data.expectedStartDate ? new Date(data.expectedStartDate) : null,
          notes: data.notes || null,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'FREELANCE',
          opportunityId: item.id,
          freelanceOpportunityId: item.id,
          activityType: 'CREATED',
          toStatus: item.status,
          title: `Freelance lead created: ${item.projectName} (${item.clientName})`,
          occurredAt: new Date(),
        },
      });

      if (item.status === 'PROPOSAL_SENT') {
        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'FREELANCE',
            opportunityId: item.id,
            freelanceOpportunityId: item.id,
            activityType: 'PROPOSAL_SENT',
            fromStatus: 'LEAD',
            toStatus: 'PROPOSAL_SENT',
            title: `Proposal sent for ${item.projectName}`,
            occurredAt: new Date(),
          },
        });
      }

      return item;
    });

    return this.getFreelanceById(userId, created.id);
  }

  async updateFreelance(userId, freelanceId, data) {
    const existing = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
    });
    if (!existing) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const updatePayload = {};
    if (data.goalId !== undefined) updatePayload.goalId = data.goalId;
    if (data.clientName !== undefined) updatePayload.clientName = data.clientName;
    if (data.projectName !== undefined) updatePayload.projectName = data.projectName;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.sourceLabel !== undefined) updatePayload.sourceLabel = data.sourceLabel;
    if (data.projectType !== undefined) updatePayload.projectType = data.projectType;
    if (data.estimatedValue !== undefined) updatePayload.estimatedValue = data.estimatedValue;
    if (data.estimatedAmount !== undefined) updatePayload.estimatedAmount = data.estimatedAmount;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.firstContactDate !== undefined) updatePayload.firstContactDate = data.firstContactDate ? new Date(data.firstContactDate) : null;
    if (data.proposalDate !== undefined) updatePayload.proposalDate = data.proposalDate ? new Date(data.proposalDate) : null;
    if (data.nextAction !== undefined) updatePayload.nextAction = data.nextAction;
    if (data.nextActionDate !== undefined) updatePayload.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
    if (data.expectedStartDate !== undefined) updatePayload.expectedStartDate = data.expectedStartDate ? new Date(data.expectedStartDate) : null;
    if (data.actualStartDate !== undefined) updatePayload.actualStartDate = data.actualStartDate ? new Date(data.actualStartDate) : null;
    if (data.actualEndDate !== undefined) updatePayload.actualEndDate = data.actualEndDate ? new Date(data.actualEndDate) : null;
    if (data.agreedValue !== undefined) updatePayload.agreedValue = data.agreedValue;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.lostReason !== undefined) updatePayload.lostReason = data.lostReason;
    if (data.archivedAt !== undefined) updatePayload.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;

    if (data.status && data.status !== existing.status) {
      updatePayload.status = data.status;
      if (data.status === 'PROPOSAL_SENT' && !existing.proposalDate && !updatePayload.proposalDate) {
        updatePayload.proposalDate = new Date();
      }
      if (data.status === 'COMPLETED' && !existing.actualEndDate && !updatePayload.actualEndDate) {
        updatePayload.actualEndDate = new Date();
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.freelanceOpportunity.update({
        where: { id: freelanceId },
        data: updatePayload,
      });

      if (data.status && data.status !== existing.status) {
        await opportunityActivityService.recordStatusChange(
          userId,
          'FREELANCE',
          freelanceId,
          existing.status,
          data.status,
          data.notes || null,
          tx
        );
      }
    });

    return this.getFreelanceById(userId, freelanceId);
  }

  async updateStatus(userId, freelanceId, statusData) {
    const existing = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
    });
    if (!existing) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const { status, notes, agreedValue, currency, lostReason, actualEndDate } = statusData;

    const updatePayload = {
      status,
    };
    if (agreedValue !== undefined) updatePayload.agreedValue = agreedValue;
    if (currency !== undefined) updatePayload.currency = currency;
    if (lostReason !== undefined) updatePayload.lostReason = lostReason;
    if (status === 'PROPOSAL_SENT' && !existing.proposalDate) updatePayload.proposalDate = new Date();
    if (status === 'COMPLETED' && !existing.actualEndDate) updatePayload.actualEndDate = actualEndDate ? new Date(actualEndDate) : new Date();
    if (status === 'ARCHIVED' && !existing.archivedAt) updatePayload.archivedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.freelanceOpportunity.update({
        where: { id: freelanceId },
        data: updatePayload,
      });

      if (status !== existing.status) {
        let activityType = 'STATUS_CHANGED';
        if (status === 'PROPOSAL_SENT') activityType = 'PROPOSAL_SENT';
        else if (status === 'CONTACTED') activityType = 'CALL';
        else if (status === 'MEETING' || status === 'DISCOVERY') activityType = 'MEETING';
        else if (status === 'WON') activityType = 'WON';
        else if (status === 'LOST') activityType = 'LOST';

        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'FREELANCE',
            opportunityId: freelanceId,
            freelanceOpportunityId: freelanceId,
            activityType,
            fromStatus: existing.status,
            toStatus: status,
            title: `Freelance project moved to ${status}`,
            description: notes || lostReason || null,
            occurredAt: new Date(),
          },
        });
      }
    });

    return this.getFreelanceById(userId, freelanceId);
  }

  async createTaskFromOpportunity(userId, freelanceId, taskData) {
    const freelance = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
    });
    if (!freelance) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          userId,
          goalId: freelance.goalId || null,
          freelanceOpportunityId: freelance.id,
          title: taskData.title,
          description: taskData.description || `Related to freelance project ${freelance.projectName}`,
          priority: taskData.priority || freelance.priority || 'MEDIUM',
          taskType: taskData.taskType || 'FREELANCE',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : (freelance.nextActionDate || null),
          estimatedMinutes: taskData.estimatedMinutes || 60,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'FREELANCE',
          opportunityId: freelance.id,
          freelanceOpportunityId: freelance.id,
          activityType: 'NOTE',
          title: `Created task: "${created.title}"`,
          description: `Linked task #${created.id} due on ${created.dueDate ? created.dueDate.toISOString().slice(0, 10) : 'none'}`,
          occurredAt: new Date(),
        },
      });

      return created;
    });

    return task;
  }

  async toggleArchive(userId, freelanceId) {
    const item = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
    });
    if (!item) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const isArchived = Boolean(item.archivedAt);
    const updated = await prisma.freelanceOpportunity.update({
      where: { id: freelanceId },
      data: {
        archivedAt: isArchived ? null : new Date(),
        status: isArchived ? 'LEAD' : 'ARCHIVED',
      },
    });

    await opportunityActivityService.recordActivity(userId, {
      opportunityType: 'FREELANCE',
      opportunityId: freelanceId,
      activityType: isArchived ? 'STATUS_CHANGED' : 'OTHER',
      title: isArchived ? 'Restored freelance lead from archive' : 'Archived freelance lead',
      fromStatus: item.status,
      toStatus: updated.status,
    });

    return this.getFreelanceById(userId, freelanceId);
  }

  async deleteFreelance(userId, freelanceId) {
    const item = await prisma.freelanceOpportunity.findFirst({
      where: { id: freelanceId, userId },
    });
    if (!item) {
      const err = new Error('Freelance opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.freelanceOpportunity.delete({
      where: { id: freelanceId },
    });

    return { success: true, message: 'Freelance opportunity deleted successfully' };
  }
}

module.exports = new FreelanceOpportunityService();
