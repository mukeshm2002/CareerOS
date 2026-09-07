const prisma = require('../../config/db');
const opportunityActivityService = require('./opportunityActivity.service');
const { getUserLocalDate } = require('../../utils/timezone');

const TERMINAL_INTERNSHIP_STAGES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'];

class InternshipOpportunityService {
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

  enrichInternship(item, localTodayStr) {
    const isTerminal = TERMINAL_INTERNSHIP_STAGES.includes(item.status);
    let followUpDue = false;
    let daysOverdue = 0;

    if (item.nextActionDate && !isTerminal) {
      const actionDateStr = new Date(item.nextActionDate).toISOString().slice(0, 10);
      if (actionDateStr <= localTodayStr) {
        followUpDue = true;
        const diffMs = new Date(localTodayStr) - new Date(actionDateStr);
        daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    let isStale = false;
    let daysSinceLastActivity = 0;
    let staleReason = null;

    if (['APPLIED', 'SCREENING'].includes(item.status) && !isTerminal) {
      const latestDate = item.activities && item.activities.length > 0
        ? new Date(item.activities[0].occurredAt)
        : (item.appliedDate ? new Date(item.appliedDate) : new Date(item.updatedAt));

      const now = new Date();
      const diffDays = Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));
      daysSinceLastActivity = Math.max(0, diffDays);

      if (diffDays >= 14) {
        isStale = true;
        staleReason = `No activity recorded for ${diffDays} days in ${item.status} stage`;
      }
    }

    return {
      ...item,
      followUpDue,
      daysOverdue,
      isStale,
      daysSinceLastActivity,
      staleReason,
    };
  }

  async listInternships(userId, query = {}) {
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
        { company: { contains: query.search, mode: 'insensitive' } },
        { role: { contains: query.search, mode: 'insensitive' } },
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

    const items = await prisma.internshipOpportunity.findMany({
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

    let enriched = items.map((it) => this.enrichInternship(it, localTodayStr));

    if (query.followUpDue) {
      enriched = enriched.filter((it) => it.followUpDue);
    }
    if (query.stale) {
      enriched = enriched.filter((it) => it.isStale);
    }

    return {
      timezone,
      internships: enriched,
      count: enriched.length,
    };
  }

  async getInternshipById(userId, internshipId) {
    const { localTodayStr } = await this.getUserLocalToday(userId);

    const item = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
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
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    return this.enrichInternship(item, localTodayStr);
  }

  async createInternship(userId, data) {
    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const created = await prisma.$transaction(async (tx) => {
      const item = await tx.internshipOpportunity.create({
        data: {
          userId,
          goalId: data.goalId || null,
          company: data.company,
          role: data.role,
          internshipUrl: data.internshipUrl || null,
          source: data.source || null,
          sourceLabel: data.sourceLabel || null,
          location: data.location || null,
          workMode: data.workMode || 'UNKNOWN',
          stipend: data.stipend || null,
          stipendMin: data.stipendMin !== undefined ? data.stipendMin : null,
          stipendMax: data.stipendMax !== undefined ? data.stipendMax : null,
          stipendCurrency: data.stipendCurrency || 'USD',
          status: data.status || 'SAVED',
          priority: data.priority || 'MEDIUM',
          appliedDate: data.appliedDate ? new Date(data.appliedDate) : (data.status === 'APPLIED' ? new Date() : null),
          nextAction: data.nextAction || null,
          nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
          notes: data.notes || null,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'INTERNSHIP',
          opportunityId: item.id,
          internshipOpportunityId: item.id,
          activityType: 'CREATED',
          toStatus: item.status,
          title: `Internship opportunity created: ${item.role} at ${item.company}`,
          occurredAt: new Date(),
        },
      });

      if (item.status === 'APPLIED') {
        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'INTERNSHIP',
            opportunityId: item.id,
            internshipOpportunityId: item.id,
            activityType: 'APPLICATION_SENT',
            fromStatus: 'SAVED',
            toStatus: 'APPLIED',
            title: `Application submitted for internship at ${item.company}`,
            occurredAt: new Date(),
          },
        });
      }

      return item;
    });

