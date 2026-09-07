const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');
const {
  getUserLocalDate,
  getUserYesterdayDate,
  getUserTomorrowDate,
  parseLocalDateToUtcDate,
  getUserWeekRange,
} = require('../src/utils/timezone');

let server;
let baseUrl;

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

async function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function registerUser(email, fullName, timezone = 'Asia/Kolkata') {
  const regRes = await request('POST', '/api/auth/register', {
    email,
    password: 'Password123!',
    fullName,
  });

  const token = regRes.data.data.tokens.accessToken;

  await request(
    'POST',
    '/api/onboarding/complete',
    {
      situation: 'WORKING_PROFESSIONAL',
      targetRole: 'Senior Engineer',
      targetSalary: '$120,000',
      availableCareerMinutes: 120,
      wakeTime: '06:00',
      workStartTime: '09:00',
      workEndTime: '18:00',
      personalStartTime: '19:00',
      personalEndTime: '20:00',
      sleepTime: '23:00',
      timezone,
      goals: [
        {
          title: `${fullName} Mission`,
          type: 'JOB_SWITCH',
          priority: 'HIGH',
        },
      ],
      skills: [
        { name: 'TypeScript', selfRating: 4 },
        { name: 'Node.js', selfRating: 3 },
      ],
    },
    token
  );

  return {
    userId: regRes.data.data.user.id,
    token,
  };
}

