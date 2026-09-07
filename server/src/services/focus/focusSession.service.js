const prisma = require('../../config/db');

class FocusSessionService {
  /**
   * Get active focus session for user (ACTIVE or PAUSED)
   */
  async getActiveSession(userId) {
    return await prisma.focusSession.findFirst({
      where: {
        userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
      include: {
        task: {
          include: {
            goal: true,
            milestone: true,
          },
        },
      },
    });
  }

  /**
   * Start a new focus session
   * Enforces at most 1 active session per user (Section 17 & 52)
   */
  async startSession(userId, { taskId, plannedMinutes, dailyPlanId, startedAt }) {
    return await prisma.$transaction(async (tx) => {
      // Transaction-scoped lock per user to eliminate race conditions on simultaneous starts
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      // Check for existing active or paused session
      const existing = await tx.focusSession.findFirst({
        where: {
          userId,
          status: { in: ['ACTIVE', 'PAUSED'] },
        },
      });
      if (existing) {
        const err = new Error('Another focus session is already in progress');
        err.statusCode = 409;
        err.activeSession = existing;
        throw err;
      }

      let task = null;
      if (taskId) {
        task = await tx.task.findFirst({
          where: { id: taskId, userId },
        });
        if (!task) {
          const err = new Error('Task not found or does not belong to user');
          err.statusCode = 404;
          throw err;
        }
      }

      const sessionPlannedMinutes = plannedMinutes || task?.estimatedMinutes || 25;
      const sessionStartedAt = startedAt ? new Date(startedAt) : new Date();

      const session = await tx.focusSession.create({
        data: {
          userId,
          taskId: taskId || null,
          dailyPlanId: dailyPlanId || null,
          plannedMinutes: sessionPlannedMinutes,
          durationMinutes: sessionPlannedMinutes,
          actualMinutes: 0,
          status: 'ACTIVE',
          startedAt: sessionStartedAt,
          totalPausedSeconds: 0,
          interruptionCount: 0,
        },
        include: {
          task: {
            include: {
              goal: true,
              milestone: true,
            },
          },
        },
      });

      // If task is TODO, move to IN_PROGRESS
      if (task && task.status === 'TODO') {
        await tx.task.update({
          where: { id: task.id },
          data: { status: 'IN_PROGRESS' },
        });
      }

      return session;
    });
  }

  /**
   * Pause active focus session
   */
  async pauseSession(userId, sessionId, pauseTimestamp) {
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      const err = new Error('Focus session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status !== 'ACTIVE') {
      const err = new Error(`Cannot pause session in status ${session.status}`);
      err.statusCode = 400;
      throw err;
    }

    const pausedAt = pauseTimestamp ? new Date(pauseTimestamp) : new Date();

    return await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: 'PAUSED',
        pausedAt,
        interruptionCount: { increment: 1 },
      },
      include: {
        task: true,
      },
    });
  }

  /**
   * Resume paused focus session
   */
  async resumeSession(userId, sessionId, resumeTimestamp) {
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      const err = new Error('Focus session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status !== 'PAUSED') {
      const err = new Error(`Cannot resume session in status ${session.status}`);
      err.statusCode = 400;
      throw err;
    }

    const resumeTime = resumeTimestamp ? new Date(resumeTimestamp) : new Date();
    let additionalPausedSeconds = 0;
    if (session.pausedAt) {
      additionalPausedSeconds = Math.max(0, Math.floor((resumeTime.getTime() - new Date(session.pausedAt).getTime()) / 1000));
    }

    return await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        pausedAt: null,
        totalPausedSeconds: (session.totalPausedSeconds || 0) + additionalPausedSeconds,
      },
      include: {
        task: true,
      },
    });
  }

  /**
   * Finish focus session
   * Calculates actualMinutes excluding paused duration (Section 20)
   * Aggregates task actualMinutes (Section 47)
   * Updates task outcome: COMPLETED, NOT_YET, BLOCKED (Section 21)
   */
  async finishSession(userId, sessionId, { taskOutcome = 'NOT_YET', notes, endedAt: customEndedAt, actualMinutes: customActualMinutes }) {
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
      include: { task: true },
    });

    if (!session) {
      const err = new Error('Focus session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      const err = new Error('Session is already ended');
      err.statusCode = 400;
      throw err;
    }

    const endedAt = customEndedAt ? new Date(customEndedAt) : new Date();

    // If session was paused when finished, account for trailing pause time
    let totalPausedSeconds = session.totalPausedSeconds || 0;
    if (session.status === 'PAUSED' && session.pausedAt) {
      const trailingPause = Math.max(0, Math.floor((endedAt.getTime() - new Date(session.pausedAt).getTime()) / 1000));
      totalPausedSeconds += trailingPause;
    }

    // Calculate actual minutes excluding total pause duration
    let actualMinutes = 0;
    if (customActualMinutes !== undefined) {
      actualMinutes = Math.max(0, parseInt(customActualMinutes, 10));
    } else {
      const elapsedMs = Math.max(0, endedAt.getTime() - new Date(session.startedAt).getTime() - totalPausedSeconds * 1000);
      actualMinutes = Math.max(1, Math.round(elapsedMs / 60000));
    }

    return await prisma.$transaction(async (tx) => {
      const updatedSession = await tx.focusSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          completed: true,
          endedAt,
          pausedAt: null,
          totalPausedSeconds,
          actualMinutes,
          durationMinutes: actualMinutes,
          notes: notes !== undefined ? notes : session.notes,
        },
        include: { task: true },
      });

      // Update Task if session is associated with a task
      if (session.taskId) {
        // Calculate sum of all completed focus sessions for this task (Section 47)
        const allCompletedSessions = await tx.focusSession.findMany({
          where: {
            taskId: session.taskId,
            status: 'COMPLETED',
          },
          select: { actualMinutes: true },
        });

        const totalTaskActualMinutes = allCompletedSessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

        const taskUpdateData = {
          actualMinutes: totalTaskActualMinutes,
        };

        if (taskOutcome === 'COMPLETED') {
          taskUpdateData.status = 'COMPLETED';
          taskUpdateData.completedAt = endedAt;
        } else if (taskOutcome === 'BLOCKED') {
          taskUpdateData.status = 'BLOCKED';
        }

        await tx.task.update({
          where: { id: session.taskId },
          data: taskUpdateData,
        });
      }

      return updatedSession;
    });
  }

  /**
   * Cancel focus session
   */
  async cancelSession(userId, sessionId) {
    const session = await prisma.focusSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      const err = new Error('Focus session not found');
      err.statusCode = 404;
      throw err;
    }

    return await prisma.focusSession.update({
      where: { id: sessionId },
      data: {
        status: 'CANCELLED',
        completed: false,
        endedAt: new Date(),
      },
    });
  }

  /**
   * Get focus session history
   */
  async getHistory(userId, limit = 20) {
    return await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        task: {
          include: {
            goal: true,
            milestone: true,
          },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }
}

module.exports = new FocusSessionService();
