const prisma = require('../../config/db');

class NotificationService {
  /**
   * Create an in-app notification record
   */
  async createNotification(userId, data) {
    return prisma.notification.create({
      data: {
        userId,
        type: data.type || 'SYSTEM',
        title: data.title,
        message: data.message,
        entityType: data.entityType || null,
        entityId: data.entityId || null,
        channel: data.channel || 'IN_APP',
        deliveryStatus: data.deliveryStatus || 'SENT',
        failureReason: data.failureReason || null,
      },
    });
  }

  /**
   * List notifications for authenticated user with unread and type filters
   * Side-effect free GET endpoint
   */
  async listNotifications(userId, query = {}) {
    const where = { userId };

    if (query.unread === 'true' || query.unread === true) {
      where.readAt = null;
    }

    if (query.type && query.type !== 'ALL') {
      where.type = query.type;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ? parseInt(query.limit, 10) : 50,
      }),
      prisma.notification.count({
        where: { userId, readAt: null },
      }),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const unreadCount = await prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId, notificationId) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }

    if (existing.readAt) {
      return existing;
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all notifications as read for authenticated user
   */
  async markAllAsRead(userId) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { count: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId, notificationId) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!existing) {
      const err = new Error('Notification not found');
      err.statusCode = 404;
      throw err;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return { id: notificationId };
  }
}

module.exports = new NotificationService();
