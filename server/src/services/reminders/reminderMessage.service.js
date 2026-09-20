/**
 * Centralized Reminder Message Service
 * Generates respectful, clear, and professional messages for both
 * Text-to-Speech (TTS) voice reminders and in-app / push / email notifications.
 */
class ReminderMessageService {
  /**
   * Generates spoken TTS message for phone call
   */
  generateVoiceMessage({ userName = 'there', sourceType, title, reason, offsetMinutes }) {
    const firstName = userName ? userName.split(' ')[0] : 'there';
    const cleanTitle = title ? title.trim() : 'scheduled activity';

    let timingPhrase = 'is scheduled now';
    if (offsetMinutes && offsetMinutes > 0) {
      if (offsetMinutes === 60) {
        timingPhrase = 'is starting in one hour';
      } else if (offsetMinutes === 1440) {
        timingPhrase = 'is coming up tomorrow';
      } else {
        timingPhrase = `is starting in ${offsetMinutes} minutes`;
      }
    }

    switch (sourceType) {
      case 'TASK':
        return `Hi ${firstName}. This is your EYTHU reminder. Your task "${cleanTitle}" ${timingPhrase}. It's time to get started.`;

      case 'SCHEDULE':
        return `Hi ${firstName}. This is your EYTHU reminder. Your scheduled routine "${cleanTitle}" ${timingPhrase}.`;

      case 'HEALTH':
        return `Hi ${firstName}. This is your EYTHU health reminder. It's time for your "${cleanTitle}". Take care of your well-being today.`;

      case 'COMMUNICATION':
        return `Hi ${firstName}. This is your EYTHU reminder. It's time for your communication activity: "${cleanTitle}".`;

      case 'GOAL':
        return `Hi ${firstName}. This is your EYTHU reminder. Don't forget your milestone for "${cleanTitle}". Keep progressing toward your goal.`;

      case 'CUSTOM':
      default:
        return `Hi ${firstName}. This is your EYTHU reminder for "${cleanTitle}" ${timingPhrase}.`;
    }
  }

  /**
   * Generates written message for in-app / push / email
   */
  generateNotificationMessage({ sourceType, title, offsetMinutes }) {
    const cleanTitle = title ? title.trim() : 'Scheduled activity';

    let timing = 'due now';
    if (offsetMinutes && offsetMinutes > 0) {
      if (offsetMinutes === 60) timing = 'starts in 1 hour';
      else if (offsetMinutes === 1440) timing = 'starts tomorrow';
      else timing = `starts in ${offsetMinutes} min`;
    }

    switch (sourceType) {
      case 'TASK':
        return `Task ${timing}: ${cleanTitle}`;
      case 'SCHEDULE':
        return `Schedule ${timing}: ${cleanTitle}`;
      case 'HEALTH':
        return `Health reminder (${timing}): ${cleanTitle}`;
      case 'COMMUNICATION':
        return `Communication reminder (${timing}): ${cleanTitle}`;
      case 'GOAL':
        return `Goal milestone ${timing}: ${cleanTitle}`;
      case 'CUSTOM':
      default:
        return `Reminder (${timing}): ${cleanTitle}`;
    }
  }
}

module.exports = new ReminderMessageService();