    return this.getInternshipById(userId, created.id);
  }

  async updateInternship(userId, internshipId, data) {
    const existing = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
    });
    if (!existing) {
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const updatePayload = {};
    if (data.goalId !== undefined) updatePayload.goalId = data.goalId;
    if (data.company !== undefined) updatePayload.company = data.company;
    if (data.role !== undefined) updatePayload.role = data.role;
    if (data.internshipUrl !== undefined) updatePayload.internshipUrl = data.internshipUrl;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.sourceLabel !== undefined) updatePayload.sourceLabel = data.sourceLabel;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.workMode !== undefined) updatePayload.workMode = data.workMode;
    if (data.stipend !== undefined) updatePayload.stipend = data.stipend;
    if (data.stipendMin !== undefined) updatePayload.stipendMin = data.stipendMin;
    if (data.stipendMax !== undefined) updatePayload.stipendMax = data.stipendMax;
    if (data.stipendCurrency !== undefined) updatePayload.stipendCurrency = data.stipendCurrency;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.appliedDate !== undefined) updatePayload.appliedDate = data.appliedDate ? new Date(data.appliedDate) : null;
    if (data.nextAction !== undefined) updatePayload.nextAction = data.nextAction;
    if (data.nextActionDate !== undefined) updatePayload.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.rejectionReason !== undefined) updatePayload.rejectionReason = data.rejectionReason;
    if (data.offerStipend !== undefined) updatePayload.offerStipend = data.offerStipend;
    if (data.acceptedAt !== undefined) updatePayload.acceptedAt = data.acceptedAt ? new Date(data.acceptedAt) : null;
    if (data.archivedAt !== undefined) updatePayload.archivedAt = data.archivedAt ? new Date(data.archivedAt) : null;

    if (data.status && data.status !== existing.status) {
      updatePayload.status = data.status;
      if (data.status === 'APPLIED' && !existing.appliedDate && !updatePayload.appliedDate) {
        updatePayload.appliedDate = new Date();
      }
      if (data.status === 'ACCEPTED' && !existing.acceptedAt && !updatePayload.acceptedAt) {
        updatePayload.acceptedAt = new Date();
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.internshipOpportunity.update({
        where: { id: internshipId },
        data: updatePayload,
      });

      if (data.status && data.status !== existing.status) {
        await opportunityActivityService.recordStatusChange(
          userId,
          'INTERNSHIP',
          internshipId,
          existing.status,
          data.status,
          data.notes || null,
          tx
        );
      }
    });

    return this.getInternshipById(userId, internshipId);
  }

  async updateStatus(userId, internshipId, statusData) {
    const existing = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
    });
    if (!existing) {
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const { status, notes, offerStipend, rejectionReason } = statusData;

    const updatePayload = {
      status,
    };
    if (offerStipend !== undefined) updatePayload.offerStipend = offerStipend;
    if (rejectionReason !== undefined) updatePayload.rejectionReason = rejectionReason;
    if (status === 'APPLIED' && !existing.appliedDate) updatePayload.appliedDate = new Date();
    if (status === 'ACCEPTED' && !existing.acceptedAt) updatePayload.acceptedAt = new Date();
    if (status === 'ARCHIVED' && !existing.archivedAt) updatePayload.archivedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.internshipOpportunity.update({
        where: { id: internshipId },
        data: updatePayload,
      });

      if (status !== existing.status) {
        let activityType = 'STATUS_CHANGED';
        if (status === 'APPLIED') activityType = 'APPLICATION_SENT';
        else if (status === 'INTERVIEW') activityType = 'INTERVIEW';
        else if (status === 'OFFER') activityType = 'OFFER_RECEIVED';
        else if (status === 'ACCEPTED') activityType = 'OFFER_ACCEPTED';
        else if (status === 'REJECTED') activityType = 'REJECTED';

        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'INTERNSHIP',
            opportunityId: internshipId,
            internshipOpportunityId: internshipId,
            activityType,
            fromStatus: existing.status,
            toStatus: status,
            title: `Internship moved to ${status}`,
            description: notes || rejectionReason || null,
            occurredAt: new Date(),
          },
        });
      }
    });

    return this.getInternshipById(userId, internshipId);
  }

  async createTaskFromOpportunity(userId, internshipId, taskData) {
    const item = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
    });
    if (!item) {
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          userId,
          goalId: item.goalId || null,
          internshipOpportunityId: item.id,
          title: taskData.title,
          description: taskData.description || `Related to internship at ${item.company}`,
          priority: taskData.priority || item.priority || 'MEDIUM',
          taskType: taskData.taskType || 'JOB_SEARCH',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : (item.nextActionDate || null),
          estimatedMinutes: taskData.estimatedMinutes || 45,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'INTERNSHIP',
          opportunityId: item.id,
          internshipOpportunityId: item.id,
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

  async toggleArchive(userId, internshipId) {
    const item = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
    });
    if (!item) {
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const isArchived = Boolean(item.archivedAt);
    const updated = await prisma.internshipOpportunity.update({
      where: { id: internshipId },
      data: {
        archivedAt: isArchived ? null : new Date(),
        status: isArchived ? 'SAVED' : 'ARCHIVED',
      },
    });

    await opportunityActivityService.recordActivity(userId, {
      opportunityType: 'INTERNSHIP',
      opportunityId: internshipId,
      activityType: isArchived ? 'STATUS_CHANGED' : 'OTHER',
      title: isArchived ? 'Restored internship from archive' : 'Archived internship',
      fromStatus: item.status,
      toStatus: updated.status,
    });

    return this.getInternshipById(userId, internshipId);
  }

  async deleteInternship(userId, internshipId) {
    const item = await prisma.internshipOpportunity.findFirst({
      where: { id: internshipId, userId },
    });
    if (!item) {
      const err = new Error('Internship opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.internshipOpportunity.delete({
      where: { id: internshipId },
    });

    return { success: true, message: 'Internship opportunity deleted successfully' };
  }
}

module.exports = new InternshipOpportunityService();
