const prisma = require('../../config/db');
const opportunityActivityService = require('./opportunityActivity.service');
const { getUserLocalDate } = require('../../utils/timezone');

const TERMINAL_JOB_STAGES = ['ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED'];

class JobOpportunityService {
  /**
   * Helper to get user's local date string
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
   * Validate goal ownership if goalId is specified
   */
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

  /**
   * Enrich job opportunity with computed follow-up and staleness metadata
   */
  enrichJob(job, localTodayStr) {
    const isTerminal = TERMINAL_JOB_STAGES.includes(job.status);
    let followUpDue = false;
    let daysOverdue = 0;

    if (job.nextActionDate && !isTerminal) {
      const actionDateStr = new Date(job.nextActionDate).toISOString().slice(0, 10);
      if (actionDateStr <= localTodayStr) {
        followUpDue = true;
        const diffMs = new Date(localTodayStr) - new Date(actionDateStr);
        daysOverdue = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    // Staleness: APPLIED or SCREENING with >= 14 days since last activity / update
    let isStale = false;
    let daysSinceLastActivity = 0;
    let staleReason = null;

    if (['APPLIED', 'SCREENING'].includes(job.status) && !isTerminal) {
      const latestDate = job.activities && job.activities.length > 0
        ? new Date(job.activities[0].occurredAt)
        : (job.appliedDate ? new Date(job.appliedDate) : new Date(job.updatedAt));

      const now = new Date();
      const diffDays = Math.floor((now - latestDate) / (1000 * 60 * 60 * 24));
      daysSinceLastActivity = Math.max(0, diffDays);

      if (diffDays >= 14) {
        isStale = true;
        staleReason = `No activity recorded for ${diffDays} days in ${job.status} stage`;
      }
    }

    return {
      ...job,
      followUpDue,
      daysOverdue,
      isStale,
      daysSinceLastActivity,
      staleReason,
    };
  }

  /**
   * List jobs for user with flexible filters and search
   */
  async listJobs(userId, query = {}) {
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

    const jobs = await prisma.jobOpportunity.findMany({
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

    let enriched = jobs.map((j) => this.enrichJob(j, localTodayStr));

    if (query.followUpDue) {
      enriched = enriched.filter((j) => j.followUpDue);
    }
    if (query.stale) {
      enriched = enriched.filter((j) => j.isStale);
    }

    return {
      timezone,
      jobs: enriched,
      count: enriched.length,
    };
  }

  /**
   * Get single job by ID with full activities and linked tasks
   */
  async getJobById(userId, jobId) {
    const { localTodayStr } = await this.getUserLocalToday(userId);

    const job = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
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

    if (!job) {
      const err = new Error('Job opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    return this.enrichJob(job, localTodayStr);
  }

  /**
   * Create a new job opportunity
   */
  async createJob(userId, data) {
    if (data.goalId) {
      await this.validateGoalOwnership(userId, data.goalId);
    }

    const created = await prisma.$transaction(async (tx) => {
      const job = await tx.jobOpportunity.create({
        data: {
          userId,
          goalId: data.goalId || null,
          company: data.company,
          role: data.role,
          jobUrl: data.jobUrl || null,
          source: data.source || null,
          sourceLabel: data.sourceLabel || null,
          location: data.location || null,
          workMode: data.workMode || 'UNKNOWN',
          employmentType: data.employmentType || 'FULL_TIME',
          salaryMin: data.salaryMin !== undefined ? data.salaryMin : null,
          salaryMax: data.salaryMax !== undefined ? data.salaryMax : null,
          salaryCurrency: data.salaryCurrency || 'USD',
          salaryRange: data.salaryRange || null,
          status: data.status || 'SAVED',
          priority: data.priority || 'MEDIUM',
          savedDate: data.savedDate ? new Date(data.savedDate) : new Date(),
          appliedDate: data.appliedDate ? new Date(data.appliedDate) : (data.status === 'APPLIED' ? new Date() : null),
          nextAction: data.nextAction || null,
          nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : null,
          notes: data.notes || null,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'JOB',
          opportunityId: job.id,
          jobOpportunityId: job.id,
          activityType: 'CREATED',
          toStatus: job.status,
          title: `Job opportunity created: ${job.role} at ${job.company}`,
          occurredAt: new Date(),
        },
      });

      if (job.status === 'APPLIED') {
        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'JOB',
            opportunityId: job.id,
            jobOpportunityId: job.id,
            activityType: 'APPLICATION_SENT',
            fromStatus: 'SAVED',
            toStatus: 'APPLIED',
            title: `Application submitted for ${job.role} at ${job.company}`,
            occurredAt: new Date(),
          },
        });
      }

      return job;
    });

    return this.getJobById(userId, created.id);
  }

  /**
   * Update full job opportunity fields
   */
  async updateJob(userId, jobId, data) {
    const existing = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
    });
    if (!existing) {
      const err = new Error('Job opportunity not found');
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
    if (data.jobUrl !== undefined) updatePayload.jobUrl = data.jobUrl;
    if (data.source !== undefined) updatePayload.source = data.source;
    if (data.sourceLabel !== undefined) updatePayload.sourceLabel = data.sourceLabel;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.workMode !== undefined) updatePayload.workMode = data.workMode;
    if (data.employmentType !== undefined) updatePayload.employmentType = data.employmentType;
    if (data.salaryMin !== undefined) updatePayload.salaryMin = data.salaryMin;
    if (data.salaryMax !== undefined) updatePayload.salaryMax = data.salaryMax;
    if (data.salaryCurrency !== undefined) updatePayload.salaryCurrency = data.salaryCurrency;
    if (data.salaryRange !== undefined) updatePayload.salaryRange = data.salaryRange;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.savedDate !== undefined) updatePayload.savedDate = data.savedDate ? new Date(data.savedDate) : null;
    if (data.appliedDate !== undefined) updatePayload.appliedDate = data.appliedDate ? new Date(data.appliedDate) : null;
    if (data.nextAction !== undefined) updatePayload.nextAction = data.nextAction;
    if (data.nextActionDate !== undefined) updatePayload.nextActionDate = data.nextActionDate ? new Date(data.nextActionDate) : null;
    if (data.notes !== undefined) updatePayload.notes = data.notes;
    if (data.rejectionReason !== undefined) updatePayload.rejectionReason = data.rejectionReason;
    if (data.offerSalary !== undefined) updatePayload.offerSalary = data.offerSalary;
    if (data.offerCurrency !== undefined) updatePayload.offerCurrency = data.offerCurrency;
    if (data.offerNotes !== undefined) updatePayload.offerNotes = data.offerNotes;
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
      await tx.jobOpportunity.update({
        where: { id: jobId },
        data: updatePayload,
      });

      if (data.status && data.status !== existing.status) {
        await opportunityActivityService.recordStatusChange(
          userId,
          'JOB',
          jobId,
          existing.status,
          data.status,
          data.notes || null,
          tx
        );
      }
    });

    return this.getJobById(userId, jobId);
  }

  /**
   * Quick status change with immutable activity record
   */
  async updateStatus(userId, jobId, statusData) {
    const existing = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
    });
    if (!existing) {
      const err = new Error('Job opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const { status, notes, offerSalary, offerCurrency, rejectionReason } = statusData;

    const updatePayload = {
      status,
    };
    if (offerSalary !== undefined) updatePayload.offerSalary = offerSalary;
    if (offerCurrency !== undefined) updatePayload.offerCurrency = offerCurrency;
    if (rejectionReason !== undefined) updatePayload.rejectionReason = rejectionReason;
    if (status === 'APPLIED' && !existing.appliedDate) updatePayload.appliedDate = new Date();
    if (status === 'ACCEPTED' && !existing.acceptedAt) updatePayload.acceptedAt = new Date();
    if (status === 'ARCHIVED' && !existing.archivedAt) updatePayload.archivedAt = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.jobOpportunity.update({
        where: { id: jobId },
        data: updatePayload,
      });

      if (status !== existing.status) {
        let activityType = 'STATUS_CHANGED';
        if (status === 'APPLIED') activityType = 'APPLICATION_SENT';
        else if (status === 'INTERVIEW' || status === 'FINAL_INTERVIEW') activityType = 'INTERVIEW';
        else if (status === 'OFFER') activityType = 'OFFER_RECEIVED';
        else if (status === 'ACCEPTED') activityType = 'OFFER_ACCEPTED';
        else if (status === 'REJECTED') activityType = 'REJECTED';

        await tx.opportunityActivity.create({
          data: {
            userId,
            opportunityType: 'JOB',
            opportunityId: jobId,
            jobOpportunityId: jobId,
            activityType,
            fromStatus: existing.status,
            toStatus: status,
            title: `Job moved to ${status}`,
            description: notes || rejectionReason || null,
            occurredAt: new Date(),
          },
        });
      }
    });

    return this.getJobById(userId, jobId);
  }

  /**
   * Create a CareerOS task from a job opportunity
   */
  async createTaskFromOpportunity(userId, jobId, taskData) {
    const job = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      const err = new Error('Job opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const task = await prisma.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          userId,
          goalId: job.goalId || null,
          jobOpportunityId: job.id,
          title: taskData.title,
          description: taskData.description || `Related to ${job.role} at ${job.company}`,
          priority: taskData.priority || job.priority || 'MEDIUM',
          taskType: taskData.taskType || 'JOB_SEARCH',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : (job.nextActionDate || null),
          estimatedMinutes: taskData.estimatedMinutes || 45,
        },
      });

      await tx.opportunityActivity.create({
        data: {
          userId,
          opportunityType: 'JOB',
          opportunityId: job.id,
          jobOpportunityId: job.id,
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

  /**
   * Archive or restore job opportunity
   */
  async toggleArchive(userId, jobId) {
    const job = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      const err = new Error('Job opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    const isArchived = Boolean(job.archivedAt);
    const updated = await prisma.jobOpportunity.update({
      where: { id: jobId },
      data: {
        archivedAt: isArchived ? null : new Date(),
        status: isArchived ? 'SAVED' : 'ARCHIVED',
      },
    });

    await opportunityActivityService.recordActivity(userId, {
      opportunityType: 'JOB',
      opportunityId: jobId,
      activityType: isArchived ? 'STATUS_CHANGED' : 'OTHER',
      title: isArchived ? 'Restored job opportunity from archive' : 'Archived job opportunity',
      fromStatus: job.status,
      toStatus: updated.status,
    });

    return this.getJobById(userId, jobId);
  }

  /**
   * Delete job opportunity
   */
  async deleteJob(userId, jobId) {
    const job = await prisma.jobOpportunity.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      const err = new Error('Job opportunity not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.jobOpportunity.delete({
      where: { id: jobId },
    });

    return { success: true, message: 'Job opportunity deleted successfully' };
  }
}

module.exports = new JobOpportunityService();
