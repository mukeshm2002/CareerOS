class AdaptationService {
  /**
   * Deterministically evaluate factual review metrics to produce actionable adaptation suggestions
   * @param {Object} metrics - Weekly metrics output from weeklyMetricsService
   * @returns {Array<{ ruleId: string, type: string, title: string, message: string, action: string }>}
   */
  generateAdaptations(metrics) {
    const suggestions = [];

    // Rule 1: REDUCE_LOAD (Planned vs Actual Gap)
    if (
      metrics.plannedFocusMinutes > 0 &&
      metrics.actualFocusMinutes < metrics.plannedFocusMinutes &&
      metrics.differenceMinutes <= -30
    ) {
      suggestions.push({
        ruleId: 'REDUCE_LOAD',
        type: 'SCHEDULE',
        category: 'SCHEDULE',
        title: 'Adjust Planned Time',
        message: `You planned ${Math.round(metrics.plannedFocusMinutes / 60)}h of career time but used ${Math.round(metrics.actualFocusMinutes / 60)}h this week. Consider planning shorter focus sessions or smaller daily commitments for next week.`,
        action: 'Reduce planned weekly hours by 20–30% to match real capacity.',
      });
    }

    // Rule 2: RESOLVE_BLOCKERS (Blockers Detected)
    if (metrics.blockedTasksCount > 0) {
      suggestions.push({
        ruleId: 'RESOLVE_BLOCKERS',
        type: 'RESOLVE_BLOCKERS',
        category: 'WORKFLOW',
        title: 'Address Blocked Work',
        message: `You have ${metrics.blockedTasksCount} blocked task${metrics.blockedTasksCount > 1 ? 's' : ''}. Consider resolving dependencies, unblocking blockers, or rescheduling them before queueing new work.`,
        action: 'Schedule an explicit unblocking task or deprioritize blocked items.',
      });
    }

    // Rule 3: RESTORE_MOMENTUM (Low Consistency or No Activity)
    if (metrics.activeDays === 0 && metrics.focusSessionsCompleted === 0) {
      suggestions.push({
        ruleId: 'RESTORE_MOMENTUM',
        type: 'MOMENTUM',
        category: 'START',
        title: 'Restart with a Low-Barrier Session',
        message: 'No focus sessions were recorded this week. Consider scheduling a single 20-minute focus session early next week to rebuild momentum.',
        action: 'Confirm a 20-minute daily plan for Monday.',
      });
    } else if (metrics.activeDays > 0 && metrics.activeDays <= 2) {
      suggestions.push({
        ruleId: 'RESTORE_MOMENTUM',
        type: 'MOMENTUM',
        category: 'CONSISTENCY',
        title: 'Build Consistent Frequency',
        message: `Career work occurred on ${metrics.activeDays} day${metrics.activeDays > 1 ? 's' : ''} this week. A smaller, more repeatable daily schedule (e.g. 25–30 min) may be easier to maintain consistently than infrequent long sessions.`,
        action: 'Aim for 3 or 4 shorter 25-minute sessions instead of one long weekend block.',
      });
    }

    // Rule 4: PROTECT_CONSISTENCY (Strong Main Focus Follow-Through)
    if (
      metrics.dailyPlansConfirmed >= 3 &&
      metrics.mainFocusCompleted / metrics.dailyPlansConfirmed >= 0.75
    ) {
      suggestions.push({
        ruleId: 'PROTECT_CONSISTENCY',
        type: 'EXECUTION',
        category: 'EXECUTION',
        title: 'Maintain Daily Focus Discipline',
        message: `You completed your confirmed main focus on ${metrics.mainFocusCompleted} of ${metrics.dailyPlansConfirmed} days. Your current daily prioritization appears workable; continue protecting this single main priority.`,
        action: 'Keep setting only 1 high-priority task per day.',
      });
    }

    // Rule 5: MAINTAIN_PACE (Reframed from INCREASE_CHALLENGE for sustainable planning)
    if (metrics.tasksCompleted >= 6 && metrics.activeDays >= 4) {
      suggestions.push({
        ruleId: 'MAINTAIN_PACE',
        type: 'SCHEDULE',
        category: 'SUSTAINABILITY',
        title: 'Maintain Sustainable Pace',
        message: 'Your current pace appears sustainable. Consider maintaining it next week.',
        action: 'Maintain current weekly target rather than prematurely increasing workload.',
      });
    }

    return suggestions;
  }
}

module.exports = new AdaptationService();
