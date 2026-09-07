const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

class SettingsService {
  /**
   * Get or create default user preferences
   */
  async getOrCreatePreferences(userId) {
    let preferences = await prisma.userPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId,
          defaultFocusMinutes: 25,
          weeklyCareerMinutesTarget: 600,
          preferredDays: 'MON,TUE,WED,THU,FRI',
          preferredStartTime: '09:00',
          preferredEndTime: '18:00',
          defaultCurrency: 'USD',
          defaultOpportunityPriority: 'MEDIUM',
          emailNotificationsEnabled: true,
          inAppNotificationsEnabled: true,
          dailyReviewReminderEnabled: true,
          dailyReviewReminderTime: '20:00',
          careerReviewReminderEnabled: true,
          careerReviewReminderTime: '08:00',
          weeklyReviewReminderEnabled: true,
          weeklyReviewDay: 0,
          weeklyReviewTime: '20:00',
          opportunityFollowUpReminderEnabled: true,
          taskDueReminderEnabled: true,
          theme: 'SYSTEM',
        },
      });
    }

    return preferences;
  }

  /**
   * Get full user settings workspace
   */
  async getSettings(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const preferences = await this.getOrCreatePreferences(userId);

    const [activeRefreshTokensCount, totalRemindersCount, unreadNotificationsCount] =
      await Promise.all([
        prisma.refreshToken.count({
          where: { userId, expiresAt: { gt: new Date() } },
        }),
        prisma.reminder.count({
          where: { userId },
        }),
        prisma.notification.count({
          where: { userId, readAt: null },
        }),
      ]);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      profile: user.profile,
      preferences,
      security: {
        activeSessions: activeRefreshTokensCount,
        lastLoginAt: user.lastLoginAt,
      },
      stats: {
        totalReminders: totalRemindersCount,
        unreadNotifications: unreadNotificationsCount,
      },
    };
  }

  /**
   * Update User Profile settings
   */
  async updateProfile(userId, data) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existing) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    // Update fullName on User model if provided
    if (data.fullName || (data.firstName && data.lastName)) {
      const newFullName = data.fullName || `${data.firstName} ${data.lastName}`.trim();
      await prisma.user.update({
        where: { id: userId },
        data: { fullName: newFullName },
      });
    }

    // Update UserProfile
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: {
        firstName: data.firstName !== undefined ? data.firstName : undefined,
        lastName: data.lastName !== undefined ? data.lastName : undefined,
        displayName: data.displayName !== undefined ? data.displayName : undefined,
        currentRole: data.currentRole !== undefined ? data.currentRole : undefined,
        targetRole: data.targetRole !== undefined ? data.targetRole : undefined,
        targetSalary: data.targetSalary !== undefined ? data.targetSalary : undefined,
        experienceLevel: data.experienceLevel !== undefined ? data.experienceLevel : undefined,
        currentSituation: data.currentSituation !== undefined ? data.currentSituation : undefined,
        timezone: data.timezone !== undefined ? data.timezone : undefined,
        country: data.country !== undefined ? data.country : undefined,
        bio: data.bio !== undefined ? data.bio : undefined,
      },
      create: {
        userId,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        displayName: data.displayName || null,
        currentRole: data.currentRole || null,
        targetRole: data.targetRole || null,
        targetSalary: data.targetSalary || null,
        experienceLevel: data.experienceLevel || 'MID_LEVEL',
        currentSituation: data.currentSituation || 'WORKING_PROFESSIONAL',
        timezone: data.timezone || 'UTC',
        country: data.country || null,
      },
    });

    return profile;
  }

  /**
   * Update Career Preferences
   */
  async updatePreferences(userId, data) {
    await this.getOrCreatePreferences(userId);

    const updated = await prisma.userPreference.update({
      where: { userId },
      data: {
        defaultFocusMinutes:
          data.defaultFocusMinutes !== undefined ? parseInt(data.defaultFocusMinutes, 10) : undefined,
        weeklyCareerMinutesTarget:
          data.weeklyCareerMinutesTarget !== undefined
            ? parseInt(data.weeklyCareerMinutesTarget, 10)
            : undefined,
        preferredDays: data.preferredDays !== undefined ? data.preferredDays : undefined,
        preferredStartTime:
          data.preferredStartTime !== undefined ? data.preferredStartTime : undefined,
        preferredEndTime: data.preferredEndTime !== undefined ? data.preferredEndTime : undefined,
        defaultCurrency: data.defaultCurrency !== undefined ? data.defaultCurrency : undefined,
        defaultOpportunityPriority:
          data.defaultOpportunityPriority !== undefined
            ? data.defaultOpportunityPriority
            : undefined,
        theme: data.theme !== undefined ? data.theme : undefined,
      },
    });

    return updated;
  }

  /**
   * Update Notification Settings
   */
  async updateNotificationPreferences(userId, data) {
    await this.getOrCreatePreferences(userId);

    const updated = await prisma.userPreference.update({
      where: { userId },
      data: {
        emailNotificationsEnabled:
          data.emailNotificationsEnabled !== undefined
            ? Boolean(data.emailNotificationsEnabled)
            : undefined,
        inAppNotificationsEnabled:
          data.inAppNotificationsEnabled !== undefined
            ? Boolean(data.inAppNotificationsEnabled)
            : undefined,
        dailyReviewReminderEnabled:
          data.dailyReviewReminderEnabled !== undefined
            ? Boolean(data.dailyReviewReminderEnabled)
            : undefined,
        dailyReviewReminderTime:
          data.dailyReviewReminderTime !== undefined ? data.dailyReviewReminderTime : undefined,
        careerReviewReminderEnabled:
          data.careerReviewReminderEnabled !== undefined
            ? Boolean(data.careerReviewReminderEnabled)
            : undefined,
        careerReviewReminderTime:
          data.careerReviewReminderTime !== undefined ? data.careerReviewReminderTime : undefined,
        weeklyReviewReminderEnabled:
          data.weeklyReviewReminderEnabled !== undefined
            ? Boolean(data.weeklyReviewReminderEnabled)
            : undefined,
        weeklyReviewDay:
          data.weeklyReviewDay !== undefined ? parseInt(data.weeklyReviewDay, 10) : undefined,
        weeklyReviewTime:
          data.weeklyReviewTime !== undefined ? data.weeklyReviewTime : undefined,
        opportunityFollowUpReminderEnabled:
          data.opportunityFollowUpReminderEnabled !== undefined
            ? Boolean(data.opportunityFollowUpReminderEnabled)
            : undefined,
        taskDueReminderEnabled:
          data.taskDueReminderEnabled !== undefined
            ? Boolean(data.taskDueReminderEnabled)
            : undefined,
      },
    });

    return updated;
  }

  /**
   * Change Password and revoke all existing sessions (Section 41)
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) {
      const err = new Error('Both currentPassword and newPassword are required');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 8) {
      const err = new Error('New password must be at least 8 characters long');
      err.statusCode = 400;
      throw err;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      const err = new Error('Invalid current password');
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke all existing refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { success: true, message: 'Password changed successfully. All sessions revoked.' };
  }
}

module.exports = new SettingsService();
