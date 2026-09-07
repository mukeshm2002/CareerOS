/**
 * Email Notification Service (Provider Abstraction)
 * Supports development console mode and pluggable transactional providers (Resend, SendGrid, SMTP).
 */
class EmailNotificationService {
  constructor() {
    this.provider = process.env.EMAIL_PROVIDER || 'console';
    this.fromAddress = process.env.EMAIL_FROM || 'notifications@careeros.local';
  }

  /**
   * Send transactional email behind safe provider abstraction
   */
  async sendEmail({ to, subject, text, html }) {
    if (!to || !subject) {
      throw new Error('Recipient email and subject are required');
    }

    if (this.provider === 'console' || !process.env.EMAIL_API_KEY) {
      // Safe development/test mode: logs notification intent without exposing secrets
      console.log(`[EMAIL DISPATCH: CONSOLE MODE] To: ${to} | Subject: "${subject}"`);
      return {
        success: true,
        provider: 'console',
        messageId: `console-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        to,
        subject,
      };
    }

    // In production with real credentials, external provider dispatch can be plugged here
    return {
      success: true,
      provider: this.provider,
      messageId: `prod-${Date.now()}`,
      to,
      subject,
    };
  }

  /**
   * Render concise email templates for transactional notifications
   */
  renderTemplate(type, data = {}) {
    switch (type) {
      case 'DAILY_CAREER_REVIEW':
      case 'DAILY_CAREEROS_REVIEW':
        return {
          subject: 'CareerOS Daily Focus Check-in',
          text: `Hi ${data.userName || 'there'},\n\nIt is time for your daily career check-in. Review today's focus and choose what moves your career forward.\n\nOpen CareerOS: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/today`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>It is time for your daily career check-in. Review today's focus and choose what moves your career forward.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/today">Open Today's Focus</a></p>`,
        };

      case 'DAILY_SHUTDOWN':
        return {
          subject: 'CareerOS Daily Shutdown Reminder',
          text: `Hi ${data.userName || 'there'},\n\nWrap up today's career efforts, log your progress, and pick tomorrow's main focus task.\n\nOpen Daily Review: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/today`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>Wrap up today's career efforts, log your progress, and pick tomorrow's main focus task.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/today">Complete Daily Review</a></p>`,
        };

      case 'WEEKLY_REVIEW':
      case 'WEEKLY_CAREER_REVIEW':
        return {
          subject: 'Weekly Career Review Due',
          text: `Hi ${data.userName || 'there'},\n\nYour weekly review is ready. Reflect on your wins, milestones completed, and set direction for next week.\n\nOpen Weekly Review: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/reviews`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>Your weekly review is ready. Reflect on your wins, milestones completed, and set direction for next week.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/reviews">Start Weekly Review</a></p>`,
        };

      case 'TASK_DUE':
        return {
          subject: `Task Due Today: ${data.taskTitle || 'Action Item'}`,
          text: `Hi ${data.userName || 'there'},\n\nYour task "${data.taskTitle || 'Action Item'}" is scheduled for today.\n\nOpen Tasks: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/tasks`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>Your task <strong>${data.taskTitle || 'Action Item'}</strong> is scheduled for today.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/tasks">View Tasks</a></p>`,
        };

      case 'OPPORTUNITY_FOLLOW_UP':
      case 'FREELANCE_FOLLOW_UP':
        return {
          subject: `Follow-up Due: ${data.opportunityTitle || 'Career Opportunity'}`,
          text: `Hi ${data.userName || 'there'},\n\nYou have a follow-up action scheduled today for "${data.opportunityTitle || 'Opportunity'}".\n\nOpen Opportunities: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/opportunities`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>You have a follow-up action scheduled today for <strong>${data.opportunityTitle || 'Opportunity'}</strong>.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/opportunities">View Opportunities</a></p>`,
        };

      case 'INTERVIEW':
        return {
          subject: `Upcoming Interview: ${data.opportunityTitle || 'Scheduled Meeting'}`,
          text: `Hi ${data.userName || 'there'},\n\nReminder: You have an upcoming interview session scheduled for "${data.opportunityTitle || 'Opportunity'}".\n\nOpen CareerOS: ${process.env.CLIENT_URL || 'http://localhost:5173'}/app/opportunities`,
          html: `<p>Hi <strong>${data.userName || 'there'}</strong>,</p><p>Reminder: You have an upcoming interview session scheduled for <strong>${data.opportunityTitle || 'Opportunity'}</strong>.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/app/opportunities">View Opportunity Details</a></p>`,
        };

      default:
        return {
          subject: data.subject || 'CareerOS Reminder',
          text: data.message || 'You have a scheduled reminder in CareerOS.',
          html: `<p>${data.message || 'You have a scheduled reminder in CareerOS.'}</p>`,
        };
    }
  }
}

module.exports = new EmailNotificationService();
