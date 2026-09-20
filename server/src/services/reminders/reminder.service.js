const prisma = require('../../config/db');
const { localDateTimeToUtc, parseLocalDateToUtcDate } = require('../../utils/timezone');

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

    if (data.linkedScheduleBlockId) {
      const block = await prisma.scheduleBlock.findFirst({
        where: { id: data.linkedScheduleBlockId, userId },
      });
      if (!block) {
        const err = new Error('Referenced schedule block not found or does not belong to user');
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

    if (data.phoneContactId) {
      const contact = await prisma.userContact.findFirst({
        where: { id: data.phoneContactId, userId },
      });
      if (!contact) {
        const err = new Error('Referenced phone contact not found or does not belong to user');
        err.statusCode = 404;
        throw err;
      }
    }
  }

  /**
   * Compute next trigger timestamp for a recurring time reminder
   */
  computeNextTriggerDate(timeStr, dayOfWeek = null, timezone = 'UTC', baseDate = new Date()) {
    if (!timeStr || !timeStr.includes(':')) {
      return null;
    }

    const [targetHour, targetMinute] = timeStr.split(':').map(Number);
    const tz = timezone || 'UTC';

    let localYear, localMonth, localDay, localHour, localMinute;
    try {
      const nowLocalParts = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
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

      localYear = parseInt(partMap.year, 10);
      localMonth = parseInt(partMap.month, 10);
      localDay = parseInt(partMap.day, 10);
      localHour = parseInt(partMap.hour === '24' ? '0' : partMap.hour, 10);
      localMinute = parseInt(partMap.minute, 10);
    } catch {
      localYear = baseDate.getUTCFullYear();
      localMonth = baseDate.getUTCMonth() + 1;
      localDay = baseDate.getUTCDate();
      localHour = baseDate.getUTCHours();
      localMinute = baseDate.getUTCMinutes();
    }

    let candidateYear = localYear;
    let candidateMonth = localMonth;
    let candidateDay = localDay;

    const isPastToday =
      localHour > targetHour || (localHour === targetHour && localMinute >= targetMinute);

    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      const currentDayOfWeek = new Date(Date.UTC(localYear, localMonth - 1, localDay)).getUTCDay();
      let daysUntil = (dayOfWeek - currentDayOfWeek + 7) % 7;
      if (daysUntil === 0 && isPastToday) {
        daysUntil = 7;
      }
      candidateDay += daysUntil;
    } else {
      if (isPastToday) {
        candidateDay += 1;
      }
    }

    return localDateTimeToUtc(candidateYear, candidateMonth, candidateDay, targetHour, targetMinute, tz);
  }

  /**
   * List reminders for user with comprehensive filters and relations
   */
  async listReminders(userId, query = {}) {
    const where = { userId };

    if (query.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    if (query.sourceType && query.sourceType !== 'ALL') {
      where.sourceType = query.sourceType;
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.channel && query.channel !== 'ALL') {
      where.channel = query.channel;
    }

    if (query.enabled !== undefined) {
      where.enabled = query.enabled === 'true' || query.enabled === true;
    }

    // Filter upcoming vs history
    if (query.view === 'upcoming') {
      where.enabled = true;
      where.status = { in: ['PENDING', 'SNOOZED', 'PROCESSING'] };
    } else if (query.view === 'history') {
      where.status = { in: ['DELIVERED', 'ANSWERED', 'MISSED', 'FAILED', 'CANCELLED'] };
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: [
        { nextTriggerAt: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true, status: true, priority: true } },
        linkedScheduleBlock: { select: { id: true, title: true, date: true, startTime: true, endTime: true, category: true } },
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
        phoneContact: { select: { id: true, maskedValue: true, verified: true } },
      },
    });

    return {
      reminders,
      totalCount: reminders.length,
      enabledCount: reminders.filter((r) => r.enabled).length,
      upcomingCount: reminders.filter((r) => ['PENDING', 'SNOOZED', 'PROCESSING'].includes(r.status) && r.enabled).length,
    };
  }

  /**
   * Get reminder by ID with ownership verification
   */
  async getReminderById(userId, reminderId) {
    const reminder = await prisma.reminder.findFirst({
      where: { id: reminderId, userId },
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true, status: true, priority: true } },
        linkedScheduleBlock: { select: { id: true, title: true, date: true, startTime: true, endTime: true, category: true } },
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
        phoneContact: { select: { id: true, maskedValue: true, verified: true } },
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
    const explicitTz = typeof data.timezone === 'string' && data.timezone.trim() ? data.timezone.trim() : null;
    const profileTz = typeof profile?.timezone === 'string' && profile.timezone.trim() ? profile.timezone.trim() : null;
    const timezone = explicitTz || profileTz || 'Asia/Kolkata';

    // Channel resolution
    const channel = data.channel || data.notificationChannel || 'IN_APP';

    // If Voice Call channel requested, ensure user has a verified phone number
    let resolvedPhoneContactId = data.phoneContactId || null;
    if (channel === 'VOICE') {
      const contact = resolvedPhoneContactId
        ? await prisma.userContact.findFirst({ where: { id: resolvedPhoneContactId, userId } })
        : await prisma.userContact.findFirst({ where: { userId, type: 'PHONE', verified: true } });

      if (!contact || !contact.verified) {
        const error = new Error('Verify your phone number to enable voice reminders.');
        error.statusCode = 400;
        throw error;
      }
      resolvedPhoneContactId = contact.id;
    }

    // Infer sourceType if not explicitly passed
    let sourceType = data.sourceType || 'CUSTOM';
    if (!data.sourceType) {
      if (data.linkedScheduleBlockId) sourceType = 'SCHEDULE';
      else if (data.linkedTaskId) sourceType = 'TASK';
      else if (data.linkedGoalId) sourceType = 'GOAL';
      else if (data.type === 'OPPORTUNITY_FOLLOW_UP') sourceType = 'CUSTOM';
    }

    // Offset minutes (e.g. 0 for at time, 10 for 10 min before)
    const offsetMinutes = data.offsetMinutes !== undefined ? parseInt(data.offsetMinutes, 10) : 0;

    // Resolve scheduledAt and nextTriggerAt
    const scheduledAtRaw = data.scheduledAt || data.scheduledFor;
    let scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;
    let nextTriggerAt = null;

    if (!scheduledAt && data.linkedTaskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.linkedTaskId, userId },
        select: { dueDate: true, title: true },
      });
      if (task?.dueDate) {
        scheduledAt = new Date(task.dueDate);
      }
    } else if (!scheduledAt && data.linkedScheduleBlockId) {
      const block = await prisma.scheduleBlock.findFirst({
        where: { id: data.linkedScheduleBlockId, userId },
        select: { date: true, startTime: true, title: true },
      });
      if (block) {
        const blockDate = new Date(block.date);
        const year = blockDate.getUTCFullYear();
        const month = blockDate.getUTCMonth() + 1;
        const day = blockDate.getUTCDate();
        const [hour, minute] = (block.startTime || '09:00').split(':').map(Number);
        scheduledAt = localDateTimeToUtc(year, month, day, hour, minute, timezone);
      }
    }

    if (scheduledAt && !isNaN(scheduledAt.getTime())) {
      // Relative reminder based on exact scheduledAt minus offsetMinutes
      nextTriggerAt = new Date(scheduledAt.getTime() - offsetMinutes * 60000);
    } else if (data.time) {
      // Recurring time of day
      const dayOfWeek = data.dayOfWeek !== undefined && data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null;
      nextTriggerAt = this.computeNextTriggerDate(data.time, dayOfWeek, timezone);
    } else {
      nextTriggerAt = new Date();
    }

    const dayOfWeek = data.dayOfWeek !== undefined && data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null;

    return prisma.reminder.create({
      data: {
        userId,
        title: data.title,
        message: data.message || null,
        type: data.type || 'CUSTOM',
        sourceType,
        sourceId: data.sourceId || null,
        status: 'PENDING',
        time: data.time || '20:00',
        dayOfWeek,
        scheduledAt,
        scheduledFor: scheduledAt,
        offsetMinutes,
        timezone,
        recurrence: data.recurrence || (scheduledAt ? 'ONCE' : dayOfWeek !== null ? 'WEEKLY' : 'DAILY'),
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : true,
        notificationChannel: channel,
        channel,
        fallbackToInApp: data.fallbackToInApp !== undefined ? Boolean(data.fallbackToInApp) : true,
        linkedTaskId: data.linkedTaskId || null,
        linkedScheduleBlockId: data.linkedScheduleBlockId || null,
        linkedGoalId: data.linkedGoalId || null,
        linkedJobOpportunityId: data.linkedJobOpportunityId || null,
        linkedFreelanceOpportunityId: data.linkedFreelanceOpportunityId || null,
        linkedInternshipOpportunityId: data.linkedInternshipOpportunityId || null,
        phoneContactId: resolvedPhoneContactId,
        nextTriggerAt,
      },
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true, status: true } },
        linkedScheduleBlock: { select: { id: true, title: true, date: true, startTime: true, endTime: true } },
        phoneContact: { select: { id: true, maskedValue: true, verified: true } },
      },
    });
  }

  /**
   * Update existing reminder
   */
  async updateReminder(userId, reminderId, data) {
    const existing = await this.getReminderById(userId, reminderId);
    await this.validateRelatedEntities(userId, data);

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const profileTz = typeof profile?.timezone === 'string' && profile.timezone.trim() ? profile.timezone.trim() : null;

    const explicitTz = data.timezone !== undefined
      ? (typeof data.timezone === 'string' && data.timezone.trim() ? data.timezone.trim() : null)
      : undefined;

    const effectiveTimezone = explicitTz !== undefined
      ? (explicitTz || profileTz || 'Asia/Kolkata')
      : (existing.timezone || profileTz || 'Asia/Kolkata');

    const channel = data.channel || data.notificationChannel || existing.channel;

    let resolvedPhoneContactId = data.phoneContactId !== undefined ? data.phoneContactId : existing.phoneContactId;
    if (channel === 'VOICE') {
      const contact = resolvedPhoneContactId
        ? await prisma.userContact.findFirst({ where: { id: resolvedPhoneContactId, userId } })
        : await prisma.userContact.findFirst({ where: { userId, type: 'PHONE', verified: true } });

      if (!contact || !contact.verified) {
        const error = new Error('Verify your phone number to enable voice reminders.');
        error.statusCode = 400;
        throw error;
      }
      resolvedPhoneContactId = contact.id;
    }

    const offsetMinutes = data.offsetMinutes !== undefined ? parseInt(data.offsetMinutes, 10) : existing.offsetMinutes || 0;
    const scheduledAtRaw = data.scheduledAt !== undefined ? data.scheduledAt : (data.scheduledFor !== undefined ? data.scheduledFor : existing.scheduledAt);
    const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;

    let nextTriggerAt = existing.nextTriggerAt;
    if (scheduledAt && !isNaN(scheduledAt.getTime())) {
      nextTriggerAt = new Date(scheduledAt.getTime() - offsetMinutes * 60000);
    } else if (data.time !== undefined || data.dayOfWeek !== undefined || explicitTz !== undefined) {
      const targetTime = data.time !== undefined ? data.time : existing.time;
      const targetDayOfWeek = data.dayOfWeek !== undefined ? (data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null) : existing.dayOfWeek;
      nextTriggerAt = this.computeNextTriggerDate(targetTime || '20:00', targetDayOfWeek, effectiveTimezone);
    }

    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        message: data.message !== undefined ? data.message : undefined,
        type: data.type !== undefined ? data.type : undefined,
        sourceType: data.sourceType !== undefined ? data.sourceType : undefined,
        sourceId: data.sourceId !== undefined ? data.sourceId : undefined,
        status: data.status !== undefined ? data.status : undefined,
        time: data.time !== undefined ? data.time : undefined,
        dayOfWeek: data.dayOfWeek !== undefined ? (data.dayOfWeek !== null ? parseInt(data.dayOfWeek, 10) : null) : undefined,
        scheduledAt,
        scheduledFor: scheduledAt,
        offsetMinutes,
        timezone: explicitTz !== undefined ? explicitTz : undefined,
        recurrence: data.recurrence !== undefined ? data.recurrence : undefined,
        enabled: data.enabled !== undefined ? Boolean(data.enabled) : undefined,
        channel,
        notificationChannel: channel,
        fallbackToInApp: data.fallbackToInApp !== undefined ? Boolean(data.fallbackToInApp) : undefined,
        linkedTaskId: data.linkedTaskId !== undefined ? data.linkedTaskId : undefined,
        linkedScheduleBlockId: data.linkedScheduleBlockId !== undefined ? data.linkedScheduleBlockId : undefined,
        linkedGoalId: data.linkedGoalId !== undefined ? data.linkedGoalId : undefined,
        phoneContactId: resolvedPhoneContactId,
        nextTriggerAt,
      },
      include: {
        linkedTask: { select: { id: true, title: true, dueDate: true, status: true } },
        linkedScheduleBlock: { select: { id: true, title: true, date: true, startTime: true, endTime: true } },
        phoneContact: { select: { id: true, maskedValue: true, verified: true } },
      },
    });
  }

  /**
   * Snooze reminder by specified minutes without mutating original task or schedule time
   */
  async snoozeReminder(userId, reminderId, minutes = 10) {
    const existing = await this.getReminderById(userId, reminderId);
    const snoozeMinutes = parseInt(minutes, 10) || 10;
    const snoozedTrigger = new Date(Date.now() + snoozeMinutes * 60000);

    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'SNOOZED',
        enabled: true,
        nextTriggerAt: snoozedTrigger,
        statusReason: `Snoozed for ${snoozeMinutes} minutes`,
      },
    });
  }

  /**
   * Cancel reminder
   */
  async cancelReminder(userId, reminderId) {
    await this.getReminderById(userId, reminderId);

    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        status: 'CANCELLED',
        enabled: false,
        statusReason: 'Cancelled by user',
      },
    });
  }

  /**
   * Recalculate relative reminders linked to a schedule block when its time/date is edited
   */
  async recalculateLinkedScheduleReminders(userId, scheduleBlock) {
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        linkedScheduleBlockId: scheduleBlock.id,
        status: { in: ['PENDING', 'SNOOZED'] },
      },
    });

    if (reminders.length === 0) return { updatedCount: 0 };

    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    const tz = profile?.timezone || 'Asia/Kolkata';

    // Extract local date parts from schedule block
    const blockDate = new Date(scheduleBlock.date);
    const year = blockDate.getUTCFullYear();
    const month = blockDate.getUTCMonth() + 1;
    const day = blockDate.getUTCDate();
    const [hour, minute] = (scheduleBlock.startTime || '09:00').split(':').map(Number);

    const blockStartUtc = localDateTimeToUtc(year, month, day, hour, minute, tz);

    let updatedCount = 0;
    for (const r of reminders) {
      const offset = r.offsetMinutes || 0;
      const newTrigger = new Date(blockStartUtc.getTime() - offset * 60000);

      await prisma.reminder.update({
        where: { id: r.id },
        data: {
          title: scheduleBlock.title,
          scheduledAt: blockStartUtc,
          scheduledFor: blockStartUtc,
          nextTriggerAt: newTrigger,
          status: 'PENDING',
        },
      });
      updatedCount += 1;
    }

    return { updatedCount };
  }

  /**
   * Toggle reminder enabled/disabled
   */
  async toggleReminder(userId, reminderId, enabled) {
    await this.getReminderById(userId, reminderId);

    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        enabled: Boolean(enabled),
        status: enabled ? 'PENDING' : 'CANCELLED',
      },
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

  /**
   * Get reminder settings (preferences + verified contact status)
   */
  async getReminderSettings(userId) {
    let prefs = await prisma.userPreference.findUnique({ where: { userId } });
    if (!prefs) {
      prefs = await prisma.userPreference.create({ data: { userId } });
    }

    const contact = await prisma.userContact.findFirst({
      where: { userId, type: 'PHONE' },
      select: { id: true, maskedValue: true, verified: true, verifiedAt: true },
    });

    const prefData = {
      defaultTaskReminderOffset: prefs.defaultTaskReminderOffset || 10,
      defaultScheduleReminderOffset: prefs.defaultScheduleReminderOffset || 0,
      voiceRemindersEnabled: Boolean(prefs.voiceRemindersEnabled),
      quietHoursStart: prefs.quietHoursStart || '22:00',
      quietHoursEnd: prefs.quietHoursEnd || '07:00',
      fallbackNotificationEnabled: prefs.fallbackNotificationEnabled !== false,
      inAppNotificationsEnabled: prefs.inAppNotificationsEnabled !== false,
      emailNotificationsEnabled: Boolean(prefs.emailNotificationsEnabled),
      pushNotificationsEnabled: Boolean(prefs.pushNotificationsEnabled),
    };

    return {
      ...prefData,
      preferences: prefData,
      phoneContact: contact || null,
      phoneVerified: Boolean(contact?.verified),
    };
  }

  /**
   * Update reminder settings
   */
  async updateReminderSettings(userId, data) {
    await prisma.userPreference.update({
      where: { userId },
      data: {
        defaultTaskReminderOffset: data.defaultTaskReminderOffset,
        defaultScheduleReminderOffset: data.defaultScheduleReminderOffset,
        voiceRemindersEnabled: data.voiceRemindersEnabled,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        fallbackNotificationEnabled: data.fallbackNotificationEnabled,
        inAppNotificationsEnabled: data.inAppNotificationsEnabled,
        emailNotificationsEnabled: data.emailNotificationsEnabled,
        pushNotificationsEnabled: data.pushNotificationsEnabled,
      },
    });

    return this.getReminderSettings(userId);
  }
}

module.exports = new ReminderService();
