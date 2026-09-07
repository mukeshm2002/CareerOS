const prisma = require('../../config/db');

/**
 * Converts "HH:MM" string to minutes from midnight
 */
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * Converts minutes from midnight to "HH:MM" string
 */
function minutesToTime(mins) {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, mins));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

class SchedulePlanningService {
  /**
   * Helper: Check if two time intervals overlap
   */
  checkOverlap(start1, end1, start2, end2) {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  }

  /**
   * Get schedule blocks for a user with date filtering
   */
  async getScheduleBlocks(userId, query = {}) {
    const where = { userId };

    if (query.date) {
      const d = new Date(query.date);
      if (!isNaN(d.getTime())) {
        where.date = d;
      }
    } else if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        const s = new Date(query.startDate);
        if (!isNaN(s.getTime())) where.date.gte = s;
      }
      if (query.endDate) {
        const e = new Date(query.endDate);
        if (!isNaN(e.getTime())) where.date.lte = e;
      }
    }

    const blocks = await prisma.scheduleBlock.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' },
      ],
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            estimatedMinutes: true,
            goal: { select: { id: true, title: true } },
          },
        },
        goal: { select: { id: true, title: true } },
      },
    });

    return blocks;
  }

  /**
   * Create schedule block
   */
  async createScheduleBlock(userId, data) {
    const {
      title,
      description = null,
      date,
      startTime,
      endTime,
      category = 'CAREEROS',
      recurrence = 'NONE',
      taskId = null,
      goalId = null,
    } = data;

    if (!title || !title.trim()) {
      const error = new Error('Schedule block title is required');
      error.statusCode = 400;
      throw error;
    }

    if (!date) {
      const error = new Error('Date is required');
      error.statusCode = 400;
      throw error;
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    if (!startTime || !endTime) {
      const error = new Error('startTime and endTime are required (HH:MM)');
      error.statusCode = 400;
      throw error;
    }

    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    // Section 25: Validate endTime > startTime
    if (endMins <= startMins) {
      const error = new Error('endTime must be strictly greater than startTime');
      error.statusCode = 400;
      throw error;
    }

    // Verify task ownership if provided
    let resolvedGoalId = goalId || null;
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: { id: taskId, userId },
      });
      if (!task) {
        const error = new Error('Referenced task not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
      if (!resolvedGoalId && task.goalId) {
        resolvedGoalId = task.goalId;
      }
    }

    // Verify goal ownership if provided
    if (resolvedGoalId) {
      const goal = await prisma.goal.findFirst({
        where: { id: resolvedGoalId, userId },
      });
      if (!goal) {
        const error = new Error('Referenced goal not found or does not belong to user');
        error.statusCode = 404;
        throw error;
      }
    }

    // Check for overlap on same date (Section 25: warn user, do not silently delete)
    const existingSameDay = await prisma.scheduleBlock.findMany({
      where: { userId, date: parsedDate },
    });

    const overlappingBlocks = existingSameDay.filter((b) =>
      this.checkOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    const block = await prisma.scheduleBlock.create({
      data: {
        userId,
        title: title.trim(),
        description,
        date: parsedDate,
        startTime,
        endTime,
        category,
        recurrence: recurrence || 'NONE',
        taskId: taskId || null,
        goalId: resolvedGoalId || null,
      },
      include: {
        task: { select: { id: true, title: true, status: true, priority: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    return {
      block,
      hasOverlap: overlappingBlocks.length > 0,
      overlapWarning:
        overlappingBlocks.length > 0
          ? `Warning: This block overlaps with ${overlappingBlocks.length} existing block(s) on this date.`
          : null,
      overlappingBlocks,
    };
  }

  /**
   * Update schedule block
   */
  async updateScheduleBlock(userId, blockId, data) {
    const existing = await prisma.scheduleBlock.findFirst({
      where: { id: blockId, userId },
    });

    if (!existing) {
      const error = new Error('Schedule block not found');
      error.statusCode = 404;
      throw error;
    }

    const startTime = data.startTime || existing.startTime;
    const endTime = data.endTime || existing.endTime;

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      const error = new Error('endTime must be strictly greater than startTime');
      error.statusCode = 400;
      throw error;
    }

    let parsedDate = existing.date;
    if (data.date) {
      const d = new Date(data.date);
      if (isNaN(d.getTime())) {
        const error = new Error('Invalid date format');
        error.statusCode = 400;
        throw error;
      }
      parsedDate = d;
    }

    const updated = await prisma.scheduleBlock.update({
      where: { id: blockId },
      data: {
        title: data.title !== undefined ? data.title.trim() : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        date: parsedDate,
        startTime,
        endTime,
        category: data.category !== undefined ? data.category : existing.category,
        recurrence: data.recurrence !== undefined ? data.recurrence : existing.recurrence,
        taskId: data.taskId !== undefined ? data.taskId : existing.taskId,
        goalId: data.goalId !== undefined ? data.goalId : existing.goalId,
      },
      include: {
        task: { select: { id: true, title: true, status: true } },
        goal: { select: { id: true, title: true } },
      },
    });

    return updated;
  }

  /**
   * Delete schedule block
   */
  async deleteScheduleBlock(userId, blockId) {
    const existing = await prisma.scheduleBlock.findFirst({
      where: { id: blockId, userId },
    });

    if (!existing) {
      const error = new Error('Schedule block not found');
      error.statusCode = 404;
      throw error;
    }

    await prisma.scheduleBlock.delete({
      where: { id: blockId },
    });

    return { success: true, message: 'Schedule block deleted successfully' };
  }

  /**
   * Plan a task into an available career time window (Section 28)
   * Deterministic rule-based window matching
   */
  async planTaskIntoSchedule(userId, taskId, targetDateStr = null) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
      include: { goal: true },
    });

    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }

    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    // 1. Determine career window boundaries from UserProfile routine
    // Default window: personalEndTime (e.g. 20:00) to sleepTime (e.g. 22:30)
    let careerStart = '20:00';
    let careerEnd = '22:30';

    if (userProfile?.personalEndTime && userProfile?.sleepTime) {
      careerStart = userProfile.personalEndTime;
      careerEnd = userProfile.sleepTime;
    } else if (userProfile?.workEndTime && userProfile?.sleepTime) {
      careerStart = userProfile.workEndTime;
      careerEnd = userProfile.sleepTime;
    }

    const windowStartMins = timeToMinutes(careerStart);
    const windowEndMins = timeToMinutes(careerEnd);
    const totalWindowMinutes = Math.max(0, windowEndMins - windowStartMins);
    const neededMinutes = task.estimatedMinutes || 60;

    // 2. Fetch existing scheduled blocks for this day to exclude busy intervals
    const existingBlocks = await prisma.scheduleBlock.findMany({
      where: { userId, date: targetDate },
      orderBy: { startTime: 'asc' },
    });

    // Find first free interval in career window
    let candidateStart = windowStartMins;
    let foundWindow = null;

    // Filter blocks that overlap with the career window
    const careerBlocks = existingBlocks
      .map((b) => ({
        start: timeToMinutes(b.startTime),
        end: timeToMinutes(b.endTime),
      }))
      .filter((b) => b.end > windowStartMins && b.start < windowEndMins)
      .sort((a, b) => a.start - b.start);

    for (const block of careerBlocks) {
      const gap = block.start - candidateStart;
      if (gap >= neededMinutes) {
        foundWindow = {
          startMins: candidateStart,
          endMins: candidateStart + neededMinutes,
        };
        break;
      }
      candidateStart = Math.max(candidateStart, block.end);
    }

    if (!foundWindow && windowEndMins - candidateStart >= neededMinutes) {
      foundWindow = {
        startMins: candidateStart,
        endMins: candidateStart + neededMinutes,
      };
    }

    const fits = foundWindow !== null && neededMinutes <= totalWindowMinutes;

    if (!fits) {
      return {
        task: {
          id: task.id,
          title: task.title,
          estimatedMinutes: neededMinutes,
        },
        fits: false,
        reason: `Task estimated duration (${neededMinutes}m) exceeds available career window (${totalWindowMinutes}m) or available gap tonight.`,
        suggestedBlock: null,
      };
    }

    const suggestedStartTime = minutesToTime(foundWindow.startMins);
    const suggestedEndTime = minutesToTime(foundWindow.endMins);

    return {
      task: {
        id: task.id,
        title: task.title,
        estimatedMinutes: neededMinutes,
        goalTitle: task.goal?.title || null,
      },
      fits: true,
      reason: 'Fits your available career time.',
      suggestedBlock: {
        date: targetDate.toISOString().split('T')[0],
        startTime: suggestedStartTime,
        endTime: suggestedEndTime,
        title: task.title,
        category: 'CAREEROS',
        taskId: task.id,
        goalId: task.goalId,
      },
    };
  }
}

module.exports = new SchedulePlanningService();
