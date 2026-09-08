const webpush = require('web-push');
const prisma = require('../../config/db');
const config = require('../../config');

class PushService {
  constructor() {
    this.isVapidConfigured = false;
    this.initVapid();
  }

  initVapid() {
    const { publicKey, privateKey, subject } = config.vapid || {};
    if (publicKey && privateKey) {
      try {
        webpush.setVapidDetails(subject || 'mailto:admin@careeros.app', publicKey, privateKey);
        this.isVapidConfigured = true;
      } catch (err) {
        console.warn('[PUSH SERVICE] VAPID configuration failed:', err.message);
        this.isVapidConfigured = false;
      }
    } else {
      console.warn('[PUSH SERVICE] VAPID keys not configured in environment.');
      this.isVapidConfigured = false;
    }
  }

  getPublicKey() {
    return config.vapid?.publicKey || null;
  }

  /**
   * Helper to generate a human-friendly device label from User-Agent
   */
  parseUserAgent(ua) {
    if (!ua) return 'Web Browser';
    let browser = 'Browser';
    let os = 'Device';

    if (ua.includes('Edg/')) browser = 'Edge';
    else if (ua.includes('Chrome/')) browser = 'Chrome';
    else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari';
    else if (ua.includes('Firefox/')) browser = 'Firefox';

    if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} on ${os}`;
  }

  /**
   * Returns current push subscription status for authenticated user
   */
  async getStatus(userId) {
    const userPref = await prisma.userPreference.findUnique({
      where: { userId },
      select: { pushNotificationsEnabled: true },
    });

    const count = await prisma.pushSubscription.count({
      where: { userId },
    });

    return {
      enabled: userPref?.pushNotificationsEnabled !== false,
      subscriptionCount: count,
      vapidPublicKey: this.getPublicKey(),
      isVapidConfigured: this.isVapidConfigured,
    };
  }

  /**
   * Registers or updates a browser push subscription for a user
   */
  async subscribe(userId, { endpoint, keys, userAgent }) {
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      const error = new Error('Invalid push subscription payload: missing endpoint, p256dh, or auth');
      error.statusCode = 400;
      throw error;
    }

    const sub = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        lastUsedAt: new Date(),
      },
      update: {
        userId, // Safely re-attribute if subscription endpoint was refreshed or changed user
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent || null,
        lastUsedAt: new Date(),
      },
    });

    // Ensure pushNotificationsEnabled is true in UserPreference
    await prisma.userPreference.upsert({
      where: { userId },
      create: {
        userId,
        pushNotificationsEnabled: true,
      },
      update: {
        pushNotificationsEnabled: true,
      },
    }).catch(() => {});

    return {
      id: sub.id,
      endpoint: sub.endpoint,
      createdAt: sub.createdAt,
    };
  }

  /**
   * Removes a subscription by endpoint for authenticated user
   */
  async unsubscribe(userId, endpoint) {
    if (!endpoint) {
      const error = new Error('Endpoint is required to unsubscribe');
      error.statusCode = 400;
      throw error;
    }

    const result = await prisma.pushSubscription.deleteMany({
      where: {
        userId,
        endpoint,
      },
    });

    return { deleted: result.count > 0 };
  }

  /**
   * Lists all active notification devices for user (sanitized, omitting secret keys)
   */
  async listSubscriptions(userId) {
    const subs = await prisma.pushSubscription.findMany({
      where: { userId },
      select: {
        id: true,
        userAgent: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return subs.map((s) => ({
      id: s.id,
      deviceLabel: this.parseUserAgent(s.userAgent),
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
    }));
  }

  /**
   * Removes a specific registered device by subscription ID
   */
  async deleteSubscription(userId, subscriptionId) {
    const result = await prisma.pushSubscription.deleteMany({
      where: {
        id: subscriptionId,
        userId,
      },
    });

    if (result.count === 0) {
      const error = new Error('Device subscription not found or not owned by user');
      error.statusCode = 404;
      throw error;
    }

    return { deleted: true };
  }

  /**
   * Send test push notification to user's registered devices
   */
  async sendTestNotification(userId) {
    const payload = {
      title: 'CareerOS',
      body: 'Push notifications are working.',
      url: '/app/today',
      type: 'TEST',
    };

    return this.sendPushToUser(userId, payload);
  }

  /**
   * Dispatch push notification to all active devices registered to a user
   * Automatically purges 404/410 dead/expired subscriptions
   */
  async sendPushToUser(userId, payload) {
    // 1. Check user preference
    const userPref = await prisma.userPreference.findUnique({
      where: { userId },
      select: { pushNotificationsEnabled: true },
    });

    if (userPref && userPref.pushNotificationsEnabled === false) {
      return { sent: 0, failed: 0, cleaned: 0, skipped: true, reason: 'PUSH_DISABLED_BY_USER' };
    }

    // 2. Fetch all user subscriptions
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, cleaned: 0, skipped: true, reason: 'NO_SUBSCRIPTIONS' };
    }

    if (!this.isVapidConfigured) {
      console.warn('[PUSH SERVICE] Cannot send push: VAPID keys not configured.');
      return { sent: 0, failed: 0, cleaned: 0, skipped: true, reason: 'VAPID_NOT_CONFIGURED' };
    }

    const payloadString = JSON.stringify({
      title: payload.title || 'CareerOS Reminder',
      body: payload.body || 'Time for your planned career session.',
      url: payload.url || '/app/today',
      type: payload.type || 'REMINDER',
      notificationId: payload.notificationId || null,
    });

    const results = {
      total: subscriptions.length,
      sent: 0,
      failed: 0,
      cleaned: 0,
    };

    const staleEndpointIds = [];

    for (const sub of subscriptions) {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payloadString, {
          TTL: 86400, // 24 hours
        });
        results.sent += 1;

        // Update lastUsedAt asynchronously
        prisma.pushSubscription.update({
          where: { id: sub.id },
          data: { lastUsedAt: new Date() },
        }).catch(() => {});
      } catch (err) {
        results.failed += 1;
        const statusCode = err.statusCode;

        // 404 Not Found or 410 Gone indicates expired or revoked subscription
        if (statusCode === 404 || statusCode === 410) {
          staleEndpointIds.push(sub.id);
        } else {
          console.warn(`[PUSH DELIVERY FAILED]: statusCode=${statusCode}, message=${err.message}`);
        }
      }
    }

    // Purge expired subscriptions
    if (staleEndpointIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          id: { in: staleEndpointIds },
        },
      }).catch((purgeErr) => console.error('[PUSH PURGE ERROR]:', purgeErr.message));
      results.cleaned = staleEndpointIds.length;
    }

    return results;
  }
}

module.exports = new PushService();
