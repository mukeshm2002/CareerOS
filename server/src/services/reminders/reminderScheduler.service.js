const prisma = require('../../config/db');
const notificationService = require('./notification.service');
const emailNotificationService = require('./emailNotification.service');
const reminderService = require('./reminder.service');
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

    // Find enabled reminders that are due
    const dueReminders = await prisma.reminder.findMany({
      where: {
        enabled: true,
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
        linkedGoal: { select: { id: true, title: true } },
        linkedJobOpportunity: { select: { id: true, company: true, role: true } },
        linkedFreelanceOpportunity: { select: { id: true, clientName: true, projectName: true } },
        linkedInternshipOpportunity: { select: { id: true, company: true, role: true } },
      },
    });

    const results = {
      evaluated: dueReminders.length,
      processed: 0,
      skippedDuplicates: 0,
      notificationsCreated: 0,
      emailsDispatched: 0,
      pushDispatched: 0,
    };

    // Dedup threshold: do not re-trigger within 60 seconds
    const windowThreshold = new Date(now.getTime() - 60000);

    for (const reminder of dueReminders) {
      if (!reminder.user) continue;

      // 1. Calculate future nextTriggerAt
      const userTimezone = reminder.timezone || reminder.user.profile?.timezone || 'UTC';
      const nextTriggerAt = reminderService.computeNextTriggerDate(
        reminder.time,
        reminder.dayOfWeek,
        userTimezone,
        now
      );

      // 2. ATOMIC LOCK: Only ONE concurrent process will succeed in updating this record
      const lockAcquired = await prisma.reminder.updateMany({
        where: {
          id: reminder.id,
          enabled: true,
          OR: [
            { lastTriggeredAt: null },
            { lastTriggeredAt: { lt: windowThreshold } },
          ],
        },
        data: {
          lastTriggeredAt: now,
          nextTriggerAt,
        },
      });

      if (lockAcquired.count === 0) {
        // Another concurrent worker or recent run already locked and processed this reminder
        results.skippedDuplicates += 1;
        continue;
      }

      results.processed += 1;

      // 3. Format message content
      const reminderTitle = reminder.title;
      let reminderMessage = reminder.message;
      if (!reminderMessage) {
        if (reminder.linkedTask) {
          reminderMessage = `Task due: ${reminder.linkedTask.title}`;
        } else if (reminder.linkedJobOpportunity) {
          reminderMessage = `Follow up on role at ${reminder.linkedJobOpportunity.company}`;
        } else if (reminder.linkedFreelanceOpportunity) {
          reminderMessage = `Follow up with client ${reminder.linkedFreelanceOpportunity.clientName}`;
        } else {
          reminderMessage = `Time for your scheduled ${reminder.type.replace(/_/g, ' ').toLowerCase()}`;
        }
      }

      // 4. Create In-App Notification
      let notifRecord = null;
      try {
        notifRecord = await notificationService.createNotification(reminder.userId, {
          type: reminder.type,
          title: reminderTitle,
          message: reminderMessage,
          entityType: reminder.linkedTaskId
            ? 'TASK'
            : reminder.linkedJobOpportunityId || reminder.linkedFreelanceOpportunityId
            ? 'OPPORTUNITY'
            : reminder.linkedGoalId
            ? 'GOAL'
            : 'REMINDER',
          entityId:
            reminder.linkedTaskId ||
            reminder.linkedJobOpportunityId ||
            reminder.linkedFreelanceOpportunityId ||
            reminder.linkedGoalId ||
            reminder.id,
          channel: reminder.channel || 'IN_APP',
        });
        results.notificationsCreated += 1;
      } catch (notifErr) {
        console.error(`[REMINDER NOTIFICATION FAILED for ${reminder.id}]:`, notifErr);
      }

      // 5. Send Transactional Email if enabled in user preferences
      const emailAllowed =
        reminder.user.preferences?.emailNotificationsEnabled !== false &&
        (reminder.channel === 'EMAIL' || reminder.notificationChannel === 'EMAIL' || reminder.user.preferences?.emailNotificationsEnabled);

      if (emailAllowed && reminder.user.email) {
        try {
          const renderedEmail = emailNotificationService.renderTemplate(reminder.type, {
            userName: reminder.user.fullName,
            taskTitle: reminder.linkedTask?.title,
            opportunityTitle:
              reminder.linkedJobOpportunity
                ? `${reminder.linkedJobOpportunity.role} @ ${reminder.linkedJobOpportunity.company}`
                : reminder.linkedFreelanceOpportunity
                ? `${reminder.linkedFreelanceOpportunity.projectName} (${reminder.linkedFreelanceOpportunity.clientName})`
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
          // Log email delivery failure without breaking reminder processing or rolling back in-app notification
          console.error(`[EMAIL DELIVERY FAILURE for user ${reminder.user.email}]:`, emailErr.message);
          if (notifRecord) {
            await prisma.notification.update({
              where: { id: notifRecord.id },
              data: {
                deliveryStatus: 'FAILED',
                failureReason: emailErr.message,
              },
            }).catch(() => {});
          }
        }
      }

      // 6. Send Browser Push Notification (Phase 2B Step 2)
      const pushAllowed =
        reminder.user.preferences?.pushNotificationsEnabled !== false &&
        (reminder.channel === 'PUSH' || reminder.notificationChannel === 'PUSH');

      if (pushAllowed) {
        try {
          const pushResult = await pushService.sendPushToUser(reminder.userId, {
            title: reminderTitle,
            body: reminderMessage,
            url: '/app/today',
            type: reminder.type,
            notificationId: notifRecord?.id || null,
          });

          if (pushResult && pushResult.sent > 0) {
            results.pushDispatched += pushResult.sent;
          }
        } catch (pushErr) {
          console.error(`[PUSH DELIVERY FAILURE for reminder ${reminder.id}]:`, pushErr.message);
        }
      }
    }

    return results;
  }
}

module.exports = new ReminderSchedulerService();
