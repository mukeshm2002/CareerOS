/**
 * EYTHU GOALS MODULE V1 — 20-Point Production Verification Test Suite
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../src/config/db');
const goalService = require('../src/services/goal.service');
const taskPlanningService = require('../src/services/planning/taskPlanning.service');
const roadmapService = require('../src/services/planning/roadmap.service');
const focusSessionService = require('../src/services/focus/focusSession.service');
const { createGoalSchema } = require('../src/validators/goal.validator');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    testsFailed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('=============================================================');
  console.log('🎯 STARTING EYTHU GOALS MODULE V1 COMPREHENSIVE TESTS');
  console.log('=============================================================\n');

  let userA = null;
  let userB = null;

  try {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `goals_v1_a_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Goals V1 Test User A',
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `goals_v1_b_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Goals V1 Test User B',
      },
    });

    // -------------------------------------------------------------
    // TEST 1: Create simple Career Goal
    // -------------------------------------------------------------
    console.log('--- TEST 1: Create simple Career Goal ---');
    const careerGoal = await goalService.createGoal(userA.id, {
      title: 'Get a Software Developer Job',
      area: 'CAREER',
      trackingMethod: 'MILESTONES',
      priority: 'HIGH',
    });
    assert(careerGoal.title === 'Get a Software Developer Job', 'Title set correctly');
    assert(careerGoal.area === 'CAREER', 'Area set to CAREER');
    assert(careerGoal.growthArea === 'CAREER', 'growthArea mapped to CAREER');
    assert(careerGoal.status === 'ACTIVE', 'Default status is ACTIVE');
    console.log();

    // -------------------------------------------------------------
    // TEST 2: Create Health & Fitness Goal
    // -------------------------------------------------------------
    console.log('--- TEST 2: Create Health & Fitness Goal ---');
    const healthGoal = await goalService.createGoal(userA.id, {
      title: 'Exercise 4 Days Every Week',
      area: 'HEALTH_AND_FITNESS',
      trackingMethod: 'ROUTINE',
      routineFrequency: 4,
      routinePeriod: 'WEEK',
      priority: 'MEDIUM',
    });
    assert(healthGoal.area === 'HEALTH_AND_FITNESS', 'Area is HEALTH_AND_FITNESS');
    assert(healthGoal.growthArea === 'HEALTH', 'growthArea mapped to HEALTH for compatibility');
    assert(healthGoal.routineFrequency === 4, 'routineFrequency is 4');
    assert(healthGoal.routinePeriod === 'WEEK', 'routinePeriod is WEEK');
    console.log();

    // -------------------------------------------------------------
    // TEST 3: Create Communication Goal
    // -------------------------------------------------------------
    console.log('--- TEST 3: Create Communication Goal ---');
    const commGoal = await goalService.createGoal(userA.id, {
      title: 'Improve English Communication',
      area: 'COMMUNICATION',
      why: 'I want to speak with confidence in global meetings',
      desiredOutcome: 'Hold a 20-minute fluent conversation',
      trackingMethod: 'MANUAL',
    });
    assert(commGoal.area === 'COMMUNICATION', 'Area is COMMUNICATION');
    assert(commGoal.growthArea === 'COMMUNICATION', 'growthArea mapped to COMMUNICATION');
    assert(commGoal.why === 'I want to speak with confidence in global meetings', 'Why recorded');
    assert(commGoal.desiredOutcome === 'Hold a 20-minute fluent conversation', 'Desired outcome recorded');
    console.log();

    // -------------------------------------------------------------
    // TEST 4: Create Goal with no target date
    // -------------------------------------------------------------
    console.log('--- TEST 4: Create Goal with no target date ---');
    const noDeadlineGoal = await goalService.createGoal(userA.id, {
      title: 'Learn Guitar for Fun',
      area: 'CREATIVE',
      trackingMethod: 'MANUAL',
      targetDate: null,
    });
    assert(noDeadlineGoal.targetDate === null, 'Target date is null');
    assert(noDeadlineGoal.area === 'CREATIVE', 'Area is CREATIVE');
    assert(noDeadlineGoal.growthArea === 'PERSONAL', 'growthArea is PERSONAL');
    console.log();

    // -------------------------------------------------------------
    // TEST 5: Create numeric Goal: ₹0 → ₹100000. Update to ₹25000. Expect: 25%
    // -------------------------------------------------------------
    console.log('--- TEST 5: Create numeric Goal (₹0 -> ₹100,000) & update to ₹25,000 ---');
    const numericGoal = await goalService.createGoal(userA.id, {
      title: 'Save ₹1,00,000',
      area: 'FINANCE',
      trackingMethod: 'NUMBER_TARGET',
      startValue: 0,
      currentValue: 0,
      targetValue: 100000,
      unit: '₹',
    });
    assert(numericGoal.progress === 0, 'Initial progress is 0%');

    const updatedProg = await goalService.updateGoalProgress(userA.id, numericGoal.id, {
      currentValue: 25000,
    });
    assert(updatedProg.progress === 25, 'Progress after ₹25,000 is 25%');

    const freshNumeric = await goalService.getGoalById(userA.id, numericGoal.id);
    assert(freshNumeric.progress === 25, 'Goal record progress persisted as 25%');
    console.log();

    // -------------------------------------------------------------
    // TEST 6: Numeric value exceeds target. Ensure safe clamping (100%, no NaN/Infinity)
    // -------------------------------------------------------------
    console.log('--- TEST 6: Numeric value exceeds target ---');
    const overTarget = await goalService.updateGoalProgress(userA.id, numericGoal.id, {
      currentValue: 150000,
    });
    assert(overTarget.progress === 100, 'Exceeded target is clamped safely to 100%');
    assert(!isNaN(overTarget.progress), 'Progress is not NaN');
    assert(isFinite(overTarget.progress), 'Progress is finite');
    console.log();

    // -------------------------------------------------------------
    // TEST 7: Manual Goal progress: 40%
    // -------------------------------------------------------------
    console.log('--- TEST 7: Manual Goal progress: 40% ---');
    const manualUpdate = await goalService.updateGoalProgress(userA.id, commGoal.id, {
      manualProgress: 40,
    });
    assert(manualUpdate.progress === 40, 'Manual goal progress updated to 40%');
    console.log();

    // -------------------------------------------------------------
    // TEST 8: Add multiple Success Criteria. Complete one. Verify correct count
    // -------------------------------------------------------------
    console.log('--- TEST 8: Add multiple Success Criteria & Complete one ---');
    const crit1 = await goalService.addSuccessCriterion(userA.id, commGoal.id, {
      title: 'Complete 20 speaking sessions',
    });
    const crit2 = await goalService.addSuccessCriterion(userA.id, commGoal.id, {
      title: 'Deliver 3 presentations',
    });
    assert(crit1.id && crit2.id, 'Criteria created successfully');

    const toggled = await goalService.toggleSuccessCriterion(userA.id, commGoal.id, crit1.id, true);
    assert(toggled.isCompleted === true, 'First criterion marked complete');
    assert(toggled.completedAt !== null, 'completedAt timestamp set');

    const commWithCriteria = await goalService.getGoalById(userA.id, commGoal.id);
    assert(commWithCriteria.successCriteria.length === 2, '2 criteria present');
    assert(commWithCriteria.successCriteria.filter((c) => c.isCompleted).length === 1, '1 of 2 achieved');
    console.log();

    // -------------------------------------------------------------
    // TEST 9: Pause Goal. Verify relationships/data preserved
    // -------------------------------------------------------------
    console.log('--- TEST 9: Pause Goal ---');
    const paused = await goalService.updateGoalStatus(userA.id, commGoal.id, {
      status: 'PAUSED',
      pauseReason: 'Focusing on exams for 2 weeks',
      resumeDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    assert(paused.status === 'PAUSED', 'Status updated to PAUSED');
    assert(paused.pauseReason === 'Focusing on exams for 2 weeks', 'Pause reason saved');

    const freshPaused = await goalService.getGoalById(userA.id, commGoal.id);
    assert(freshPaused.successCriteria.length === 2, 'Success criteria preserved when paused');
    console.log();

    // -------------------------------------------------------------
    // TEST 10: Complete Goal. Verify completedAt/status behavior
    // -------------------------------------------------------------
    console.log('--- TEST 10: Complete Goal ---');
    const completed = await goalService.updateGoalStatus(userA.id, careerGoal.id, {
      status: 'COMPLETED',
      reflection: 'Daily mock interviews and project portfolio helped land the role',
      learnings: 'Consistency beats intensity',
    });
    assert(completed.status === 'COMPLETED', 'Status is COMPLETED');
    assert(completed.completedAt !== null, 'completedAt timestamp is recorded');
    assert(completed.reflection !== null, 'reflection saved');
    assert(completed.learnings !== null, 'learnings saved');
    console.log();

    // -------------------------------------------------------------
    // TEST 11: Archive Goal. Verify it no longer appears in normal Active view
    // -------------------------------------------------------------
    console.log('--- TEST 11: Archive Goal ---');
    await goalService.updateGoalStatus(userA.id, noDeadlineGoal.id, { status: 'ARCHIVED' });

    const activeList = await goalService.listGoals(userA.id);
    const archivedFoundInActive = activeList.some((g) => g.id === noDeadlineGoal.id);
    assert(!archivedFoundInActive, 'Archived goal does not appear in default goals list');

    const archivedList = await goalService.listGoals(userA.id, { status: 'ARCHIVED' });
    const archivedFound = archivedList.some((g) => g.id === noDeadlineGoal.id);
    assert(archivedFound, 'Archived goal appears when filtering by ARCHIVED');
    console.log();

    // -------------------------------------------------------------
    // TEST 12: Roadmap-linked Goal. Verify existing Roadmap relationship remains functional
    // -------------------------------------------------------------
    console.log('--- TEST 12: Roadmap-linked Goal ---');
    const roadmapGoal = await goalService.createGoal(userA.id, {
      title: 'Complete Degree Project',
      area: 'EDUCATION',
      trackingMethod: 'MILESTONES',
    });

    const roadmap = await roadmapService.createRoadmap(userA.id, roadmapGoal.id, {
      title: 'Final Year Project Roadmap',
      useTemplate: false,
    });

    const m1 = await roadmapService.addMilestone(userA.id, roadmap.id, {
      title: 'Phase 1: Architecture Proposal',
      status: 'NOT_STARTED',
    });
    const m2 = await roadmapService.addMilestone(userA.id, roadmap.id, {
      title: 'Phase 2: Implementation',
      status: 'NOT_STARTED',
    });

    // Complete m1
    await roadmapService.updateMilestoneStatus(userA.id, m1.id, 'COMPLETED');

    const freshRoadmapGoal = await goalService.getGoalById(userA.id, roadmapGoal.id);
    assert(freshRoadmapGoal.progress === 50, 'Roadmap progress calculated 1/2 = 50% for goal');
    console.log();

    // -------------------------------------------------------------
    // TEST 13: Task-based Goal. Complete Task through existing task flow. Verify progress
    // -------------------------------------------------------------
    console.log('--- TEST 13: Task-based Goal ---');
    const taskGoal = await goalService.createGoal(userA.id, {
      title: 'Complete 4 Portfolio Case Studies',
      area: 'SKILLS',
      trackingMethod: 'TASKS',
    });

    const t1 = await taskPlanningService.createTask(userA.id, {
      title: 'Case Study 1: E-commerce',
      goalId: taskGoal.id,
      status: 'TODO',
    });
    const t2 = await taskPlanningService.createTask(userA.id, {
      title: 'Case Study 2: Realtime Chat',
      goalId: taskGoal.id,
      status: 'TODO',
    });

    // Complete t1 via task transition
    await taskPlanningService.updateTaskStatus(userA.id, t1.id, 'COMPLETED');

    const freshTaskGoal = await goalService.getGoalById(userA.id, taskGoal.id);
    assert(freshTaskGoal.progress === 50, 'Task-based goal progress updated to 50% (1 of 2)');
    console.log();

    // -------------------------------------------------------------
    // TEST 14: Focus Session completion affects Task-based Goal
    // -------------------------------------------------------------
    console.log('--- TEST 14: Focus Session completion ---');
    const focusSession = await focusSessionService.startSession(userA.id, {
      plannedMinutes: 25,
      taskId: t2.id,
    });

    await focusSessionService.finishSession(userA.id, focusSession.id, {
      actualMinutes: 25,
      taskOutcome: 'COMPLETED',
    });

    const finishedTaskGoal = await goalService.getGoalById(userA.id, taskGoal.id);
    assert(finishedTaskGoal.progress === 100, 'Goal progress updated to 100% after focus session task completion');
    console.log();

    // -------------------------------------------------------------
    // TEST 15: Cross-user isolation. User A cannot access User B Goal
    // -------------------------------------------------------------
    console.log('--- TEST 15: Cross-user isolation ---');
    const userBGoal = await goalService.createGoal(userB.id, {
      title: 'User B Secret Goal',
      area: 'BUSINESS',
    });

    let isolationBlocked = false;
    try {
      await goalService.getGoalById(userA.id, userBGoal.id);
    } catch (err) {
      isolationBlocked = err.statusCode === 404 || err.message.includes('not found');
    }
    assert(isolationBlocked, 'User A cannot access User B goal');

    let criterionBlocked = false;
    try {
      await goalService.addSuccessCriterion(userA.id, userBGoal.id, { title: 'Hacked' });
    } catch (err) {
      criterionBlocked = true;
    }
    assert(criterionBlocked, 'User A cannot add criterion to User B goal');
    console.log();

    // -------------------------------------------------------------
    // TEST 16: Existing Goal backward compatibility
    // -------------------------------------------------------------
    console.log('--- TEST 16: Backward compatibility for legacy goals ---');
    const legacyGoal = await prisma.goal.create({
      data: {
        userId: userA.id,
        title: 'Legacy Career Goal',
        growthArea: 'CAREER',
        status: 'ACTIVE',
        progress: 15,
      },
    });

    const loadedLegacy = await goalService.getGoalById(userA.id, legacyGoal.id);
    assert(loadedLegacy.title === 'Legacy Career Goal', 'Legacy goal loads correctly');
    assert(loadedLegacy.growthArea === 'CAREER', 'growthArea preserved');
    assert(loadedLegacy.progress === 15, 'Legacy progress preserved');
    console.log();

    // -------------------------------------------------------------
    // TEST 17: Invalid input rejected by validator
    // -------------------------------------------------------------
    console.log('--- TEST 17: Validator rejects invalid inputs ---');
    const invalidEmpty = createGoalSchema.safeParse({ title: '' });
    assert(!invalidEmpty.success, 'Empty title rejected by validator');

    const invalidNumber = createGoalSchema.safeParse({
      title: 'Save Money',
      trackingMethod: 'NUMBER_TARGET',
      targetValue: null,
    });
    assert(!invalidNumber.success, 'NUMBER_TARGET without targetValue rejected by validator');
    console.log();

    // -------------------------------------------------------------
    // TEST 18: Custom "Other" area behaves correctly
    // -------------------------------------------------------------
    console.log('--- TEST 18: Custom "Other" area ---');
    const customAreaGoal = await goalService.createGoal(userA.id, {
      title: 'Write Daily Journal',
      area: 'OTHER',
      customArea: 'Mindfulness',
      trackingMethod: 'ROUTINE',
      routineFrequency: 7,
      routinePeriod: 'WEEK',
    });
    assert(customAreaGoal.area === 'OTHER', 'Area is OTHER');
    assert(customAreaGoal.customArea === 'Mindfulness', 'customArea is Mindfulness');
    assert(customAreaGoal.growthArea === 'PERSONAL', 'growthArea safely mapped to PERSONAL');
    console.log();

    // -------------------------------------------------------------
    // TEST 19: Check-in recording & retrieval
    // -------------------------------------------------------------
    console.log('--- TEST 19: Check-in recording & retrieval ---');
    const checkIn = await goalService.addCheckIn(userA.id, customAreaGoal.id, {
      confidence: 'NEEDS_ATTENTION',
      whatIsGoingWell: 'Writing 3 days consistently',
      whatIsGettingInWay: 'Late evening fatigue',
      adjustmentsNeeded: 'Write in the morning instead',
    });
    assert(checkIn.confidence === 'NEEDS_ATTENTION', 'Confidence recorded as NEEDS_ATTENTION');

    const allCheckIns = await goalService.getCheckIns(userA.id, customAreaGoal.id);
    assert(allCheckIns.length === 1, '1 check-in retrieved');
    assert(allCheckIns[0].adjustmentsNeeded === 'Write in the morning instead', 'Adjustments retrieved');
    console.log();

    // -------------------------------------------------------------
    // TEST 20: Summary metrics calculation
    // -------------------------------------------------------------
    console.log('--- TEST 20: Goal summary metrics ---');
    const metrics = await goalService.getGoalMetrics(userA.id);
    assert(metrics.active > 0, 'Active count is positive');
    assert(metrics.completed >= 1, 'Completed count reflects completed goals');
    assert(metrics.needsAttention >= 1, 'Needs attention count reflects checkIn marked NEEDS_ATTENTION');
    console.log('Metrics summary:', metrics);
    console.log();

    console.log('=============================================================');
    console.log(`🎉 ALL 20 TESTS PASSED! (${testsPassed} assertions passed, ${testsFailed} failed)`);
    console.log('=============================================================\n');
  } finally {
    console.log('🧹 Cleaning up test users...');
    if (userA) {
      await prisma.goalCheckIn.deleteMany({ where: { userId: userA.id } });
      await prisma.goalSuccessCriterion.deleteMany({ where: { userId: userA.id } });
      await prisma.focusSession.deleteMany({ where: { userId: userA.id } });
      await prisma.reminder.deleteMany({ where: { userId: userA.id } });
      await prisma.task.deleteMany({ where: { userId: userA.id } });
      await prisma.roadmapMilestone.deleteMany({ where: { userId: userA.id } });
      await prisma.roadmap.deleteMany({ where: { userId: userA.id } });
      await prisma.goal.deleteMany({ where: { userId: userA.id } });
      await prisma.user.delete({ where: { id: userA.id } });
    }
    if (userB) {
      await prisma.goalCheckIn.deleteMany({ where: { userId: userB.id } });
      await prisma.goalSuccessCriterion.deleteMany({ where: { userId: userB.id } });
      await prisma.focusSession.deleteMany({ where: { userId: userB.id } });
      await prisma.reminder.deleteMany({ where: { userId: userB.id } });
      await prisma.task.deleteMany({ where: { userId: userB.id } });
      await prisma.roadmapMilestone.deleteMany({ where: { userId: userB.id } });
      await prisma.roadmap.deleteMany({ where: { userId: userB.id } });
      await prisma.goal.deleteMany({ where: { userId: userB.id } });
      await prisma.user.delete({ where: { id: userB.id } });
    }
    await prisma.$disconnect();
    console.log('🧹 Cleanup complete.');
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
