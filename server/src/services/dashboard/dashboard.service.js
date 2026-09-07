const prisma = require('../../config/db');
const {
  getUserLocalDate,
  getUserLocalTimeInfo,
  getUserWeekRange,
  parseLocalDateToUtcDate,
} = require('../../utils/timezone');
const todayService = require('../today/today.service');
const skillGapService = require('../planning/skillGap.service');
const opportunityMetricsService = require('../opportunities/opportunityMetrics.service');

class DashboardService {
  /**
   * Fetch aggregate data for the Overview dashboard
   */
  async getDashboardData(userId, overrideDateStr) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const timezone = user.profile?.timezone || 'UTC';
    const localDateStr = overrideDateStr || getUserLocalDate(timezone);
    const localDate = parseLocalDateToUtcDate(localDateStr);
    const timeInfo = getUserLocalTimeInfo(timezone);
    const firstName = user.fullName ? user.fullName.split(' ')[0] : 'Member';

    // 1. Fetch Today Context
    const todayContext = await todayService.getTodayContext(userId, localDateStr);

    // 2. Fetch Active Goals (ordered by priority desc, then createdAt asc)
    const priorityRank = { CRITICAL: 4, URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const allGoals = await prisma.goal.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        roadmaps: {
          where: { status: 'ACTIVE' },
          include: {
            milestones: {
              orderBy: { sequence: 'asc' },
              include: {
                tasks: {
                  select: { id: true, status: true, title: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    allGoals.sort((a, b) => {
      const pA = priorityRank[a.priority] || 2;
      const pB = priorityRank[b.priority] || 2;
      return pB - pA;
    });

    const primaryGoalRaw = allGoals[0] || null;
    const secondaryGoalsRaw = allGoals.slice(1);

    // Build primaryGoal view model
    let primaryGoal = null;
    let currentRoadmap = null;

    if (primaryGoalRaw) {
      const activeRoadmap = primaryGoalRaw.roadmaps[0] || null;
      let daysRemaining = null;
      if (primaryGoalRaw.targetDate) {
        const diffMs = new Date(primaryGoalRaw.targetDate).getTime() - localDate.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      }

      let milestonesTotal = 0;
      let milestonesCompleted = 0;
      let currentMilestone = null;
      let nextTask = null;

      if (activeRoadmap) {
        const milestones = activeRoadmap.milestones || [];
        milestonesTotal = milestones.length;
        milestonesCompleted = milestones.filter((m) => m.status === 'COMPLETED').length;

        // Current milestone is the first IN_PROGRESS or first NOT_STARTED
        currentMilestone =
          milestones.find((m) => m.status === 'IN_PROGRESS') ||
          milestones.find((m) => m.status === 'NOT_STARTED') ||
          milestones[milestones.length - 1] ||
          null;

        if (currentMilestone && currentMilestone.tasks) {
          const incompleteTasks = currentMilestone.tasks.filter((t) => t.status !== 'COMPLETED');
          nextTask = incompleteTasks[0] || null;
        }

        currentRoadmap = {
          id: activeRoadmap.id,
          title: activeRoadmap.title,
          goalTitle: primaryGoalRaw.title,
          progress: activeRoadmap.progress,
          milestonesTotal,
          milestonesCompleted,
          currentMilestone: currentMilestone
            ? {
                id: currentMilestone.id,
                title: currentMilestone.title,
                status: currentMilestone.status,
                totalTasks: currentMilestone.tasks?.length || 0,
                completedTasks: currentMilestone.tasks?.filter((t) => t.status === 'COMPLETED').length || 0,
              }
            : null,
          nextTask: nextTask ? { id: nextTask.id, title: nextTask.title } : null,
        };
      }

      primaryGoal = {
        id: primaryGoalRaw.id,
        title: primaryGoalRaw.title,
        priority: primaryGoalRaw.priority,
        targetRole: primaryGoalRaw.targetRole,
        targetDate: primaryGoalRaw.targetDate ? primaryGoalRaw.targetDate.toISOString().slice(0, 10) : null,
        daysRemaining,
        progress: activeRoadmap ? activeRoadmap.progress : primaryGoalRaw.progress,
        milestonesTotal,
        milestonesCompleted,
        currentStage: currentMilestone ? currentMilestone.title : 'Planning',
      };
    }

    const secondaryGoals = secondaryGoalsRaw.map((g) => ({
      id: g.id,
      title: g.title,
      priority: g.priority,
      progress: g.progress,
    }));

    // 3. Skills readiness & top gap
    let roleReadiness = { score: 0, label: 'Self-Assessed Role Readiness', hasEnoughData: false };
    let topSkillGap = null;
    try {
      roleReadiness = await skillGapService.calculateRoleReadiness(userId);
      const gaps = await skillGapService.calculateSkillGaps(userId);
      topSkillGap = gaps[0] || null;
    } catch (e) {
      // safe fallback
    }

    // 4. Tasks metrics
    const activeTasksCount = await prisma.task.count({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS', 'BLOCKED'] },
      },
    });

    // 5. Weekly Execution Metrics (Monday to Sunday)
    const weekRange = getUserWeekRange(localDateStr);
    const weekFocusSessions = await prisma.focusSession.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        startedAt: {
          gte: weekRange.weekStartDate,
          lte: new Date(weekRange.weekEndDate.getTime() + 86400000 - 1),
        },
      },
      select: {
        id: true,
        actualMinutes: true,
        startedAt: true,
      },
    });

    const weekCompletedTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: {
          gte: weekRange.weekStartDate,
          lte: new Date(weekRange.weekEndDate.getTime() + 86400000 - 1),
        },
      },
      select: {
        id: true,
        completedAt: true,
      },
    });