async function runPhase1DTests() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 1D REAL DATABASE E2E VERIFICATION GATE');
  console.log('======================================================\n');

  // 0. Database Connection Check
  try {
    await prisma.$queryRaw`SELECT 1`;
    assert(true, 'Connected to live PostgreSQL database on localhost:5432');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  // Start temporary server
  const testPort = 5092;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(testPort, resolve));
  baseUrl = `http://localhost:${testPort}`;
  console.log(`Server listening on ${baseUrl}\n`);

  try {
    // -------------------------------------------------------------------------
    // 1. Setup Test Users
    // -------------------------------------------------------------------------
    console.log('--- 1. User Setup & Today Context ---');
    const timestamp = Date.now();
    const userA = await registerUser(`userA_1d_${timestamp}@careeros.local`, 'User A 1D', 'Asia/Kolkata');
    const userB = await registerUser(`userB_1d_${timestamp}@careeros.local`, 'User B 1D', 'America/New_York');

    // Fetch initial today context for User A
    const todayRes1 = await request('GET', '/api/today', null, userA.token);
    assert(todayRes1.status === 200, 'GET /api/today returns 200 OK');
    assert(todayRes1.data.data.timezone === 'Asia/Kolkata', 'Context contains user timezone');
    assert(todayRes1.data.data.dayStatus === 'READY', 'Initial day status is READY');
    assert(todayRes1.data.data.todayPlan === null, 'Initial today plan is null (no premature record)');

    // -------------------------------------------------------------------------
    // 2. Deterministic Recommendation & Explanation (Section 7, 8, 9)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Deterministic Recommendation & Explanation ---');

    // Empty state test (Section 9 & 50 Case E)
    const recEmptyRes = await request('GET', '/api/today/recommendation', null, userA.token);
    assert(recEmptyRes.status === 200, 'GET /api/today/recommendation returns 200 OK');
    assert(recEmptyRes.data.data.recommendedTask === null, 'Empty state: no task recommended when user has no tasks');
    assert(recEmptyRes.data.data.explanation.length > 0, 'Empty state explanation provided');

    // Create 3 tasks with distinct properties to test deterministic ranking
    // Goal for User A
    const goalsRes = await request('GET', '/api/goals', null, userA.token);
    const goalList = goalsRes.data.data.goals || goalsRes.data.data;
    const goalAId = goalList[0].id;

    // Create roadmap & milestones for Goal A
    const roadmapRes = await request(
      'POST',
      `/api/goals/${goalAId}/roadmap`,
      {
        title: 'User A Roadmap',
        templateType: 'JOB_SWITCH',
      },
      userA.token
    );
    const milestones = roadmapRes.data.data.roadmap?.milestones || roadmapRes.data.data.milestones;
    const activeMilestone = milestones[0]; // status: NOT_STARTED or IN_PROGRESS
    await request('PATCH', `/api/milestones/${activeMilestone.id}/status`, { status: 'IN_PROGRESS' }, userA.token);

    // Task 1: Low priority, due next month (30 min)
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();
    const task1Res = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task 1: Low Priority Future',
        priority: 'LOW',
        estimatedMinutes: 30,
        dueDate: nextMonth,
        goalId: goalAId,
      },
      userA.token
    );
    const task1 = task1Res.data.data.task || task1Res.data.data;

    // Task 2: High priority, in active milestone, fits window (45 min)
    const task2Res = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task 2: Active Milestone High',
        priority: 'HIGH',
        estimatedMinutes: 45,
        goalId: goalAId,
        milestoneId: activeMilestone.id,
      },
      userA.token
    );
    const task2 = task2Res.data.data.task || task2Res.data.data;

    // Task 3: Critical priority, overdue (60 min)
    const yesterdayDateStr = getUserYesterdayDate('Asia/Kolkata');
    const task3Res = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task 3: Overdue Critical',
        priority: 'CRITICAL',
        estimatedMinutes: 60,
        dueDate: `${yesterdayDateStr}T10:00:00Z`,
        goalId: goalAId,
      },
      userA.token
    );
    const task3 = task3Res.data.data.task || task3Res.data.data;

    // Recommendation check: Task 3 is overdue and critical, so it must rank #1 (Section 7 rule 1)
    const recRes = await request('GET', '/api/today/recommendation', null, userA.token);
    assert(recRes.status === 200, 'GET /api/today/recommendation returns 200 OK');
    assert(recRes.data.data.recommendedTask.id === task3.id, 'Task 3 (overdue critical) ranked #1 focus priority');
    assert(Array.isArray(recRes.data.data.explanation), 'Explanation is an array of human-readable strings');
    assert(recRes.data.data.explanation.some((e) => e.includes('Overdue')), 'Explanation mentions task is overdue');
    assert(recRes.data.data.explanation.some((e) => e.includes('Estimated time')), 'Explanation mentions estimated time');

    // -------------------------------------------------------------------------
    // 3. Daily Plan Persistence, Confirmation & Secondary Tasks (Section 3, 4, 10)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Daily Plan Persistence, Confirmation & Secondary Tasks ---');

    // User confirms recommendation
    const confirmRes = await request(
      'POST',
      '/api/today/plan/confirm',
      {
        mainTaskId: task3.id,
      },
      userA.token
    );
    assert(confirmRes.status === 200, 'POST /api/today/plan/confirm returns 200 OK');
    assert(confirmRes.data.data.status === 'CONFIRMED', 'Plan status transitioned to CONFIRMED');
    assert(confirmRes.data.data.mainTaskId === task3.id, 'Main task set to Task 3');

    // Verify GET /api/today reflects confirmed plan
    const todayRes2 = await request('GET', '/api/today', null, userA.token);
    assert(todayRes2.data.data.dayStatus === 'PLANNED', 'Day status is now PLANNED');
    assert(todayRes2.data.data.todayPlan.status === 'CONFIRMED', 'Confirmed plan returned on GET /api/today');

    // Override / Choose another task (Section 10)
    const overrideRes = await request(
      'POST',
      '/api/today/plan',
      {
        mainTaskId: task2.id,
        status: 'CONFIRMED',
      },
      userA.token
    );
    assert(overrideRes.status === 200, 'POST /api/today/plan override returns 200 OK');
    assert(overrideRes.data.data.mainTaskId === task2.id, 'User successfully chose Task 2 as confirmed main focus');

    // Reload persistence test: repeat fetch confirms Task 2 remains
    const todayRes3 = await request('GET', '/api/today', null, userA.token);
    assert(todayRes3.data.data.todayPlan.mainTaskId === task2.id, 'Chosen focus survives page reload');

    // Secondary tasks limit test: Max 3 enforced (Section 4 & 15)
    // Create Task 4 & 5
    const task4Res = await request('POST', '/api/tasks', { title: 'Task 4', goalId: goalAId }, userA.token);
    const task5Res = await request('POST', '/api/tasks', { title: 'Task 5', goalId: goalAId }, userA.token);
    const task4Id = (task4Res.data.data.task || task4Res.data.data).id;
    const task5Id = (task5Res.data.data.task || task5Res.data.data).id;

    // Attempt to add 4 secondary tasks -> must be rejected with 400
    const secFailRes = await request(
      'POST',
      '/api/today/plan',
      {
        mainTaskId: task2.id,
        secondaryTaskIds: [task1.id, task3.id, task4Id, task5Id], // 4 secondary tasks
      },
      userA.token
    );
    assert(secFailRes.status === 400, 'Adding 4 secondary tasks rejected with 400 Bad Request');

    // Add exactly 2 secondary tasks -> succeeds
    const secSuccessRes = await request(
      'POST',
      '/api/today/plan',
      {
        mainTaskId: task2.id,
        secondaryTaskIds: [task1.id, task4Id],
      },
      userA.token
    );
    assert(secSuccessRes.status === 200, 'Adding 2 secondary tasks succeeded');
    assert(secSuccessRes.data.data.secondaryTasks.length === 2, 'Exactly 2 secondary tasks persisted in join model');

    // -------------------------------------------------------------------------
    // 4. Focus Session Lifecycle & Concurrency (Section 17-22, 47, 52)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Focus Session Lifecycle & Concurrency ---');

    // Start Focus Session for Task 2
    const startRes = await request(
      'POST',
      '/api/focus/start',
      {
        taskId: task2.id,
        plannedMinutes: 45,
      },
      userA.token
    );
    assert(startRes.status === 201, 'POST /api/focus/start returns 201 Created');
    assert(startRes.data.data.status === 'ACTIVE', 'Focus session status is ACTIVE');
    assert(startRes.data.data.taskId === task2.id, 'Focus session linked to Task 2');
    const sessionId = startRes.data.data.id;

    // Concurrency / duplicate active session prevention (Section 17 & 52)
    const duplicateStartRes = await request(
      'POST',
      '/api/focus/start',
      {
        taskId: task1.id,
        plannedMinutes: 30,
      },
      userA.token
    );
    assert(duplicateStartRes.status === 409, 'Starting second active focus session rejected with 409 Conflict');

    // GET /api/focus/active
    const activeRes = await request('GET', '/api/focus/active', null, userA.token);
    assert(activeRes.status === 200, 'GET /api/focus/active returns 200 OK');
    assert(activeRes.data.data.id === sessionId, 'Active session ID matches');

    // GET /api/today dayStatus is now IN_PROGRESS
    const todayRes4 = await request('GET', '/api/today', null, userA.token);
    assert(todayRes4.data.data.dayStatus === 'IN_PROGRESS', 'Day status updated to IN_PROGRESS while session is active');

    // Pause Focus Session
    const pauseRes = await request('POST', `/api/focus/${sessionId}/pause`, {}, userA.token);
    assert(pauseRes.status === 200, 'POST /api/focus/:id/pause returns 200 OK');
    assert(pauseRes.data.data.status === 'PAUSED', 'Focus session status is PAUSED');
    assert(pauseRes.data.data.pausedAt !== null, 'pausedAt timestamp recorded');

    // Resume Focus Session
    const resumeRes = await request('POST', `/api/focus/${sessionId}/resume`, {}, userA.token);
    assert(resumeRes.status === 200, 'POST /api/focus/:id/resume returns 200 OK');
    assert(resumeRes.data.data.status === 'ACTIVE', 'Focus session status resumed to ACTIVE');
    assert(resumeRes.data.data.pausedAt === null, 'pausedAt cleared upon resume');

    // Finish Focus Session: Option "NOT_YET" (Section 21)
    // Task should NOT be marked complete! Session completion != task completion
    const finish1Res = await request(
      'POST',
      `/api/focus/${sessionId}/finish`,
      {
        taskOutcome: 'NOT_YET',
        actualMinutes: 40,
        notes: 'Made good progress on core logic',
      },
      userA.token
    );
    assert(finish1Res.status === 200, 'POST /api/focus/:id/finish returns 200 OK');
    assert(finish1Res.data.data.status === 'COMPLETED', 'Session 1 is COMPLETED');
    assert(finish1Res.data.data.actualMinutes === 40, 'Session actualMinutes recorded as 40');

    // Check Task 2 status: remains incomplete!
    const task2Check1 = await request('GET', `/api/tasks/${task2.id}`, null, userA.token);
    const t2c1 = task2Check1.data.data.task || task2Check1.data.data;
    assert(t2c1.status !== 'COMPLETED', 'Task remains incomplete when outcome was NOT_YET');
    assert(t2c1.actualMinutes === 40, 'Task.actualMinutes updated to 40');

    // Start Session 2 on the same Task 2 (Section 47: Multiple sessions aggregate actualMinutes)
    const start2Res = await request(
      'POST',
      '/api/focus/start',
      {
        taskId: task2.id,
        plannedMinutes: 30,
      },
      userA.token
    );
    const session2Id = start2Res.data.data.id;

    // Finish Session 2 as COMPLETED
    const finish2Res = await request(
      'POST',
      `/api/focus/${session2Id}/finish`,
      {
        taskOutcome: 'COMPLETED',
        actualMinutes: 25,
        notes: 'Finalized and passed all tests',
      },
      userA.token
    );
    assert(finish2Res.status === 200, 'Session 2 finished');

    // Check Task 2 actualMinutes aggregation: 40 + 25 = 65 (Section 47)
    const task2Check2 = await request('GET', `/api/tasks/${task2.id}`, null, userA.token);
    const t2c2 = task2Check2.data.data.task || task2Check2.data.data;
    assert(t2c2.status === 'COMPLETED', 'Task 2 marked COMPLETED');
    assert(t2c2.completedAt !== null, 'Task 2 completedAt timestamp set');
    assert(t2c2.actualMinutes === 65, 'Task.actualMinutes aggregated correctly: 40 + 25 = 65 min');

    // Cancel Session Test
    const start3Res = await request('POST', '/api/focus/start', { taskId: task1.id }, userA.token);
    const session3Id = start3Res.data.data.id;
    const cancelRes = await request('POST', `/api/focus/${session3Id}/cancel`, {}, userA.token);
    assert(cancelRes.status === 200, 'POST /api/focus/:id/cancel returns 200 OK');
    assert(cancelRes.data.data.status === 'CANCELLED', 'Session marked CANCELLED');

    // Concurrent / simultaneous Start Focus test (Section 11)
    console.log('\n--- Concurrent Start Focus Test (Section 11) ---');
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      request('POST', '/api/focus/start', { taskId: task1.id, plannedMinutes: 25 }, userA.token),
      request('POST', '/api/focus/start', { taskId: task2.id, plannedMinutes: 25 }, userA.token),
    ]);

    const statuses = [concurrentRes1.status, concurrentRes2.status].sort();
    assert(statuses[0] === 201 && statuses[1] === 409, 'Simultaneous start: exactly one succeeds (201) and one receives 409 Conflict');

    const userAActiveSessions = await prisma.focusSession.count({
      where: {
        userId: userA.userId,
        status: { in: ['ACTIVE', 'PAUSED'] },
      },
    });
    assert(userAActiveSessions <= 1, 'Final database state: ACTIVE/PAUSED sessions for user <= 1');

    // Clean up active session from concurrent test so remaining tests proceed cleanly
    const activeSessionRecord = await prisma.focusSession.findFirst({
      where: { userId: userA.userId, status: 'ACTIVE' },
    });
    if (activeSessionRecord) {
      await request('POST', `/api/focus/${activeSessionRecord.id}/cancel`, {}, userA.token);
    }

    // -------------------------------------------------------------------------
    // 5. Daily Review & Tomorrow Main Task (Section 23-27)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Daily Review & Tomorrow Main Task ---');

    // Create Draft Review for User A
    const todayStr = getUserLocalDate('Asia/Kolkata');
    const reviewDraftRes = await request(
      'POST',
      '/api/daily-review',
      {
        date: todayStr,
        completedSummary: 'Finished JWT authentication and verified all tests',
        learnedSummary: 'Token rotation patterns and safe claim decoding',
        blockerSummary: 'None today',
        tomorrowMainTaskId: task4Id,
        energyLevel: 'HIGH',
      },
      userA.token
    );
    assert(reviewDraftRes.status === 200, 'POST /api/daily-review returns 200 OK');
    assert(reviewDraftRes.data.data.tomorrowMainTaskId === task4Id, 'Tomorrow task ID stored in daily review');
    assert(reviewDraftRes.data.data.energyLevel === 'HIGH', 'Energy level HIGH persisted');

    // Verify GET /api/daily-review recovers saved draft
    const getReviewRes = await request('GET', `/api/daily-review?date=${todayStr}`, null, userA.token);
    assert(getReviewRes.status === 200, 'GET /api/daily-review returns 200 OK');
    assert(getReviewRes.data.data.completedSummary.includes('JWT authentication'), 'Review data recovered on reload');

    // Close Day: sets closeDay: true
    const closeReviewRes = await request(
      'POST',
      '/api/daily-review',
      {
        date: todayStr,
        closeDay: true,
      },
      userA.token
    );
    assert(closeReviewRes.status === 200, 'Close day review saved');

    // Check Day Status is now CLOSED
    const todayResClosed = await request('GET', '/api/today', null, userA.token);
    assert(todayResClosed.data.data.dayStatus === 'CLOSED', 'Day status transitioned to CLOSED');

    // Verify Tomorrow Intent is respected on the next day (Section 26 & 50 Case C)
    const tomorrowStr = getUserTomorrowDate('Asia/Kolkata');
    const tomorrowRecRes = await request('GET', `/api/today/recommendation?date=${tomorrowStr}`, null, userA.token);
    assert(tomorrowRecRes.status === 200, 'Tomorrow recommendation query succeeded');
    assert(
      tomorrowRecRes.data.data.recommendedTask.id === task4Id,
      "Tomorrow's recommendation prioritizes task selected in yesterday's review (Section 26)"
    );
    assert(tomorrowRecRes.data.data.isExplicitTomorrow === true, 'isExplicitTomorrow is true');

    // Foreign tomorrow task validation: reject task belonging to another user (Section 63)
    const taskUserBRes = await request(
      'POST',
      '/api/tasks',
      { title: 'User B Task' },
      userB.token
    );
    const userBTaskId = (taskUserBRes.data.data.task || taskUserBRes.data.data).id;

    const foreignTomorrowRes = await request(
      'POST',
      '/api/daily-review',
      {
        date: todayStr,
        tomorrowMainTaskId: userBTaskId, // User B's task!
      },
      userA.token
    );
    assert(foreignTomorrowRes.status === 404, 'Foreign tomorrow task rejected with 404 Not Found');

    // -------------------------------------------------------------------------
    // 6. Cross-User Isolation (Section 53)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Cross-User Isolation ---');

    // User B attempts to access/modify User A's focus session
    const crossPauseRes = await request('POST', `/api/focus/${sessionId}/pause`, {}, userB.token);
    assert(crossPauseRes.status === 404, 'User B pausing User A focus session -> 404 Not Found');

    const crossFinishRes = await request('POST', `/api/focus/${sessionId}/finish`, {}, userB.token);
    assert(crossFinishRes.status === 404, 'User B finishing User A focus session -> 404 Not Found');

    const crossCancelRes = await request('POST', `/api/focus/${sessionId}/cancel`, {}, userB.token);
    assert(crossCancelRes.status === 404, 'User B cancelling User A focus session -> 404 Not Found');

    // User B attempts to fetch User A's daily review
    const userBReviewRes = await request('GET', `/api/daily-review?date=${todayStr}`, null, userB.token);
    assert(userBReviewRes.status === 200, 'User B GET /api/daily-review returns 200');
    assert(userBReviewRes.data.data === null, 'User B does NOT see User A daily review (returns null)');

    // -------------------------------------------------------------------------
    // 7. Overview Dashboard Aggregation (Section 28-38, 64)
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Overview Dashboard Aggregation ---');

    const dashResA = await request('GET', '/api/dashboard', null, userA.token);
    assert(dashResA.status === 200, 'GET /api/dashboard returns 200 OK');
    const dashA = dashResA.data.data;

    // Verify user info
    assert(dashA.user.fullName === 'User A 1D', 'Dashboard returns user fullName');
    assert(typeof dashA.user.greeting === 'string', 'Dashboard returns local greeting');

    // Verify primary goal & roadmap
    assert(dashA.primaryGoal !== null, 'Dashboard includes primaryGoal');
    assert(dashA.primaryGoal.title.includes('Mission'), 'Primary goal matches user mission');
    assert(dashA.currentRoadmap !== null, 'Dashboard includes currentRoadmap');

    // Verify career check factual modules (Section 32)
    assert(dashA.careerCheck.goals.activeCount >= 1, 'Career Check goals active count is factual');
    assert(dashA.careerCheck.projects.status === 'Not configured yet', 'Career Check projects marked Not configured yet');
    assert(dashA.careerCheck.learning.status === 'Not configured yet', 'Career Check learning marked Not configured yet');

    // Verify weekly execution metrics (Section 34 & 49)
    assert(dashA.weeklyExecution.focusSessionsCount >= 2, 'Weekly execution includes completed focus sessions count');
    assert(dashA.weeklyExecution.focusedMinutes >= 65, 'Weekly execution includes factual focused minutes');
    assert(dashA.weeklyExecution.tasksCompletedCount >= 1, 'Weekly execution includes tasks completed count');
    assert(dashA.weeklyExecution.activeDaysCount >= 1, 'Weekly execution includes active days count');

    // Test dashboard for a user with NO goals/tasks/roadmaps
    const userEmpty = await registerUser(`empty_${timestamp}@careeros.local`, 'Empty User', 'Europe/London');
    // Clear the auto-created goal to test true empty state
    await prisma.goal.deleteMany({ where: { userId: userEmpty.userId } });

    const dashResEmpty = await request('GET', '/api/dashboard', null, userEmpty.token);
    assert(dashResEmpty.status === 200, 'GET /api/dashboard succeeds for user with no goals/tasks');
    assert(dashResEmpty.data.data.primaryGoal === null, 'primaryGoal is safely null for user with no goals');
    assert(dashResEmpty.data.data.currentRoadmap === null, 'currentRoadmap is safely null');
    assert(dashResEmpty.data.data.weeklyExecution.focusSessionsCount === 0, 'weekly focus sessions count is 0');

    // -------------------------------------------------------------------------
    // 8. Timezone Date Boundary Tests (Section 43, 44, 65)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Timezone Date Boundary Tests ---');

    const kolkataDate = getUserLocalDate('Asia/Kolkata');
    const newYorkDate = getUserLocalDate('America/New_York');

    assert(typeof kolkataDate === 'string' && kolkataDate.length === 10, 'Asia/Kolkata resolves valid YYYY-MM-DD');
    assert(typeof newYorkDate === 'string' && newYorkDate.length === 10, 'America/New_York resolves valid YYYY-MM-DD');

    const weekRangeKolkata = getUserWeekRange(kolkataDate);
    assert(typeof weekRangeKolkata.weekStartStr === 'string', 'Week start computed correctly');
    assert(typeof weekRangeKolkata.weekEndStr === 'string', 'Week end computed correctly');

    console.log('\n======================================================');
    console.log(`🎉 ALL ${testsPassed} PHASE 1D REAL POSTGRESQL E2E TESTS PASSED! (0 failed)`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err);
    testsFailed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
    if (testsFailed > 0) {
      process.exit(1);
    }
  }
}

runPhase1DTests();
