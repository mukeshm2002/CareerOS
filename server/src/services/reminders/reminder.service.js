const prisma = require('../../config/db');

class ReminderService {
  /**
   * Validate related entities belong to authenticated user
   */
  async validateRelatedEntities(userId, data) {
    if (data.linkedTaskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.linkedTaskId, userId },
      });
      if (!task) {
        const err = new Error('Referenced task not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.linkedGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: data.linkedGoalId, userId },
      });
      if (!goal) {
        const err = new Error('Referenced goal not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.linkedJobOpportunityId) {
      const job = await prisma.jobOpportunity.findFirst({
        where: { id: data.linkedJobOpportunityId, userId },
      });
      if (!job) {
        const err = new Error('Referenced job opportunity not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.linkedFreelanceOpportunityId) {
      const freelance = await prisma.freelanceOpportunity.findFirst({
        where: { id: data.linkedFreelanceOpportunityId, userId },
      });
      if (!freelance) {
        const err = new Error('Referenced freelance opportunity not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }

    if (data.linkedInternshipOpportunityId) {
      const internship = await prisma.internshipOpportunity.findFirst({
        where: { id: data.linkedInternshipOpportunityId, userId },
      });
      if (!internship) {
        const err = new Error('Referenced internship opportunity not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }
  }

  /**
   * Compute next trigger timestamp for a reminder
   */
  computeNextTriggerDate(timeStr, dayOfWeek = null, timezone = 'UTC', baseDate = new Date()) {
    if (!timeStr || !timeStr.includes(':')) {
      return null;
    }

    const [targetHour, targetMinute] = timeStr.split(':').map(Number);

    // Get current local date in user's timezone
    const nowLocalParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(baseDate);

    const partMap = {};
    for (const p of nowLocalParts) {
      partMap[p.type] = p.value;
    }

    const localYear = parseInt(partMap.year, 10);
    const localMonth = parseInt(partMap.month, 10);
    const localDay = parseInt(partMap.day, 10);
    const localHour = parseInt(partMap.hour, 10);
    const localMinute = parseInt(partMap.minute, 10);

    // Construct target candidate date
    let candidateYear = localYear;
    let candidateMonth = localMonth;
    let candidateDay = localDay;

    const isPastToday =
      localHour > targetHour || (localHour === targetHour && localMinute >= targetMinute);

    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      // Weekly recurrence: find the upcoming target day of week
      const currentDayOfWeek = new Date(Date.UTC(localYear, localMonth - 1, localDay)).getUTCDay();
      let daysUntil = (dayOfWeek - currentDayOfWeek + 7) % 7;
      if (daysUntil === 0 && isPastToday) {
        daysUntil = 7;
      }
      candidateDay += daysUntil;
    } else {
      // Daily recurrence: if time already passed today, advance to tomorrow
      if (isPastToday) {
        candidateDay += 1;
      }
    }

    // Convert back to UTC ISO timestamp using Date.UTC
    const candidateUtc = new Date(
      Date.UTC(candidateYear, candidateMonth - 1, candidateDay, targetHour, targetMinute, 0, 0)
    );

    return candidateUtc;
  }

  /**
   * List reminders for user
   */
  async listReminders(userId, query = {}) {
    const where = { userId };

    if (query.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled === 'true' || query.enabled === true;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: [{ enabled: 'desc' }, { createdAt: 'desc' }],
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true } },
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
      },
    });

    return {
      reminders,
      totalCount: reminders.length,
      enabledCount: reminders.filter((r) => r.enabled).length,
    };
  }

  /**
   * Get reminder by ID with ownership verification
   */
  async getReminderById(userId, reminderId) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId },
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true } },
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
      },
    });

    if (!reminder) {
      const err = new Error('Reminder not found');
      err.statusCode = 404;
      throw err;
    }

    return reminder;
  }

  /**
   * Create new reminder
   */
  async createReminder(userId, data) {
    await this.validateRelatedEntities(userId, data);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const timezone = data.timezone || profile?.timezone || 'UTC';

    const dayOfWeek = data.dayOfWeek !== undefined && data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null;
    const nextTriggerAt = data.nextTriggerAt
      ? new Date(data.nextTriggerAt)
      : this.computeNextTriggerDate(data.time, dayOfWeek, timezone);

    const channel = data.channel || data.notificationChannel || 'IN_APP';

    return prisma.reminder.create({
      data: {
        userId,
        title: data.title,
        message: data.message || null,
        type: data.type || 'DAILY_CAREEROS_REVIEW',
        time: data.time || '20:00',
        dayOfWeek,
        timezone,
        recurrence: data.recurrence || (dayOfWeek !== null ? 'WEEKLY' : 'DAILY'),
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
        notificationChannel: channel,
        channel,
        linkedTaskId: data.linkedTaskId || null,
        linkedGoalId: data.linkedGoalId || null,
        linkedJobOpportunityId: data.linkedJobOpportunityId || null,
        linkedFreelanceOpportunityId: data.linkedFreelanceOpportunityId || null,
        linkedInternshipOpportunityId: data.linkedInternshipOpportunityId || null,
        nextTriggerAt,
      },
    });
  }

  /**
   * Update existing reminder
   */
  async updateReminder(userId, reminderId, data) {
    await this.getReminderById(userId, reminderId);
    await this.validateRelatedEntities(userId, data);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const timezone = data.timezone || profile?.timezone || 'UTC';

    const dayOfWeek = data.dayOfWeek !== undefined ? (data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null) : undefined;
    const time = data.time;

    let nextTriggerAt = data.nextTriggerAt ? new Date(data.nextTriggerAt) : undefined;
    if (time !== undefined || dayOfWeek !== undefined) {
      nextTriggerAt = this.computeNextTriggerDate(time || '20:00', dayOfWeek, timezone);
    }

    const channel = data.channel || data.notificationChannel;

    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        message: data.message !== undefined ? data.message : undefined,
        type: data.type !== undefined ? data.type : undefined,
        time: data.time !== undefined ? data.time : undefined,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        recurrence: data.recurrence !== undefined ? data.recurrence : undefined,
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : undefined,
        channel: channel !== undefined ? channel : undefined,
        notificationChannel: channel !== undefined ? channel : undefined,
        linkedTaskId: data.linkedTaskId !== undefined ? data.linkedTaskId : undefined,
        linkedGoalId: data.linkedGoalId !== undefined ? data.linkedGoalId : undefined,
        linkedJobOpportunityId: data.linkedJobOpportunityId !== undefined ? data.linkedJobOpportunityId : undefined,
        linkedFreelanceOpportunityId: data.linkedFreelanceOpportunityId !== undefined ? data.linkedFreelanceOpportunityId : undefined,
        linkedInternshipOpportunityId: data.linkedInternshipOpportunityId !== undefined ? data.linkedInternshipOpportunityId : undefined,
        nextTriggerAt,
      },
    });
  }

  /**
   * Toggle reminder enabled/disabled
   */
  async toggleReminder(userId, reminderId, enabled) {
    await this.getReminderById(userId, reminderId);

    return prisma.reminder.update({
      where: { id: reminderId },
      data: { enabled: Boolean(enabled) },
    });
  }

  /**
   * Delete reminder
   */
  async deleteReminder(userId, reminderId) {
    await this.getReminderById(userId, reminderId);

    await prisma.reminder.delete({
      where: { id: reminderId },
    });

    return { id: reminderId };
  }
}

module.exports = new ReminderService();
