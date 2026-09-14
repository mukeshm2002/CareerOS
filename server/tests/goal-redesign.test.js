/**
 * VALARI — 3-Step Guided Goal Creation Test Suite
 *
 * Validates:
 * 1. Support for all 4 Growth Areas: CAREER, COMMUNICATION, HEALTH, PERSONAL
 * 2. New contextual GoalType enums across all areas
 * 3. Persistence of Actionable Step 3 data in metadata and description
 * 4. Automatic creation of Roadmap & Milestone when firstMilestone is provided
 * 5. Automatic creation of linked Task when firstAction is provided
 * 6. Automatic creation of linked Reminder when reminder configuration is provided
 * 7. Backward compatibility for goals created without actionable fields
 * 8. User isolation and data integrity across users
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../src/config/db');
const goalService = require('../src/services/goal.service');

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
  console.log('🎯 STARTING VALARI 3-STEP GUIDED GOAL CREATION TESTS');
  console.log('=============================================================\n');

  let userA = null;
  let userB = null;

  try {
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `goal_test_a_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Goal Test User A',
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `goal_test_b_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Goal Test User B',
      },
    });

    console.log(`Test Users Created:\n  User A: ${userA.id}\n  User B: ${userB.id}\n`);

    // TEST 1: Create Career Goal with full 3-step actionable details
    console.log('👉 TEST 1: Career Goal with 3-Step Actionable Fields');
    const careerGoal = await goalService.createGoal(userA.id, {
      title: 'Land Staff Backend Engineer at Top Tech',
      growthArea: 'CAREER',
      type: 'JOB_SWITCH',
      priority: 'HIGH',
      targetRole: 'Staff Backend Engineer',
      targetDate: '2026-12-31',
      why: 'Unlock high technical impact and architectural leadership.',
      weeklyCommitment: 10,
      firstMilestone: 'Complete Distributed Systems Mastery module',
      firstAction: 'Draft study curriculum and block Sunday 9 AM',
      reminder: {
        frequency: 'WEEKLY',
        time: '09:00',
        channel: 'IN_APP',
      },
    });

    assert(careerGoal.growthArea === 'CAREER', 'Career goal growthArea is CAREER');
    assert(careerGoal.type === 'JOB_SWITCH', 'Goal type is JOB_SWITCH');
    assert(careerGoal.targetRole === 'Staff Backend Engineer', 'Target role preserved for Career');
    assert(careerGoal.description === 'Unlock high technical impact and architectural leadership.', 'Why saved to description');
    assert(careerGoal.metadata?.weeklyCommitment === 10, 'Weekly commitment saved in metadata');
    assert(careerGoal.metadata?.firstMilestone === 'Complete Distributed Systems Mastery module', 'First milestone saved in metadata');
    assert(careerGoal.metadata?.firstAction === 'Draft study curriculum and block Sunday 9 AM', 'First action saved in metadata');

    // Verify roadmap and milestone created
    const roadmaps = await prisma.roadmap.findMany({
      where: { goalId: careerGoal.id },
      include: { milestones: true },
    });
    assert(roadmaps.length === 1, 'Roadmap created for goal');
    assert(roadmaps[0].milestones.length === 1, 'RoadmapMilestone created');
    assert(roadmaps[0].milestones[0].title === 'Complete Distributed Systems Mastery module', 'Milestone title matches firstMilestone');

    // Verify task created
    const tasks = await prisma.task.findMany({
      where: { goalId: careerGoal.id },
    });
    assert(tasks.length === 1, 'Task created for firstAction');
    assert(tasks[0].title === 'Draft study curriculum and block Sunday 9 AM', 'Task title matches firstAction');
    assert(tasks[0].status === 'TODO', 'Task initial status is TODO');
    assert(tasks[0].growthArea === 'CAREER', 'Task inherited CAREER growthArea');

    // Verify reminder created
    const reminders = await prisma.reminder.findMany({
      where: { linkedGoalId: careerGoal.id },
    });
    assert(reminders.length === 1, 'Reminder created for goal');
    assert(reminders[0].time === '09:00', 'Reminder time is 09:00');
    assert(reminders[0].recurrence === 'WEEKLY', 'Reminder recurrence is WEEKLY');
    console.log();

    // TEST 2: Create Communication Goal with new GoalType and Actionable fields
    console.log('👉 TEST 2: Communication Goal with ENGLISH_SPEAKING Type');
    const commGoal = await goalService.createGoal(userA.id, {
      title: 'Executive English Presentation & Fluency',
      growthArea: 'COMMUNICATION',
      type: 'ENGLISH_SPEAKING',
      priority: 'HIGH',
      why: 'Present clearly to international stakeholders.',
      weeklyCommitment: 4,
      firstAction: 'Practice 15 minutes speaking with recording daily',
    });

    assert(commGoal.growthArea === 'COMMUNICATION', 'Communication goal growthArea is COMMUNICATION');
    assert(commGoal.type === 'ENGLISH_SPEAKING', 'Goal type is ENGLISH_SPEAKING');
    assert(commGoal.targetRole === null, 'targetRole is null for Communication goal');
    assert(commGoal.metadata?.weeklyCommitment === 4, 'Weekly commitment saved');

    const commTasks = await prisma.task.findMany({ where: { goalId: commGoal.id } });
    assert(commTasks.length === 1, 'Action task created for communication goal');
    assert(commTasks[0].growthArea === 'COMMUNICATION', 'Task growthArea is COMMUNICATION');
    console.log();

    // TEST 3: Create Health Goal with FITNESS Type
    console.log('👉 TEST 3: Health Goal with FITNESS Type');
    const healthGoal = await goalService.createGoal(userA.id, {
      title: 'Run 5km 3 times per week',
      growthArea: 'HEALTH',
      type: 'FITNESS',
      priority: 'MEDIUM',
      weeklyCommitment: 3,
      firstAction: 'Buy proper running shoes and map 5k route',
    });

    assert(healthGoal.growthArea === 'HEALTH', 'Health goal growthArea is HEALTH');
    assert(healthGoal.type === 'FITNESS', 'Goal type is FITNESS');
    assert(healthGoal.priority === 'MEDIUM', 'Priority is MEDIUM');
    console.log();

    // TEST 4: Create Personal Goal with HABIT Type
    console.log('👉 TEST 4: Personal Goal with PERSONAL Area and HABIT Type');
    const personalGoal = await goalService.createGoal(userA.id, {
      title: 'Read 12 Books on Psychology and Finance',
      growthArea: 'PERSONAL',
      type: 'READING',
      priority: 'MEDIUM',
      weeklyCommitment: 5,
      firstMilestone: 'Finish Thinking Fast and Slow',
      firstAction: 'Read chapter 1 tonight for 20 minutes',
    });

    assert(personalGoal.growthArea === 'PERSONAL', 'Personal goal growthArea is PERSONAL');
    assert(personalGoal.type === 'READING', 'Goal type is READING');
    assert(personalGoal.metadata?.weeklyCommitment === 5, 'Weekly commitment is 5 hrs/week');

    const personalMilestones = await prisma.roadmapMilestone.findMany({
      where: { roadmap: { goalId: personalGoal.id } },
    });
    assert(personalMilestones.length === 1, 'Roadmap milestone created for personal goal');
    assert(personalMilestones[0].title === 'Finish Thinking Fast and Slow', 'Milestone title matches');
    console.log();

    // TEST 5: Goal Listing and Area Filtering
    console.log('👉 TEST 5: Goal Listing across all 4 Growth Areas');
    const allGoals = await goalService.listGoals(userA.id);
    assert(allGoals.length === 4, 'User A has 4 goals total');

    const careerList = await goalService.listGoals(userA.id, { growthArea: 'CAREER' });
    assert(careerList.length === 1 && careerList[0].growthArea === 'CAREER', 'Career filter returns 1 career goal');

    const commList = await goalService.listGoals(userA.id, { growthArea: 'COMMUNICATION' });
    assert(commList.length === 1 && commList[0].growthArea === 'COMMUNICATION', 'Communication filter returns 1 communication goal');

    const healthList = await goalService.listGoals(userA.id, { growthArea: 'HEALTH' });
    assert(healthList.length === 1 && healthList[0].growthArea === 'HEALTH', 'Health filter returns 1 health goal');

    const personalList = await goalService.listGoals(userA.id, { growthArea: 'PERSONAL' });
    assert(personalList.length === 1 && personalList[0].growthArea === 'PERSONAL', 'Personal filter returns 1 personal goal');
    console.log();

    // TEST 6: User Isolation
    console.log('👉 TEST 6: User Isolation across Growth Areas');
    const userBGoals = await goalService.listGoals(userB.id);
    assert(userBGoals.length === 0, 'User B has 0 goals (cannot see User A goals)');

    let caught404 = false;
    try {
      await goalService.getGoalById(userB.id, personalGoal.id);
    } catch (err) {
      if (err.statusCode === 404 || err.message.includes('not found')) {
        caught404 = true;
      }
    }
    assert(caught404, 'User B cannot fetch User A personal goal by ID');
    console.log();

    // TEST 7: Backward Compatibility: Goal without actionable fields
    console.log('👉 TEST 7: Backward Compatibility (Goal without Actionable Fields)');
    const simpleGoal = await goalService.createGoal(userA.id, {
      title: 'Simple Career Objective',
      growthArea: 'CAREER',
      type: 'SKILL_MASTERY',
      priority: 'HIGH',
    });
    assert(simpleGoal.growthArea === 'CAREER', 'Simple goal growthArea is CAREER');
    assert(simpleGoal.type === 'SKILL_MASTERY', 'Simple goal type is SKILL_MASTERY');
    assert(simpleGoal.metadata === null, 'metadata is null when no extra fields provided');
    console.log();

    console.log('=============================================================');
    console.log(`🎉 ALL TESTS PASSED! (${testsPassed} assertions passed, 0 failed)`);
    console.log('=============================================================\n');
  } finally {
    console.log('🧹 Cleaning up test users...');
    if (userA) {
      await prisma.reminder.deleteMany({ where: { userId: userA.id } });
      await prisma.task.deleteMany({ where: { userId: userA.id } });
      await prisma.roadmapMilestone.deleteMany({ where: { userId: userA.id } });
      await prisma.roadmap.deleteMany({ where: { userId: userA.id } });
      await prisma.goal.deleteMany({ where: { userId: userA.id } });
      await prisma.user.delete({ where: { id: userA.id } });
    }
    if (userB) {
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
