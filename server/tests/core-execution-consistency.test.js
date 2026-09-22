const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');
const taskTransitionService = require('../src/services/planning/taskTransition.service');

let server;
let baseUrl;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
  } else {
    console.error(`  ❌ ${message}`);
    throw new Error(`Test assertion failed: ${message}`);
  }
}

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const payload = body ? JSON.stringify(body) : null;
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);

    const req = http.request(url, { method, headers }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => (rawData += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(rawData);
        } catch {
          parsed = rawData;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runConsistencyTests() {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING CORE EXECUTION CONSISTENCY REGRESSION SUITE (TESTS A - H)');
  console.log('=============================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  const createdUserIds = [];

  try {
    const timestamp = Date.now();

    // Helper to register a test user
    async function createTestUser(suffix, name) {
      const email = `consistency_${suffix}_${timestamp}@careeros.local`;
      const regRes = await request('POST', '/api/auth/register', {
        email,
        password: 'Password123!',
        fullName: name,
      });
      assert(regRes.status === 201, `User ${name} registered`);
      const token = regRes.data.data.tokens.accessToken;
      const userId = regRes.data.data.user.id;
      createdUserIds.push(userId);

      // Onboard user
      await request(
        'POST',
        '/api/onboarding/complete',
        {
          situation: 'WORKING_PROFESSIONAL',
          currentRole: 'Software Engineer',
          targetRole: 'Staff Engineer',
          targetSalary: '$180,000',
          experienceLevel: 'SENIOR',
          timezone: 'UTC',
          availableCareerMinutes: 120,
          goals: [{ title: 'Become Staff Engineer', type: 'PROMOTION', priority: 'HIGH' }],
        },
        token
      );

      return { userId, token, email };
    }

    const userA = await createTestUser('userA', 'Alice Engineer');
    const userB = await createTestUser('userB', 'Bob Designer');

    // -------------------------------------------------------------
    // Test A — Standard task completion
    // -------------------------------------------------------------
    console.log('\n[TEST A] Standard task completion flow...');
    const goalResA = await request(
      'POST',
      '/api/goals',
      { title: 'Test A Goal', priority: 'HIGH', type: 'SKILL_MASTERY' },
      userA.token
    );
    const goalAId = goalResA.data.data?.goal?.id || goalResA.data.data?.id;

    const roadmapResA = await request(
      'POST',
      `/api/goals/${goalAId}/roadmap`,
      {
        title: 'Roadmap Test A',
        useTemplate: false,
        milestones: [{ title: 'Milestone A1', sequence: 1 }],
      },
      userA.token
    );
    const roadmapA = roadmapResA.data.data?.roadmap || roadmapResA.data.data;
    const milestoneA1Id = roadmapA.milestones[0].id;

    const taskARes = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task A1',
        estimatedMinutes: 30,
        goalId: goalAId,
        milestoneId: milestoneA1Id,
      },
      userA.token
    );
    const taskAId = taskARes.data.data?.task?.id || taskARes.data.data?.id;

    // Verify initial milestone progress is 0
    let mCheck = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneA1Id } });
    assert(mCheck.progress === 0, 'Milestone A1 initial progress is 0%');

    // Complete Task A1 via standard task status API
    const completeARes = await request(
      'PATCH',
      `/api/tasks/${taskAId}/status`,
      { status: 'COMPLETED' },
      userA.token
    );
    assert(completeARes.status === 200, 'Task A1 completed via PATCH /tasks/:id/status');

    // Verify Task A1
    const taskACheck = await prisma.task.findUnique({ where: { id: taskAId } });
    assert(taskACheck.status === 'COMPLETED', 'Task A1 status is COMPLETED');
    assert(taskACheck.completedAt !== null, 'Task A1 completedAt is set');

    // Verify Milestone progress
    mCheck = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneA1Id } });
    assert(mCheck.progress === 100, `Milestone A1 progress is 100% (actual: ${mCheck.progress}%)`);

    // -------------------------------------------------------------
    // Test B — Focus completion (proves Focus completion no longer bypasses progress)
    // -------------------------------------------------------------
    console.log('\n[TEST B] Focus session completion flow with task completion...');
    const goalResB = await request(
      'POST',
      '/api/goals',
      { title: 'Test B Goal', priority: 'HIGH', type: 'CAREER_CHANGE' },
      userA.token
    );
    const goalBId = goalResB.data.data?.goal?.id || goalResB.data.data?.id;

    const roadmapResB = await request(
      'POST',
      `/api/goals/${goalBId}/roadmap`,
      {
        title: 'Roadmap Test B',
        useTemplate: false,
        milestones: [{ title: 'Milestone B1', sequence: 1 }],
      },
      userA.token
    );
    const roadmapB = roadmapResB.data.data?.roadmap || roadmapResB.data.data;
    const milestoneB1Id = roadmapB.milestones[0].id;

    const taskBRes = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task B1',
        estimatedMinutes: 25,
        goalId: goalBId,
        milestoneId: milestoneB1Id,
      },
      userA.token
    );
    const taskBId = taskBRes.data.data?.task?.id || taskBRes.data.data?.id;

    // Start focus session linked to Task B1
    const focusStartB = await request(
      'POST',
      '/api/focus/start',
      { taskId: taskBId, plannedMinutes: 25 },
      userA.token
    );
    assert(focusStartB.status === 201, 'Focus session started for Task B1');
    const sessionBId = focusStartB.data.data?.id || focusStartB.data.data?.session?.id;

    // Finish focus session with taskOutcome COMPLETED
    const focusFinishB = await request(
      'POST',
      `/api/focus/${sessionBId}/finish`,
      { taskOutcome: 'COMPLETED', notes: 'Done with deep focus' },
      userA.token
    );
    assert(focusFinishB.status === 200, 'Focus session finished with taskOutcome COMPLETED');

    // Verify Task B1
    const taskBCheck = await prisma.task.findUnique({ where: { id: taskBId } });
    assert(taskBCheck.status === 'COMPLETED', 'Task B1 status is COMPLETED');
    assert(taskBCheck.completedAt !== null, 'Task B1 completedAt is set');

    // Verify Milestone B1 progress
    const mBCheck = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneB1Id } });
    assert(mBCheck.progress === 100, `Milestone B1 progress reflects focus task completion: ${mBCheck.progress}%`);

    // -------------------------------------------------------------
    // Test C — Multiple tasks (3 completed normally, 4th completed via Focus Session)
    // -------------------------------------------------------------
    console.log('\n[TEST C] Multiple tasks progress progression (3 normal + 1 focus)...');
    const goalResC = await request(
      'POST',
      '/api/goals',
      { title: 'Test C Goal', priority: 'MEDIUM', type: 'PORTFOLIO' },
      userA.token
    );
    const goalCId = goalResC.data.data?.goal?.id || goalResC.data.data?.id;

    const roadmapResC = await request(
      'POST',
      `/api/goals/${goalCId}/roadmap`,
      {
        title: 'Roadmap Test C',
        useTemplate: false,
        milestones: [{ title: 'Milestone C1 (4 Tasks)', sequence: 1 }],
      },
      userA.token
    );
    const roadmapC = roadmapResC.data.data?.roadmap || roadmapResC.data.data;
    const milestoneC1Id = roadmapC.milestones[0].id;

    // Create 4 tasks under Milestone C1
    const taskIdsC = [];
    for (let i = 1; i <= 4; i++) {
      const tRes = await request(
        'POST',
        '/api/tasks',
        {
          title: `Task C${i}`,
          estimatedMinutes: 20,
          goalId: goalCId,
          milestoneId: milestoneC1Id,
        },
        userA.token
      );
      taskIdsC.push(tRes.data.data?.task?.id || tRes.data.data?.id);
    }

    // Complete first 3 tasks via standard task API
    for (let i = 0; i < 3; i++) {
      await request(
        'PATCH',
        `/api/tasks/${taskIdsC[i]}/status`,
        { status: 'COMPLETED' },
        userA.token
      );
    }

    // Expect progress = 75%
    let mCCheck = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneC1Id } });
    assert(mCCheck.progress === 75, `Milestone C1 progress is 75% after 3 of 4 tasks completed (actual: ${mCCheck.progress}%)`);

    // Complete 4th task via Focus Session
    const focusStartC = await request(
      'POST',
      '/api/focus/start',
      { taskId: taskIdsC[3], plannedMinutes: 20 },
      userA.token
    );
    const sessionCId = focusStartC.data.data?.id || focusStartC.data.data?.session?.id;

    await request(
      'POST',
      `/api/focus/${sessionCId}/finish`,
      { taskOutcome: 'COMPLETED' },
      userA.token
    );

    // Expect progress = 100%
    mCCheck = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneC1Id } });
    assert(mCCheck.progress === 100, `Milestone C1 progress reached 100% after 4th task finished in Focus Session (actual: ${mCCheck.progress}%)`);

    // -------------------------------------------------------------
    // Test D — Do NOT auto-complete milestone
    // -------------------------------------------------------------
    console.log('\n[TEST D] Verifying milestone is NOT auto-completed at 100% task progress...');
    assert(
      mCCheck.status !== 'COMPLETED',
      `Milestone C1 status is '${mCCheck.status}', strictly NOT auto-completed (awaits user confirmation)`
    );

    // Also check that roadmap and goal progress remain 0 until milestone is explicitly completed
    const roadmapCCheck = await prisma.roadmap.findUnique({ where: { id: roadmapC.id } });
    const goalCCheck = await prisma.goal.findUnique({ where: { id: goalCId } });
    assert(roadmapCCheck.progress === 0, `Roadmap progress is ${roadmapCCheck.progress}% (does not increment before explicit milestone completion)`);
    assert(goalCCheck.progress === 0, `Goal progress is ${goalCCheck.progress}% (does not increment before explicit milestone completion)`);

    // -------------------------------------------------------------
    // Test E — Explicit milestone completion & downstream propagation
    // -------------------------------------------------------------
    console.log('\n[TEST E] Explicit milestone completion and Roadmap/Goal progress propagation...');
    const completeMRes = await request(
      'PATCH',
      `/api/milestones/${milestoneC1Id}/status`,
      { status: 'COMPLETED' },
      userA.token
    );
    assert(completeMRes.status === 200, 'Milestone C1 explicitly set to COMPLETED via API');

    const mAfterExplicit = await prisma.roadmapMilestone.findUnique({ where: { id: milestoneC1Id } });
    assert(mAfterExplicit.status === 'COMPLETED', 'Milestone C1 status is now COMPLETED');

    // Verify propagation to Roadmap and Goal
    const roadmapAfter = await prisma.roadmap.findUnique({ where: { id: roadmapC.id } });
    const goalAfter = await prisma.goal.findUnique({ where: { id: goalCId } });
    assert(roadmapAfter.progress === 100, `Roadmap progress propagated to 100% (actual: ${roadmapAfter.progress}%)`);
    assert(goalAfter.progress === 100, `Goal progress propagated to 100% (actual: ${goalAfter.progress}%)`);

    // -------------------------------------------------------------
    // Test F — Reminder cleanup on task completion (Normal + Focus)
    // -------------------------------------------------------------
    console.log('\n[TEST F] Reminder cancellation consistency across completion paths...');
    // Create Task F1 with pending reminder
    const taskF1Res = await request(
      'POST',
      '/api/tasks',
      { title: 'Task F1', estimatedMinutes: 15, goalId: goalAId },
      userA.token
    );
    const taskF1Id = taskF1Res.data.data?.task?.id || taskF1Res.data.data?.id;

    const reminderF1 = await prisma.reminder.create({
      data: {
        userId: userA.userId,
        linkedTaskId: taskF1Id,
        title: 'Reminder for Task F1',
        time: '18:00',
        status: 'PENDING',
        enabled: true,
      },
    });

    // Complete Task F1 normally
    await request('PATCH', `/api/tasks/${taskF1Id}/status`, { status: 'COMPLETED' }, userA.token);

    const reminderF1Check = await prisma.reminder.findUnique({ where: { id: reminderF1.id } });
    assert(
      reminderF1Check.status === 'CANCELLED' && reminderF1Check.enabled === false,
      'Pending reminder cancelled on normal task completion'
    );

    // Create Task F2 with snoozed reminder
    const taskF2Res = await request(
      'POST',
      '/api/tasks',
      { title: 'Task F2', estimatedMinutes: 25, goalId: goalAId },
      userA.token
    );
    const taskF2Id = taskF2Res.data.data?.task?.id || taskF2Res.data.data?.id;

    const reminderF2 = await prisma.reminder.create({
      data: {
        userId: userA.userId,
        linkedTaskId: taskF2Id,
        title: 'Reminder for Task F2',
        time: '19:00',
        status: 'SNOOZED',
        enabled: true,
      },
    });

    // Complete Task F2 via Focus Session
    const focusStartF = await request(
      'POST',
      '/api/focus/start',
      { taskId: taskF2Id, plannedMinutes: 25 },
      userA.token
    );
    const sessionFId = focusStartF.data.data?.id || focusStartF.data.data?.session?.id;

    await request('POST', `/api/focus/${sessionFId}/finish`, { taskOutcome: 'COMPLETED' }, userA.token);

    const reminderF2Check = await prisma.reminder.findUnique({ where: { id: reminderF2.id } });
    assert(
      reminderF2Check.status === 'CANCELLED' && reminderF2Check.enabled === false,
      'Snoozed reminder cancelled on Focus Session task completion'
    );

    // -------------------------------------------------------------
    // Test G — User isolation
    // -------------------------------------------------------------
    console.log('\n[TEST G] User isolation enforcement across transition paths...');
    // User B tries to update User A's task status
    const crossUpdateRes = await request(
      'PATCH',
      `/api/tasks/${taskAId}/status`,
      { status: 'TODO' },
      userB.token
    );
    assert(
      crossUpdateRes.status === 404,
      `Cross-user task update rejected with 404 (status: ${crossUpdateRes.status})`
    );

    // User B tries to start a focus session on User A's task
    const crossFocusStart = await request(
      'POST',
      '/api/focus/start',
      { taskId: taskAId, plannedMinutes: 25 },
      userB.token
    );
    assert(
      crossFocusStart.status === 404,
      `Cross-user focus start on task rejected with 404 (status: ${crossFocusStart.status})`
    );

    // Direct service isolation check
    let directErrorCaught = false;
    try {
      await taskTransitionService.transitionTaskStatus(userB.userId, taskAId, 'TODO');
    } catch (err) {
      directErrorCaught = true;
      assert(err.statusCode === 404, 'Direct taskTransitionService cross-user call throws 404');
    }
    assert(directErrorCaught, 'Direct taskTransitionService rejected cross-user task access');

    // -------------------------------------------------------------
    // Test H — Transaction failure / atomic rollback
    // -------------------------------------------------------------
    console.log('\n[TEST H] Transaction atomicity and rollback safety...');
    // Create task for atomicity test
    const taskH = await prisma.task.create({
      data: {
        userId: userA.userId,
        title: 'Task H Atomicity',
        status: 'TODO',
      },
    });

    let rollbackSucceeded = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Complete the task inside transaction
        await taskTransitionService.transitionTaskStatus(userA.userId, taskH.id, 'COMPLETED', { tx });

        // Force an intentional error to trigger rollback
        throw new Error('INTENTIONAL_TRANSACTION_FAILURE');
      });
    } catch (err) {
      if (err.message === 'INTENTIONAL_TRANSACTION_FAILURE') {
        rollbackSucceeded = true;
      }
    }
    assert(rollbackSucceeded, 'Transaction threw intentional error as expected');

    // Verify task status rolled back to TODO and completedAt is null
    const taskHAfterRollback = await prisma.task.findUnique({ where: { id: taskH.id } });
    assert(taskHAfterRollback.status === 'TODO', 'Task status rolled back to TODO after transaction failure');
    assert(taskHAfterRollback.completedAt === null, 'Task completedAt rolled back to null');

    console.log('\n=============================================================');
    console.log('🏆 ALL CORE EXECUTION CONSISTENCY REGRESSION TESTS PASSED! (A - H)');
    console.log('=============================================================\n');
  } finally {
    if (server) server.close();
    // Cleanup created test users
    for (const uId of createdUserIds) {
      try {
        await prisma.reminder.deleteMany({ where: { userId: uId } });
        await prisma.focusSession.deleteMany({ where: { userId: uId } });
        await prisma.task.deleteMany({ where: { userId: uId } });
        await prisma.roadmapMilestone.deleteMany({ where: { userId: uId } });
        await prisma.roadmap.deleteMany({ where: { userId: uId } });
        await prisma.goal.deleteMany({ where: { userId: uId } });
        await prisma.userProfile.deleteMany({ where: { userId: uId } });
        await prisma.user.delete({ where: { id: uId } });
      } catch (cleanupErr) {
        // ignore cleanup errors
      }
    }
    await prisma.$disconnect();
  }
}

runConsistencyTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Consistency test failure:', err);
    process.exit(1);
  });
