const prisma = require('../../../config/db');
const consoleVoiceProvider = require('./consoleVoiceProvider');
const twilioVoiceProvider = require('./twilioVoiceProvider');
const reminderMessageService = require('../reminderMessage.service');
const notificationService = require('../notification.service');

class VoiceService {
  /**
   * Resolves the active voice telephony adapter
   */
  getProvider() {
    const selected = (process.env.VOICE_PROVIDER || '').toLowerCase();
    if (selected === 'twilio' && twilioVoiceProvider.isConfigured()) {
      return twilioVoiceProvider;
    }
    return consoleVoiceProvider;
  }

  /**
   * Checks whether the current time in user's timezone falls within quiet hours.
   * e.g. quietHoursStart = "22:00", quietHoursEnd = "07:00"
   */
  isInsideQuietHours(timezoneOrTime = 'UTC', quietHoursStart = '22:00', quietHoursEnd = '07:00', now = new Date()) {
    if (!quietHoursStart || !quietHoursEnd) return false;

    let localHour, localMinute;
    if (typeof timezoneOrTime === 'string' && /^\d{1,2}:\d{2}$/.test(timezoneOrTime)) {
      const [h, m] = timezoneOrTime.split(':').map(Number);
      localHour = h;
      localMinute = m;
    } else {
      try {
        const parts = new Intl.DateTimeFormat('en-CA', {
          timeZone: timezoneOrTime || 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).formatToParts(now);

        const partMap = {};
        for (const p of parts) partMap[p.type] = p.value;
        localHour = parseInt(partMap.hour === '24' ? '0' : partMap.hour, 10);
        localMinute = parseInt(partMap.minute, 10);
      } catch {
        localHour = now.getUTCHours();
        localMinute = now.getUTCMinutes();
      }
    }

    const currentMinutes = localHour * 60 + localMinute;
    const [startH, startM] = quietHoursStart.split(':').map(Number);
    const [endH, endM] = quietHoursEnd.split(':').map(Number);

    const startMinutes = startH * 60 + (startM || 0);
    const endMinutes = endH * 60 + (endM || 0);

    if (startMinutes <= endMinutes) {
      // e.g. 01:00 to 06:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Over midnight: e.g. 22:00 to 07:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  /**
   * Dispatches an outbound voice reminder call with quiet hours & verification gating
   */
  async dispatchVoiceReminder(reminderOrId, options = {}) {
    let reminder = reminderOrId;
    if (typeof reminderOrId === 'string') {
      reminder = await prisma.reminder.findUnique({
        where: { id: reminderOrId },
        include: {
          user: { include: { profile: true, preferences: true } },
          phoneContact: true,
        },
      });
      if (!reminder) {
        throw new Error(`Reminder not found: ${reminderOrId}`);
      }
    }

    const provider = this.getProvider();
    const user = reminder.user;
    const userTz = reminder.timezone || user?.profile?.timezone || 'UTC';
    const quietStart = user?.preferences?.quietHoursStart || '22:00';
    const quietEnd = user?.preferences?.quietHoursEnd || '07:00';

    // 1. Phone Verification Check: Voice call MUST only be placed to a verified contact
    const contact = reminder.phoneContact || await prisma.userContact.findFirst({
      where: { userId: reminder.userId, type: 'PHONE' },
    });

    if (!contact || !contact.verified) {
      console.warn(`[VOICE REMINDER BLOCKED]: User ${reminder.userId} does not have a verified phone number.`);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          statusReason: 'Phone number not verified. Please verify your phone in Settings.',
          completedAt: new Date(),
        },
      });

      if (reminder.fallbackToInApp) {
        await notificationService.createNotification(reminder.userId, {
          type: 'REMINDER_FAILED',
          title: `Voice reminder unfulfilled: ${reminder.title}`,
          message: `Could not place voice call because your phone number is not verified. Please verify your number in Settings.`,
          entityType: 'REMINDER',
          entityId: reminder.id,
          channel: 'IN_APP',
        });
      }

      return { dispatched: false, reason: 'unverified_phone' };
    }

    // 2. Quiet Hours Check
    if (this.isInsideQuietHours(userTz, quietStart, quietEnd)) {
      console.log(`[VOICE REMINDER SUPPRESSED]: Reminder ${reminder.id} falls within quiet hours (${quietStart} - ${quietEnd} in ${userTz}).`);
      
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'DELIVERED',
          statusReason: `Suppressed by quiet hours (${quietStart} - ${quietEnd})`,
          completedAt: new Date(),
        },
      });

      if (reminder.fallbackToInApp) {
        await notificationService.createNotification(reminder.userId, {
          type: 'REMINDER',
          title: reminder.title,
          message: `${reminderMessageService.generateNotificationMessage({
            sourceType: reminder.sourceType,
            title: reminder.title,
            offsetMinutes: reminder.offsetMinutes,
          })} (Voice call suppressed during quiet hours)`,
          entityType: 'REMINDER',
          entityId: reminder.id,
          channel: 'IN_APP',
        });
      }

      return { dispatched: false, suppressed: true, reason: 'quiet_hours' };
    }

    // 3. Conservative Retry Check (Max 2 attempts)
    if (reminder.attemptCount >= 2) {
      console.warn(`[VOICE REMINDER CAPPED]: Reminder ${reminder.id} reached maximum call retry limit.`);
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          statusReason: 'Max retry attempts exceeded',
          completedAt: new Date(),
        },
      });

      if (reminder.fallbackToInApp) {
        await notificationService.createNotification(reminder.userId, {
          type: 'REMINDER_FAILED',
          title: `Missed reminder: ${reminder.title}`,
          message: `Your scheduled voice call was not completed after maximum attempts.`,
          entityType: 'REMINDER',
          entityId: reminder.id,
          channel: 'IN_APP',
        });
      }

      return { dispatched: false, reason: 'max_retries' };
    }

    // 4. Generate Text-to-Speech Message
    const ttsMessage = reminderMessageService.generateVoiceMessage({
      userName: user?.fullName || 'there',
      sourceType: reminder.sourceType,
      title: reminder.title,
      offsetMinutes: reminder.offsetMinutes,
    });

    const callbackUrl = process.env.APP_BASE_URL
      ? `${process.env.APP_BASE_URL}/api/webhooks/voice/${provider.name}`
      : undefined;

    // 5. Place Call through Abstraction Provider
    try {
      const callResult = await provider.makeCall({
        to: contact.normalizedValue,
        message: ttsMessage,
        reminderId: reminder.id,
        callbackUrl,
      });

      const finalStatus = callResult.status === 'ANSWERED' ? 'ANSWERED' : 'SENT';

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: finalStatus,
          providerReference: callResult.providerCallId || null,
          phoneContactId: contact.id,
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
          completedAt: finalStatus === 'ANSWERED' ? new Date() : null,
          statusReason: null,
        },
      });

      return {
        dispatched: true,
        provider: provider.name,
        providerCallId: callResult.providerCallId,
        status: finalStatus,
      };
    } catch (err) {
      console.error(`[VOICE DISPATCH ERROR on reminder ${reminder.id}]:`, err.message);

      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'FAILED',
          statusReason: err.message,
          attemptCount: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      // Missed / Failed Fallback: trigger in-app notification
      if (reminder.fallbackToInApp) {
        await notificationService.createNotification(reminder.userId, {
          type: 'REMINDER_FAILED',
          title: `Voice reminder failed: ${reminder.title}`,
          message: `Could not connect voice call. Reminder: ${reminder.title}`,
          entityType: 'REMINDER',
          entityId: reminder.id,
          channel: 'IN_APP',
        });
      }

      return { dispatched: false, error: err.message };
    }
  }

  /**
   * Handle webhook callback from telephony provider
   */
  async handleWebhookCallback(providerName, body, headers) {
    const provider = providerName === 'twilio' ? twilioVoiceProvider : consoleVoiceProvider;
    const parsed = await provider.handleWebhook(body, headers);

    if (!parsed.providerCallId) {
      return { success: false, message: 'Missing CallSid' };
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        OR: [
          { providerReference: parsed.providerCallId },
          parsed.reminderId ? { id: parsed.reminderId } : { providerReference: 'none' },
        ],
      },
    });

    if (!reminder) {
      return { success: false, message: 'Reminder matching CallSid not found' };
    }

    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: parsed.status,
        completedAt: new Date(),
      },
    });

    let fallbackCreated = false;
    // If call was missed or failed, trigger in-app notification fallback
    if ((parsed.status === 'MISSED' || parsed.status === 'FAILED') && reminder.fallbackToInApp) {
      await notificationService.createNotification(reminder.userId, {
        type: 'REMINDER_MISSED',
        title: `Missed Reminder: ${reminder.title}`,
        message: `Your scheduled voice call was missed or unanswered.`,
        entityType: 'REMINDER',
        entityId: reminder.id,
        channel: 'IN_APP',
      });
      fallbackCreated = true;
    }

    return {
      success: true,
      reminderId: reminder.id,
      status: parsed.status,
      fallbackCreated,
    };
  }
}

module.exports = new VoiceService();
