const prisma = require('../../config/db');

class TaskRankingService {
  /**
   * Deterministic task ranking for Today's Main Focus candidate (Section 30)
   * Ranking factors:
   * 1. Overdue (+1000)
   * 2. Due today (+500)
   * 3. High-priority / Critical goal (+200)
   * 4. In active in-progress milestone (+150)
   * 5. Task priority: CRITICAL (+100), HIGH (+80), MEDIUM (+40), LOW (+10)
   * 6. Fits available career focus minutes (+50)
   */
  async getRecommendedTodayTask(userId) {
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['TODO', 'IN_PROGRESS'] },
      },
      include: {
        goal: true,
        milestone: true,
        skill: true,
      },
    });

    if (incompleteTasks.length === 0) {
      return {
        recommendedTask: null,
        reason: 'No pending tasks found. Add a task from your roadmap to start making progress.',
      };
    }

    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    const availableCareerMinutes = userProfile?.availableCareerMinutes || 120;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const scored = incompleteTasks.map((task) => {
      let score = 0;
      const reasons = [];

      // 1. Due date scoring
      if (task.dueDate) {
        if (task.dueDate < startOfToday) {
          score += 1000;
          reasons.push('Overdue task');
        } else if (task.dueDate >= startOfToday && task.dueDate <= endOfToday) {
          score += 500;
          reasons.push('Due today');
        }
      }

      // 2. Goal Priority
      if (task.goal) {
        if (task.goal.priority === 'CRITICAL' || task.goal.priority === 'HIGH') {
          score += 200;
          reasons.push(`High-priority goal (${task.goal.title})`);
        } else if (task.goal.priority === 'MEDIUM') {
          score += 100;
        }
      }

      // 3. Active milestone
      if (task.milestone && task.milestone.status === 'IN_PROGRESS') {
        score += 150;
        reasons.push(`Active milestone (${task.milestone.title})`);
      }

      // 4. Task priority
      if (task.priority === 'CRITICAL') {
        score += 100;
        reasons.push('Critical priority task');
      } else if (task.priority === 'HIGH') {
        score += 80;
        reasons.push('High-priority task');
      } else if (task.priority === 'MEDIUM') {
        score += 40;
      } else {
        score += 10;
      }

      // 5. Fits available time window
      const est = task.estimatedMinutes || 60;
      if (est <= availableCareerMinutes) {
        score += 50;
        reasons.push(`Fits available focus window (${est}m)`);
      }

      return {
        task,
        score,
        reasons,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored[0];

    const compositeReason =
      top.reasons.length > 0
        ? `${top.reasons.slice(0, 3).join(', ')}.`
        : 'Next prioritized item in your career plan.';

    return {
      recommendedTask: {
        id: top.task.id,
        title: top.task.title,
        priority: top.task.priority,
        status: top.task.status,
        estimatedMinutes: top.task.estimatedMinutes,
        dueDate: top.task.dueDate,
        goal: top.task.goal ? { id: top.task.goal.id, title: top.task.goal.title } : null,
        milestone: top.task.milestone
          ? { id: top.task.milestone.id, title: top.task.milestone.title }
          : null,
      },
      score: top.score,
      reason: compositeReason,
    };
  }
}

module.exports = new TaskRankingService();
