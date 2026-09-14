/**
 * VALARI — Growth Areas Expansion Test Suite
 *
 * Validates:
 * 1. Growth Area persistence on Goal (CAREER, COMMUNICATION, HEALTH)
 * 2. Career existing goal backward compatibility (defaults to CAREER)
 * 3. Communication goal creation with metadata (currentLevel, focusAreas, practiceTarget)
 * 4. Health goal creation with metadata (routine, frequency, targetDuration)
 * 5. User isolation (User A cannot see or access User B's goals or tasks across areas)
 * 6. Task area linkage (Tasks can belong to COMMUNICATION or HEALTH, inherits goal area if linked)
 * 7. Today secondary routine retrieval (getTodayContext returns balance with communication & health)
 * 8. Progress factual aggregation (factual breakdown per growth area, no AI score)
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../src/config/db');
const goalService = require('../src/services/goal.service');
const taskPlanningService = require('../src/services/planning/taskPlanning.service');
const todayService = require('../src/services/today/today.service');
const progressService = require('../src/services/progress/progress.service');

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
  console.log('🌱 STARTING VALARI GROWTH AREAS EXPANSION TESTS');
  console.log('=============================================================\n');

  let userA = null;
  let userB = null;

  try {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `growth_a_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Valari User A',
        profile: {
          create: {
            displayName: 'User A',
            timezone: 'Asia/Kolkata',
            currentRole: 'Software Engineer',
            targetRole: 'Senior Engineer',
            availableCareerMinutes: 120,
          },
        },
      },
      include: { profile: true },
    });

    userB = await prisma.user.create({
      data: {
        email: `growth_b_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Valari User B',
        profile: {
          create: {
            displayName: 'User B',
            timezone: 'America/New_York',
            currentRole: 'Designer',
            targetRole: 'Lead Designer',
            availableCareerMinutes: 90,
          },
        },
      },
      include: { profile: true },
    });

    console.log('Test Users Created:');
    console.log(`  User A: ${userA.id}`);
    console.log(`  User B: ${userB.id}\n`);

    // =========================================================================
    // TEST 1: Career existing goal backward compatibility (defaults to CAREER)
    // =========================================================================
    console.log('👉 TEST 1: Existing / Default Goal creation defaults to CAREER');
    const legacyGoal = await goalService.createGoal(userA.id, {
      title: 'Promote to Senior Backend Engineer',
      type: 'PROMOTION',
      priority: 'HIGH',
      targetRole: 'Senior Backend Engineer',
    });
    assert(legacyGoal.growthArea === 'CAREER', 'Default goal has growthArea === CAREER');
    assert(legacyGoal.type === 'PROMOTION', 'Goal type is preserved');

    // =========================================================================
    // TEST 2: Communication goal creation with metadata
    // =========================================================================
    console.log('\n👉 TEST 2: Communication goal creation with metadata');
    const commGoal = await goalService.createGoal(userA.id, {
      title: 'Master Spoken English & Technical Presentation',
      type: 'IMPROVE_SPOKEN_ENGLISH',
      growthArea: 'COMMUNICATION',
      priority: 'MEDIUM',
      metadata: {
        currentLevel: 'Comfortable',
        focusAreas: ['Pronunciation', 'Vocabulary', 'Confidence'],
        practiceTarget: '15 min/day',
      },
    });
    assert(commGoal.growthArea === 'COMMUNICATION', 'Goal growthArea persisted as COMMUNICATION');
    assert(commGoal.type === 'IMPROVE_SPOKEN_ENGLISH', 'Goal type is IMPROVE_SPOKEN_ENGLISH');
    assert(commGoal.metadata.currentLevel === 'Comfortable', 'Metadata currentLevel persisted');
    assert(commGoal.metadata.practiceTarget === '15 min/day', 'Metadata practiceTarget persisted');

    // =========================================================================
    // TEST 3: Health goal creation with metadata (non-medical lifestyle)
    // =========================================================================
    console.log('\n👉 TEST 3: Health goal creation with metadata (lifestyle routine)');
    const healthGoal = await goalService.createGoal(userA.id, {
      title: 'Daily Morning Walk & Sleep Consistency',
      type: 'BUILD_EXERCISE_HABIT',
      growthArea: 'HEALTH',
      priority: 'HIGH',
      metadata: {
        routine: 'Morning Walk',
        frequency: 'Daily',
        targetDuration: '20 min',
      },
    });
    assert(healthGoal.growthArea === 'HEALTH', 'Goal growthArea persisted as HEALTH');
    assert(healthGoal.type === 'BUILD_EXERCISE_HABIT', 'Goal type is BUILD_EXERCISE_HABIT');
    assert(healthGoal.metadata.routine === 'Morning Walk', 'Metadata routine persisted');

    // =========================================================================
    // TEST 4: Goal filtering by growthArea
    // =========================================================================
    console.log('\n👉 TEST 4: Goal listing supports growthArea filtering');
    const allGoalsA = await goalService.listGoals(userA.id);
    assert(allGoalsA.length >= 3, 'User A has at least 3 goals total across areas');

    const careerOnly = await goalService.listGoals(userA.id, { growthArea: 'CAREER' });
    assert(careerOnly.every((g) => g.growthArea === 'CAREER'), 'Filtered CAREER goals only have growthArea CAREER');
    assert(careerOnly.some((g) => g.id === legacyGoal.id), 'Legacy goal returned under CAREER');

    const commOnly = await goalService.listGoals(userA.id, { growthArea: 'COMMUNICATION' });
    assert(commOnly.length === 1 && commOnly[0].id === commGoal.id, 'Filtered COMMUNICATION goals return communication goal');

    const healthOnly = await goalService.listGoals(userA.id, { growthArea: 'HEALTH' });
    assert(healthOnly.length === 1 && healthOnly[0].id === healthGoal.id, 'Filtered HEALTH goals return health goal');

    // =========================================================================
    // TEST 5: User Isolation across Growth Areas
    // =========================================================================
    console.log('\n👉 TEST 5: User Isolation');
    const userBGoals = await goalService.listGoals(userB.id);
    assert(userBGoals.length === 0, "User B has 0 goals (cannot see User A's goals)");

    let isolatedErrorCaught = false;
    try {
      await goalService.getGoalById(userB.id, commGoal.id);
    } catch (e) {
      isolatedErrorCaught = true;
      assert(e.statusCode === 404, "User B cannot fetch User A's communication goal by ID (404)");
    }
    assert(isolatedErrorCaught, 'User isolation error thrown successfully');

    // =========================================================================
    // TEST 6: Task area linkage & inference
    // =========================================================================
    console.log('\n👉 TEST 6: Task growthArea linkage and goal inheritance');
    // Task 6a: Explicit COMMUNICATION task
    const commTask = await taskPlanningService.createTask(userA.id, {
      title: '15 min Spontaneous Tech Pitch in English',
      growthArea: 'COMMUNICATION',
      estimatedMinutes: 15,
      goalId: commGoal.id,
      dueDate: new Date().toISOString(),
    });
    assert(commTask.growthArea === 'COMMUNICATION', 'Task explicitly set to COMMUNICATION');
    assert(commTask.goalId === commGoal.id, 'Task correctly linked to communication goal');

    // Task 6b: Health task inferring growthArea from healthGoal
    const healthTask = await taskPlanningService.createTask(userA.id, {
      title: '20 min Morning Walk in Park',
      goalId: healthGoal.id, // growthArea omitted; should be inferred from goal
      estimatedMinutes: 20,
      dueDate: new Date().toISOString(),
    });
    assert(healthTask.growthArea === 'HEALTH', 'Task inferred HEALTH growthArea from linked goal');

    // Task 6c: Default standalone career task
    const careerTask = await taskPlanningService.createTask(userA.id, {
      title: 'Implement OAuth2 token rotation',
      estimatedMinutes: 60,
      dueDate: new Date().toISOString(),
    });
    assert(careerTask.growthArea === 'CAREER', 'Standalone task defaults to CAREER');

    // Task filtering by growthArea
    const commTasksList = await taskPlanningService.getTasks(userA.id, { growthArea: 'COMMUNICATION' });
    assert(commTasksList.length === 1 && commTasksList[0].id === commTask.id, 'getTasks filters by growthArea');

    // =========================================================================
    // TEST 7: Today secondary routine retrieval (Keep Your Balance)
    // =========================================================================
    console.log('\n👉 TEST 7: Today context secondary routine retrieval');
    const todayContext = await todayService.getTodayContext(userA.id);
    assert(todayContext.balance !== undefined, 'todayContext includes balance object');
    assert(todayContext.balance.communication !== undefined, 'balance includes communication');
    assert(todayContext.balance.health !== undefined, 'balance includes health');
    assert(todayContext.balance.communication.task?.id === commTask.id, "balance retrieved today's communication task");
    assert(todayContext.balance.health.task?.id === healthTask.id, "balance retrieved today's health task");
    assert(todayContext.balance.communication.isCompletedToday === false, 'communication task status is incomplete');

    // Complete communication task and verify todayContext marks isCompletedToday
    await taskPlanningService.updateTaskStatus(userA.id, commTask.id, 'COMPLETED');
    const updatedTodayContext = await todayService.getTodayContext(userA.id);
    assert(updatedTodayContext.balance.communication.isCompletedToday === true, 'Communication marked as completed today');

    // =========================================================================
    // TEST 8: Progress factual aggregation per area (no arbitrary scores)
    // =========================================================================
    console.log('\n👉 TEST 8: Progress factual aggregation per area');
    // Also complete the health task for today
    await taskPlanningService.updateTaskStatus(userA.id, healthTask.id, 'COMPLETED');

    const progressSummary = await progressService.getProgressSummary(userA.id, 'this_week');
    assert(progressSummary.growthAreas !== undefined, 'progressSummary includes growthAreas breakdown');
    assert(progressSummary.growthAreas.career !== undefined, 'growthAreas includes career');
    assert(progressSummary.growthAreas.communication !== undefined, 'growthAreas includes communication');
    assert(progressSummary.growthAreas.health !== undefined, 'growthAreas includes health');

    assert(progressSummary.growthAreas.communication.tasksCompleted === 1, 'Communication completed tasks factual count === 1');
    assert(progressSummary.growthAreas.communication.practiceDays === 1, 'Communication practice days count === 1');
    assert(progressSummary.growthAreas.health.tasksCompleted === 1, 'Health completed tasks factual count === 1');
    assert(progressSummary.growthAreas.health.routineDays === 1, 'Health routine days count === 1');

    assert(progressSummary.weeklySummary !== undefined, 'progressSummary includes weeklySummary');
    assert(typeof progressSummary.weeklySummary.career === 'string', 'weeklySummary has factual career string');
    assert(typeof progressSummary.weeklySummary.communication === 'string', 'weeklySummary has factual communication string');
    assert(typeof progressSummary.weeklySummary.health === 'string', 'weeklySummary has factual health string');

    console.log('\n=============================================================');
    console.log(`🎉 ALL TESTS PASSED! (${testsPassed} assertions passed, ${testsFailed} failed)`);
    console.log('=============================================================');
  } catch (error) {
    console.error('\n❌ TEST RUN ABORTED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    // Cleanup
    if (userA || userB) {
      console.log('\n🧹 Cleaning up test users...');
      if (userA) {
        await prisma.task.deleteMany({ where: { userId: userA.id } }).catch(() => {});
        await prisma.goal.deleteMany({ where: { userId: userA.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: userA.id } }).catch(() => {});
      }
      if (userB) {
        await prisma.task.deleteMany({ where: { userId: userB.id } }).catch(() => {});
        await prisma.goal.deleteMany({ where: { userId: userB.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: userB.id } }).catch(() => {});
      }
      console.log('🧹 Cleanup complete.');
    }
  }
}

runTests();
