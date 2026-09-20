const prisma = require('../../config/db');
const notificationService = require('./notification.service');
const emailNotificationService = require('./emailNotification.service');
const reminderService = require('./reminder.service');
const reminderMessageService = require('./reminderMessage.service');
const voiceService = require('./voice/voiceService');
const pushService = require('../push/push.service');

class ReminderSchedulerService {
  constructor() {
    this.timer = null;
    this.isProcessing = false;
  }

  /**
   * Start periodic background scheduler timer (runs every 60 seconds)
   */
  start(intervalMs = 60000) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.processDueReminders().catch((err) => {
        console.error('[REMINDER SCHEDULER ERROR]:', err);
      });
    }, intervalMs);
    if (this.timer.unref) {
      this.timer.unref();
    }
    console.log(`[REMINDER SCHEDULER] Started with interval ${intervalMs}ms`);
  }

  /**
   * Stop periodic background scheduler timer
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      console.log('[REMINDER SCHEDULER] Stopped');
    }
  }

  /**
   * Process all due reminders with strict atomic concurrency protection
   * Safe to call concurrently across multiple workers
   */
  async processDueReminders(nowOverride = null) {
    const now = nowOverride ? new Date(nowOverride) : new Date();

    // Find enabled reminders that are due and pending/snoozed
    const dueReminders = await prisma.reminder.findMany({
      where: {
        enabled: true,
        status: { in: ['PENDING', 'SNOOZED'] },
        OR: [
          { nextTriggerAt: { lte: now } },
          { nextTriggerAt: null },
        ],
      },
      include: {
        user: {
          include: {
            profile: true,
            preferences: true,
          },
        },
        linkedTask: { select: { id: true, title: true, status: true } },
        linkedScheduleBlock: { select: { id: true, title: true, startTime: true, endTime: true } },
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
        phoneContact: { select: { id: true, normalizedValue: true, maskedValue: true, verified: true } },
      },
    });

    const results = {
      evaluated: dueReminders.length,
      processed: 0,
      skippedDuplicates: 0,
      notificationsCreated: 0,
      emailsDispatched: 0,
      pushDispatched: 0,
      voiceDispatched: 0,
    };

    // Dedup threshold: do not re-trigger within 60 seconds
    const windowThreshold = new Date(now.getTime() - 60000);

    for (const reminder of dueReminders) {
      if (!reminder.user) continue;

      // 1. Calculate future nextTriggerAt for recurring reminders
      const isOneShot = Boolean(reminder.scheduledAt) || reminder.recurrence === 'ONCE' || reminder.recurrence === 'NONE';
      const userTimezone = reminder.timezone || reminder.user.profile?.timezone || 'Asia/Kolkata';

      let nextRecurrenceTrigger = null;
      if (!isOneShot && reminder.time) {
        nextRecurrenceTrigger = reminderService.computeNextTriggerDate(
          reminder.time,
          reminder.dayOfWeek,
          userTimezone,
          now
        );
      }

      // 2. ATOMIC LOCK: Only ONE concurrent process will succeed in updating this record
      const lockAcquired = await prisma.reminder.updateMany({
        where: {
          id: reminder.id,
          enabled: true,
          status: { in: ['PENDING', 'SNOOZED'] },
          OR: [
            { lastTriggeredAt: null },
            { lastTriggeredAt: { lt: windowThreshold } },
          ],
        },
        data: {
          status: 'PROCESSING',
          lastTriggeredAt: now,
          nextTriggerAt: isOneShot ? reminder.nextTriggerAt : nextRecurrenceTrigger,
          attemptCount: { increment: 1 },
        },
      });

      if (lockAcquired.count === 0) {
        // Another concurrent worker or recent run already locked this reminder
        results.skippedDuplicates += 1;
        continue;
      }

      results.processed += 1;

      // 3. Format message content
      const reminderTitle = reminder.title;
      let reminderMessage = reminder.message;
      if (!reminderMessage) {
        reminderMessage = reminderMessageService.generateNotificationMessage({
          sourceType: reminder.sourceType,
          title: reminder.title,
          offsetMinutes: reminder.offsetMinutes,
        });
      }

      const channel = reminder.channel || reminder.notificationChannel || 'IN_APP';

      // 4. DISPATCH BASED ON CHANNEL
      if (channel === 'VOICE') {
        // Voice Call Channel
        try {
          const voiceRes = await voiceService.dispatchVoiceReminder(reminder);
          if (voiceRes.dispatched) {
            results.voiceDispatched += 1;
          }
        } catch (voiceErr) {
          console.error(`[VOICE DISPATCH ERROR on reminder ${reminder.id}]:`, voiceErr);
        }
      } else {
        // In-App / Push / Email Channels
        let notifRecord = null;

        // In-App Notification
        try {
          notifRecord = await notificationService.createNotification(reminder.userId, {
            type: reminder.type || 'REMINDER',
            title: reminderTitle,
            message: reminderMessage,
            entityType: reminder.linkedTaskId
              ? 'TASK'
              : reminder.linkedScheduleBlockId
              ? 'SCHEDULE'
              : reminder.linkedGoalId
              ? 'GOAL'
              : 'REMINDER',
            entityId:
              reminder.linkedTaskId ||
              reminder.linkedScheduleBlockId ||
              reminder.linkedGoalId ||
              reminder.id,
            channel,
          });
          results.notificationsCreated += 1;
        } catch (notifErr) {
          console.error(`[REMINDER NOTIFICATION FAILED for ${reminder.id}]:`, notifErr);
        }

        // Email Notification
        const emailAllowed =
          reminder.user.preferences?.emailNotificationsEnabled !== false &&
          (channel === 'EMAIL' || reminder.user.preferences?.emailNotificationsEnabled);

        if (emailAllowed && reminder.user.email) {
          try {
            const renderedEmail = emailNotificationService.renderTemplate(reminder.type || 'REMINDER', {
              userName: reminder.user.fullName,
              taskTitle: reminder.linkedTask?.title || reminder.linkedScheduleBlock?.title || reminderTitle,
              opportunityTitle: reminder.linkedJobOpportunity
                ? `${reminder.linkedJobOpportunity.role} @ ${reminder.linkedJobOpportunity.company}`
                : null,
              message: reminderMessage,
            });

            await emailNotificationService.sendEmail({
              to: reminder.user.email,
              subject: renderedEmail.subject,
              text: renderedEmail.text,
              html: renderedEmail.html,
            });
            results.emailsDispatched += 1;
          } catch (emailErr) {
            console.error(`[EMAIL DELIVERY FAILURE for user ${reminder.user.email}]:`, emailErr.message);
          }
        }

        // Push Notification
        const pushAllowed =
          reminder.user.preferences?.pushNotificationsEnabled !== false &&
          (channel === 'PUSH' || reminder.user.preferences?.pushNotificationsEnabled);

        if (pushAllowed) {
          try {
            const pushResult = await pushService.sendPushToUser(reminder.userId, {
              title: reminderTitle,
              body: reminderMessage,
              url: reminder.linkedTaskId ? '/app/tasks' : reminder.linkedScheduleBlockId ? '/app/schedule' : '/app/reminders',
              type: reminder.type || 'REMINDER',
              notificationId: notifRecord?.id || null,
            });

            if (pushResult && pushResult.sent > 0) {
              results.pushDispatched += pushResult.sent;
            }
          } catch (pushErr) {
            console.error(`[PUSH DELIVERY FAILURE for reminder ${reminder.id}]:`, pushErr.message);
          }
        }

        // Mark as DELIVERED
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: isOneShot ? 'DELIVERED' : 'PENDING',
            enabled: !isOneShot, // One-shot reminders disable upon delivery
            completedAt: new Date(),
          },
        });
      }
    }

    return results;
  }
}

module.exports = new ReminderSchedulerService();
