const prisma = require('../../config/db');

const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED'];

class TaskTransitionService {
  /**
   * Recalculate milestone progress from linked tasks.
   * Progress is Math.round((completed / total) * 100).
   * Note: Milestone status is NOT automatically set to COMPLETED.
   * Milestone outcome completion requires explicit user confirmation.
   */
  async updateMilestoneTaskProgress(milestoneId, tx = prisma, userId = null) {
    if (!milestoneId) return;

    const tasks = await tx.task.findMany({
      where: { milestoneId },
      select: { status: true },
    });

    if (tasks.length === 0) return;

    const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = Math.round((completed / tasks.length) * 100);

    const where = { id: milestoneId };
    if (userId) {
      where.userId = userId;
    }

    await tx.roadmapMilestone.updateMany({
      where,
      data: { progress },
    });

    return progress;
  }

  /**
   * Centralized Task Status Transition
   * Safely transitions task status with all lifecycle side effects:
   * 1. Status update & completedAt timestamp handling
   * 2. Additional task updates (e.g., actualMinutes from focus sessions)
   * 3. Milestone task progress recalculation
   * 4. Cancellation of pending/snoozed task reminders
   * 5. Strict user isolation
   * 6. Transactional execution (supports existing tx client or creates a transaction)
   */
  async transitionTaskStatus(userId, taskId, newStatus, options = {}) {
    if (!VALID_STATUSES.includes(newStatus)) {
      const error = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const executeTransition = async (txClient) => {
      const existing = await txClient.task.findFirst({
        where: { id: taskId, userId },
      });

      if (!existing) {
        const error = new Error('Task not found');
        error.statusCode = 404;
        throw error;
      }

      let completedAt = existing.completedAt;
      if (newStatus === 'COMPLETED') {
        completedAt = options.completedAt || (existing.status === 'COMPLETED' ? existing.completedAt : new Date());
      } else {
        completedAt = null;
      }

      const updateData = {
        status: newStatus,
        completedAt,
        ...(options.additionalTaskData || {}),
      };

      const updatedTask = await txClient.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          goal: { select: { id: true, title: true } },
          milestone: { select: { id: true, title: true } },
          skill: { select: { id: true, name: true } },
        },
      });

      // Recalculate linked milestone task progress
      if (options.recalculateMilestoneProgress !== false) {
        const activeMilestoneId = updatedTask.milestoneId || existing.milestoneId;
        if (activeMilestoneId) {
          await this.updateMilestoneTaskProgress(activeMilestoneId, txClient, userId);
        }
        if (options.previousMilestoneId && options.previousMilestoneId !== activeMilestoneId) {
          await this.updateMilestoneTaskProgress(options.previousMilestoneId, txClient, userId);
        }
      }

      // Recalculate parent goal progress if linked to a goal
      const activeGoalId = updatedTask.goalId || existing.goalId;
      if (activeGoalId) {
        try {
          const goalService = require('../goal.service');
          await goalService.recalculateGoalProgress(activeGoalId, txClient);
        } catch (goalErr) {
          console.warn('Failed to recalculate goal progress for task transition:', goalErr.message);
        }
      }


      // If transitioning to COMPLETED, cancel pending/snoozed reminders
      if (options.cancelReminders !== false && newStatus === 'COMPLETED') {
        try {
          await txClient.reminder.updateMany({
            where: {
              userId,
              linkedTaskId: taskId,
              status: { in: ['PENDING', 'SNOOZED'] },
            },
            data: {
              status: 'CANCELLED',
              enabled: false,
              statusReason: 'Task completed',
            },
          });
        } catch (reminderErr) {
          console.error('Failed to cancel reminders for completed task:', reminderErr);
        }
      }

      return updatedTask;
    };

    if (options.tx) {
      return await executeTransition(options.tx);
    }

    return await prisma.$transaction(async (tx) => {
      return await executeTransition(tx);
    });
  }
}

module.exports = new TaskTransitionService();
