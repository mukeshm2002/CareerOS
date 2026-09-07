const prisma = require('../../config/db');

/**
 * Priority rank map
 */
const PRIORITY_SCORES = {
  CRITICAL: 4,
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

class RecommendationService {
  /**
   * Deterministically rank candidate tasks for today
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.localDateStr - "YYYY-MM-DD"
   * @param {number} params.availableCareerMinutes
   * @param {Array} params.tasks - Incomplete tasks with goal, milestone, skill
   * @param {Array} params.todayScheduleBlocks - Blocks scheduled for localDateStr
   * @param {Object|null} params.yesterdayReview - Yesterday's daily review
   * @param {Object|null} params.yesterdayPlan - Yesterday's daily plan
   * @param {Array} [params.skillGaps] - Calculated skill gaps
   * @returns {{
   *   recommendedTask: Object|null,
   *   explanation: string[],
   *   summaryReason: string,
   *   isCarriedForward: boolean,
   *   isExplicitTomorrow: boolean,
   *   fitsAvailableTime: boolean,
   *   availableCareerMinutes: number,
   *   shortestTaskMinutes: number|null,
   *   rankedCandidates: Array
   * }}
   */
  rankTasksForToday({
    userId,
    localDateStr,
    availableCareerMinutes = 120,
    tasks = [],
    todayScheduleBlocks = [],
    yesterdayReview = null,
    yesterdayPlan = null,
    skillGaps = [],
  }) {
    if (!tasks || tasks.length === 0) {
      return {
        recommendedTask: null,
        explanation: ['You are clear for today. There are no active career tasks that need your attention.'],
        summaryReason: 'No active career tasks found.',
        isCarriedForward: false,
        isExplicitTomorrow: false,
        fitsAvailableTime: true,
        availableCareerMinutes,
        shortestTaskMinutes: null,
        rankedCandidates: [],
      };
    }

    // Identify task IDs explicitly scheduled today
    const scheduledTaskIds = new Set(
      todayScheduleBlocks
        .filter((b) => b.taskId || b.linkedTaskId)
        .map((b) => b.taskId || b.linkedTaskId)
    );

    // Identify high skill gaps (gap >= 2)
    const highGapSkillIds = new Set(
      (skillGaps || [])
        .filter((g) => (g.gap ?? 0) >= 2)
        .map((g) => g.skillId)
    );

    // 1. Check if user explicitly chose tomorrow's task in yesterday's review (Section 26 & 50 Case C/D)
    let explicitTomorrowTask = null;
    if (yesterdayReview?.tomorrowMainTaskId) {
      explicitTomorrowTask = tasks.find(
        (t) => t.id === yesterdayReview.tomorrowMainTaskId && t.status !== 'COMPLETED' && t.status !== 'SKIPPED'
      );
    }

    // 2. Check if yesterday's confirmed main task was unfinished (Section 41)
    let carriedForwardTask = null;
    if (yesterdayPlan?.mainTaskId) {
      carriedForwardTask = tasks.find(
        (t) => t.id === yesterdayPlan.mainTaskId && t.status !== 'COMPLETED' && t.status !== 'SKIPPED'
      );
    }

    // Compute shortest task duration
    const validMinutes = tasks.map((t) => t.estimatedMinutes || 30);
    const shortestTaskMinutes = Math.min(...validMinutes);
    const hasFittingTask = tasks.some((t) => (t.estimatedMinutes || 30) <= availableCareerMinutes);

    // If explicit tomorrow task exists, that task is our top recommendation!
    if (explicitTomorrowTask) {
      const explanation = this.generateExplanation(explicitTomorrowTask, {
        isExplicitTomorrow: true,
        isCarriedForward: false,
        localDateStr,
        availableCareerMinutes,
        isScheduledToday: scheduledTaskIds.has(explicitTomorrowTask.id),
      });

      return {
        recommendedTask: explicitTomorrowTask,
        explanation,
        summaryReason: 'Selected by you yesterday as today’s main focus.',
        isCarriedForward: false,
        isExplicitTomorrow: true,
        fitsAvailableTime: (explicitTomorrowTask.estimatedMinutes || 30) <= availableCareerMinutes,
        availableCareerMinutes,
        shortestTaskMinutes,
        rankedCandidates: [explicitTomorrowTask, ...tasks.filter((t) => t.id !== explicitTomorrowTask.id)],
      };
    }

    // 3. Deterministic 9-factor ranking
    const scoredTasks = tasks.map((task) => {
      const estMin = task.estimatedMinutes || 30;
      const isOverdue = task.dueDate ? task.dueDate.toISOString().slice(0, 10) < localDateStr : false;
      const isDueToday = task.dueDate ? task.dueDate.toISOString().slice(0, 10) === localDateStr : false;
      const isScheduledToday = scheduledTaskIds.has(task.id);
      const isInActiveMilestone = task.milestone && task.milestone.status === 'IN_PROGRESS';
      const isHighPriorityGoal = task.goal && (task.goal.priority === 'CRITICAL' || task.goal.priority === 'HIGH');
      const taskPriorityScore = PRIORITY_SCORES[task.priority] || 2;
      const isSkillGapRelevant = (task.skillId && highGapSkillIds.has(task.skillId)) || false;
      const fitsTime = estMin <= availableCareerMinutes;
      const isCarriedForward = carriedForwardTask && carriedForwardTask.id === task.id;

      // Factors with descending weights (Section 7)
      // 1. Overdue task (weight: 100,000)
      // 2. Scheduled today (weight: 50,000)
      // 3. Due today (weight: 25,000)
      // 4. In active milestone (weight: 10,000)
      // 5. High-priority goal (weight: 5,000)
      // 6. Task priority (weight: 1,000 * score)
      // 7. Skill-gap relevance (weight: 500)
      // 8. Fits today's available time (weight: 200)
      // 9. Older unfinished task handled by tie-breaker

      let score = 0;
      if (isOverdue) score += 100000;
      if (isScheduledToday) score += 50000;
      if (isDueToday) score += 25000;
      if (isInActiveMilestone) score += 10000;
      if (isHighPriorityGoal) score += 5000;
      score += taskPriorityScore * 1000;
      if (isSkillGapRelevant) score += 500;
      if (fitsTime) score += 200;
      if (isCarriedForward) score += 100;

      return {
        task,
        score,
        isOverdue,
        isDueToday,
        isScheduledToday,
        isInActiveMilestone,
        isHighPriorityGoal,
        taskPriorityScore,
        isSkillGapRelevant,
        fitsTime,
        isCarriedForward,
      };
    });

    // Deterministic sorting with stable tie-breaker (Section 7):
    // score desc -> dueDate asc (nulls last) -> createdAt asc -> id asc
    scoredTasks.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Tie-breaker 1: dueDate
      if (a.task.dueDate && b.task.dueDate) {
        const diff = new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime();
        if (diff !== 0) return diff;
      } else if (a.task.dueDate && !b.task.dueDate) {
        return -1;
      } else if (!a.task.dueDate && b.task.dueDate) {
        return 1;
      }
      // Tie-breaker 2: createdAt asc
      const createdDiff = new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
      if (createdDiff !== 0) return createdDiff;
      // Tie-breaker 3: id asc
      return a.task.id.localeCompare(b.task.id);
    });

    const topCandidate = scoredTasks[0];
    const recommendedTask = topCandidate ? topCandidate.task : null;

    const explanation = recommendedTask
      ? this.generateExplanation(recommendedTask, {
          isExplicitTomorrow: false,
          isCarriedForward: topCandidate.isCarriedForward,
          localDateStr,
          availableCareerMinutes,
          isScheduledToday: topCandidate.isScheduledToday,
        })
      : [];

    let summaryReason = '';
    if (topCandidate?.isOverdue) {
      summaryReason = 'Overdue task requiring immediate attention.';
    } else if (topCandidate?.isScheduledToday) {
      summaryReason = 'Explicitly scheduled in your calendar for today.';
    } else if (topCandidate?.isDueToday) {
      summaryReason = 'Due today according to your career target.';
    } else if (topCandidate?.isInActiveMilestone) {
      summaryReason = 'Part of your currently active milestone.';
    } else {
      summaryReason = 'Highest priority action for your career mission.';
    }

    return {
      recommendedTask,
      explanation,
      summaryReason,
      isCarriedForward: topCandidate ? topCandidate.isCarriedForward : false,
      isExplicitTomorrow: false,
      fitsAvailableTime: topCandidate ? topCandidate.fitsTime : true,
      availableCareerMinutes,
      shortestTaskMinutes,
      rankedCandidates: scoredTasks.map((s) => s.task),
    };
  }

  /**
   * Human-readable explanation generation (Section 8)
   */
  generateExplanation(task, { isExplicitTomorrow, isCarriedForward, localDateStr, availableCareerMinutes, isScheduledToday }) {
    const reasons = [];

    if (isExplicitTomorrow) {
      reasons.push('You explicitly set this task as tomorrow’s focus during your last daily review.');
    }

    if (isCarriedForward) {
      reasons.push('Carried forward from yesterday: this task is still part of your current milestone.');
    }

    if (task.goal) {
      reasons.push(`Belongs to your goal: "${task.goal.title}" (${task.goal.priority} priority).`);
    }

    if (task.milestone) {
      reasons.push(`Part of your roadmap milestone: "${task.milestone.title}".`);
    }

    if (isScheduledToday) {
      reasons.push('It is already planned into your schedule for today.');
    }

    if (task.dueDate) {
      const dueStr = task.dueDate.toISOString().slice(0, 10);
      if (dueStr < localDateStr) {
        reasons.push(`Overdue (was due on ${dueStr}).`);
      } else if (dueStr === localDateStr) {
        reasons.push('Due today.');
      } else {
        reasons.push(`Due on ${dueStr}.`);
      }
    }

    const est = task.estimatedMinutes || 30;
    if (availableCareerMinutes > 0) {
      if (est <= availableCareerMinutes) {
        reasons.push(`Estimated time: ${est} minutes (fits your ${availableCareerMinutes}-minute available career window).`);
      } else {
        reasons.push(`Estimated time: ${est} minutes (exceeds today's planned ${availableCareerMinutes}-minute career window).`);
      }
    } else {
      reasons.push(`Estimated time: ${est} minutes.`);
    }

    if (task.priority === 'CRITICAL' || task.priority === 'HIGH') {
      reasons.push(`Marked as ${task.priority} priority.`);
    }

    return reasons;
  }
}

module.exports = new RecommendationService();