    // Calculate unique active days this week
    const activeDaysSet = new Set();
    for (const fs of weekFocusSessions) {
      if (fs.startedAt) {
        activeDaysSet.add(fs.startedAt.toISOString().slice(0, 10));
      }
    }
    for (const ct of weekCompletedTasks) {
      if (ct.completedAt) {
        activeDaysSet.add(ct.completedAt.toISOString().slice(0, 10));
      }
    }

    const weeklyFocusedMinutes = weekFocusSessions.reduce((sum, s) => sum + (s.actualMinutes || 0), 0);

    const weeklyExecution = {
      weekStart: weekRange.weekStartStr,
      weekEnd: weekRange.weekEndStr,
      focusSessionsCount: weekFocusSessions.length,
      focusedMinutes: weeklyFocusedMinutes,
      tasksCompletedCount: weekCompletedTasks.length,
      activeDaysCount: activeDaysSet.size,
    };

    // 6. Fetch Opportunities Summary (Section 37 & 38)
    const opportunitiesSummary = await opportunityMetricsService.getDashboardSummary(userId);
    const activeJobs = opportunitiesSummary.jobs.activeList || [];
    const activeFreelance = opportunitiesSummary.freelance.activeList || [];

    // 7. Phase 1G Proof of Work & Learning Integration (Section 56, 57, 85)
    const [
      activeProjectsCount,
      portfolioProjectsCount,
      evidenceCount,
      nextProjectTask,
      activeLearningPathsCount,
      activeLearningPath,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          archivedAt: null,
        },
      }),
      prisma.project.count({
        where: {
          userId,
          isPortfolioVisible: true,
          archivedAt: null,
        },
      }),
      prisma.evidence.count({
        where: { userId },
      }),
      prisma.task.findFirst({
        where: {
          userId,
          projectId: { not: null },
          status: { not: 'COMPLETED' },
        },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
        select: { id: true, title: true },
      }),
      prisma.learningPath.count({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          archivedAt: null,
        },
      }),
      prisma.learningPath.findFirst({
        where: {
          userId,
          status: { notIn: ['COMPLETED', 'ARCHIVED'] },
          archivedAt: null,
        },
        include: {
          modules: {
            where: {
              status: { notIn: ['COMPLETED', 'SKIPPED'] },
              isCompleted: false,
            },
            orderBy: [{ order: 'asc' }, { sequence: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [{ updatedAt: 'desc' }],
      }),
    ]);

    const nextModule = activeLearningPath?.modules?.[0] || null;

    // 8. Career Check (Factual data across existing modules)
    const careerCheck = {
      goals: {
        activeCount: allGoals.length,
        primaryGoalTitle: primaryGoal ? primaryGoal.title : null,
        progress: primaryGoal ? primaryGoal.progress : 0,
        status: primaryGoal ? (primaryGoal.progress > 0 ? 'ON TRACK' : 'NEEDS ATTENTION') : 'NOT_SET',
      },
      roadmaps: {
        hasActiveRoadmap: Boolean(currentRoadmap),
        currentStage: currentRoadmap?.currentMilestone?.title || 'None',
        milestonesSummary: currentRoadmap
          ? `${currentRoadmap.milestonesCompleted} of ${currentRoadmap.milestonesTotal} milestones`
          : 'No roadmap configured',
      },
      skills: {
        readinessScore: roleReadiness.score,
        readinessLabel: roleReadiness.label,
        topGapName: topSkillGap ? topSkillGap.skillName : 'None identified',
        topGapPriority: topSkillGap ? topSkillGap.priority : 'Ready',
      },
      tasks: {
        activeCount: activeTasksCount,
        completedTodayCount: todayContext.completedTasksToday.length,
      },
      schedule: {
        availableMinutes: todayContext.availableCareerMinutes,
        plannedMinutes: todayContext.plannedMinutes,
        completedMinutes: todayContext.completedMinutes,
      },
      projects: (activeProjectsCount > 0 || portfolioProjectsCount > 0) ? {
        activeCount: activeProjectsCount,
        portfolioReadyCount: portfolioProjectsCount,
        summary: `${activeProjectsCount} active · ${portfolioProjectsCount} portfolio ready`,
      } : {
        status: 'Not configured yet',
      },
      learning: activeLearningPathsCount > 0 ? {
        activeCount: activeLearningPathsCount,
        activePathsCount: activeLearningPathsCount,
        nextModule: nextModule ? nextModule.title : null,
        summary: `${activeLearningPathsCount} active paths${nextModule ? ` · Next: ${nextModule.title}` : ''}`,
      } : {
        status: 'Not configured yet',
      },
      jobSearch: activeJobs.length > 0 ? {
        activeCount: activeJobs.length,
        nextAction: activeJobs.find((j) => j.nextAction)?.nextAction || null,
      } : { status: 'Not configured yet' },
      freelancing: activeFreelance.length > 0 ? {
        activeCount: activeFreelance.length,
        nextAction: activeFreelance.find((f) => f.nextAction)?.nextAction || null,
      } : { status: 'Not configured yet' },
    };

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        firstName,
        timezone,
        greeting: timeInfo.greeting,
        currentTime: timeInfo.timeString,
      },
      date: localDateStr,
      primaryGoal,
      secondaryGoals,
      currentRoadmap,
      todayPlan: todayContext.todayPlan,
      recommendation: todayContext.recommendation,
      activeFocusSession: todayContext.activeFocusSession,
      todaySchedule: todayContext.todaySchedule,
      careerCheck,
      weeklyExecution,
      opportunities: opportunitiesSummary,
      proofOfWork: {
        activeProjects: activeProjectsCount,
        portfolioProjects: portfolioProjectsCount,
        evidenceCount,
        nextProjectTask: nextProjectTask ? nextProjectTask.title : null,
      },
      learning: {
        activeLearningPaths: activeLearningPathsCount,
        activePathTitle: activeLearningPath ? activeLearningPath.title : null,
        nextLearningModule: nextModule ? nextModule.title : null,
      },
      activeProjects: activeProjectsCount,
      portfolioProjects: portfolioProjectsCount,
      evidenceCount,
      activeLearningPaths: activeLearningPathsCount,
      nextLearningModule: nextModule ? nextModule.title : null,
    };
  }
}

module.exports = new DashboardService();
