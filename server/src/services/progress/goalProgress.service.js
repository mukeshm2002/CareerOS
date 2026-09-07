const prisma = require('../../config/db');

class GoalProgressService {
  /**
   * Calculate goal attribution and roadmap movement for a given period
   * @param {string} userId
   * @param {Date} start - UTC start
   * @param {Date} end - UTC end
   */
  async calculateGoalMovement(userId, start, end) {
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
      include: {
        roadmaps: {
          include: {
            milestones: {
              orderBy: { sequence: 'asc' },
            },
          },
        },
      },
      orderBy: { priority: 'asc' },
    });

    // Fetch tasks completed in the period
    const completedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
      },
      select: {
        id: true,
        goalId: true,
        milestoneId: true,
        taskType: true,
        actualMinutes: true,
      },
    });

    // Fetch focus sessions completed in the period to attribute focus time to goals
    const focusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        actualMinutes: { gt: 0 },
        startedAt: { gte: start, lte: end },
      },
      include: {
        task: {
          select: { goalId: true },
        },
      },
    });

    // Fetch milestones completed in the period
    const completedMilestones = await prisma.roadmapMilestone.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: start, lte: end },
      },
      select: { id: true, roadmapId: true, title: true },
    });

    const goalMovements = goals.map((goal) => {
      const roadmap = goal.roadmaps[0] || null;
      const currentMilestone = roadmap
        ? roadmap.milestones.find((m) => m.status === 'IN_PROGRESS') ||
          roadmap.milestones.find((m) => m.status === 'NOT_STARTED') ||
          roadmap.milestones[roadmap.milestones.length - 1] ||
          null
        : null;

      // Tasks completed for this goal in period
      const goalTasksCompleted = completedTasks.filter((t) => t.goalId === goal.id).length;

      // Focus minutes logged for this goal in period
      const goalFocusMinutes = focusSessions
        .filter((s) => s.task && s.task.goalId === goal.id)
        .reduce((acc, s) => acc + (s.actualMinutes || 0), 0);

      // Milestones completed for this goal's roadmap in period
      const goalMilestonesCompleted = roadmap
        ? completedMilestones.filter((m) => m.roadmapId === roadmap.id).length
        : 0;

      // Roadmap progress is based on milestone completion
      const totalMilestones = roadmap ? roadmap.milestones.length : 0;
      const completedMilestonesCount = roadmap
        ? roadmap.milestones.filter((m) => m.status === 'COMPLETED').length
        : 0;
      const calculatedRoadmapProgress = totalMilestones > 0
        ? Math.round((completedMilestonesCount / totalMilestones) * 100)
        : goal.progress || 0;

      return {
        goalId: goal.id,
        title: goal.title,
        status: goal.status,
        priority: goal.priority,
        progress: calculatedRoadmapProgress,
        roadmapTitle: roadmap?.title || null,
        focusMinutes: goalFocusMinutes,
        tasksCompleted: goalTasksCompleted,
        milestonesCompleted: goalMilestonesCompleted,
        currentMilestone: currentMilestone
          ? {
              id: currentMilestone.id,
              title: currentMilestone.title,
              status: currentMilestone.status,
              sequence: currentMilestone.sequence,
            }
          : null,
        periodMovement: {
          milestonesCompleted: goalMilestonesCompleted,
          tasksCompleted: goalTasksCompleted,
          focusMinutes: goalFocusMinutes,
        },
      };
    });

    return goalMovements;
  }
}

module.exports = new GoalProgressService();
