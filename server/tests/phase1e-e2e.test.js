const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');

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

    req.on('error', (err) => {
      reject(err);
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function registerAndLogin(email, password, fullName = 'Test User', timezone = 'Asia/Kolkata') {
  const regRes = await request('POST', '/api/auth/register', {
    email,
    password,
    fullName,
  });
  if (regRes.status !== 201) {
    throw new Error(`Registration failed for ${email}: ${JSON.stringify(regRes.data)}`);
  }

  const token = regRes.data.data.tokens.accessToken;

  // Complete onboarding to set timezone and profile
  await request(
    'POST',
    '/api/onboarding/complete',
    {
      situation: 'WORKING_PROFESSIONAL',
      targetRole: 'Senior Engineer',
      targetSalary: '$120,000',
      availableCareerMinutes: 120,
      confidenceScore: 3,
      timezone,
    },
    token
  );

  return {
    user: regRes.data.data.user,
    token,
  };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🚀 CAREEROS PHASE 1E REAL POSTGRESQL E2E VERIFICATION SUITE');
  console.log('=============================================================\n');

  // Start HTTP Server
  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running on port ${port}\n`);
      resolve();
    });
  });

  const timestamp = Date.now();
  const userAEmail = `phase1e_user_a_${timestamp}@careeros.test`;
  const userBEmail = `phase1e_user_b_${timestamp}@careeros.test`;

  let userA, tokenA;
  let userB, tokenB;

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: SETUP & ONBOARDING FOR TEST USERS
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: SETUP & ONBOARDING ---');
    const authA = await registerAndLogin(userAEmail, 'Password123!', 'Alice Engineer');
    userA = authA.user;
    tokenA = authA.token;
    assert(tokenA && userA.id, 'User A registered and authenticated');

    const authB = await registerAndLogin(userBEmail, 'Password123!', 'Bob Security');
    userB = authB.user;
    tokenB = authB.token;
    assert(tokenB && userB.id, 'User B registered and authenticated');

    // Create Goal & Milestone for User A
    const goalResA = await request(
      'POST',
      '/api/goals',
      {
        title: 'Senior Distributed Systems Engineer',
        type: 'CAREER_CHANGE',
        priority: 'HIGH',
        targetDate: '2027-01-01',
      },
      tokenA
    );
    assert(goalResA.status === 201, 'User A created primary goal');
    const goalA = goalResA.data.data.goal;

    // Create Roadmap for User A
    const roadmapResA = await request('POST', `/api/goals/${goalA.id}/roadmap`, {}, tokenA);
    assert(roadmapResA.status === 201, 'User A generated roadmap');
    const roadmapA = roadmapResA.data.data.roadmap;
    const milestoneA1 = roadmapA.milestones[0];

    // Create Task for User A
    const taskResA = await request(
      'POST',
      '/api/tasks',
      {
        goalId: goalA.id,
        milestoneId: milestoneA1.id,
        title: 'Implement Raft consensus algorithm in Go',
        priority: 'HIGH',
        taskType: 'PROJECT',
        estimatedMinutes: 90,
      },
      tokenA
    );
    assert(taskResA.status === 201, 'User A created high-priority task');
    const taskA1 = taskResA.data.data.task;

    // Create Goal and Task for User B (for cross-user isolation testing)
    const goalResB = await request(
      'POST',
      '/api/goals',
      {
        title: 'Principal Security Architect',
        type: 'SKILL_MASTERY',
        priority: 'HIGH',
      },
      tokenB
    );
    assert(goalResB.status === 201, 'User B created primary goal');
    const goalB = goalResB.data.data.goal;

    const taskResB = await request(
      'POST',
      '/api/tasks',
      {
        goalId: goalB.id,
        title: 'Perform threat model on OAuth flow',
        priority: 'HIGH',
        estimatedMinutes: 60,
      },
      tokenB
    );
    assert(taskResB.status === 201, 'User B created task');
    const taskB1 = taskResB.data.data.task;

    // -------------------------------------------------------------
    // TEST GROUP 2: SKILL ASSESSMENT HISTORY & IMMUTABILITY
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: SKILL ASSESSMENT HISTORY ---');

    // User A adds a skill
    const addSkillRes = await request(
      'POST',
      '/api/user-skills',
      {
        skillName: 'Distributed Systems',
        category: 'TECHNICAL',
        currentLevel: 2,
        targetLevel: 4,
        evidence: 'Basic understanding of Paxos and CAP theorem',
        notes: 'Initial self-assessment',
      },
      tokenA
    );
    assert(addSkillRes.status === 201, 'User A added Distributed Systems skill (Lvl 2)');
    const userSkillA = addSkillRes.data.data.userSkill;

    // Check history: upon initial upsert, if previousLevel != newLevel, record or initial state
    let historyRes1 = await request('GET', `/api/user-skills/${userSkillA.id}/history`, null, tokenA);
    assert(historyRes1.status === 200, 'User A fetched skill assessment history');

    // Upgrade skill to Level 3 with PROJECT_EVIDENCE
    const updateRes1 = await request(
      'PUT',
      `/api/user-skills/${userSkillA.id}`,
      {
        currentLevel: 3,
        targetLevel: 4,
        assessmentType: 'PROJECT_EVIDENCE',
        evidence: 'Implemented leader election and heartbeat protocol',
        notes: 'Tested on 5 node cluster with mock network latency',
      },
      tokenA
    );
    assert(updateRes1.status === 200, 'User A upgraded skill to Level 3 with project evidence');

    // Check history recorded the transition 2 -> 3
    let historyRes2 = await request('GET', `/api/user-skills/${userSkillA.id}/history`, null, tokenA);
    assert(historyRes2.status === 200, 'User A fetched updated skill assessment history');
    const historyList2 = historyRes2.data.data.history;
    assert(historyList2.length >= 1, 'History has at least 1 transition record');
    const latestTransition = historyList2[0];
    assert(latestTransition.previousLevel === 2, 'History records previousLevel: 2');
    assert(latestTransition.newLevel === 3, 'History records newLevel: 3');
    assert(latestTransition.assessmentType === 'PROJECT_EVIDENCE', 'History records assessmentType: PROJECT_EVIDENCE');
    assert(latestTransition.evidence.includes('leader election'), 'History preserves evidence text');

    // Non-level update: update ONLY notes (currentLevel unchanged at 3)
    const updateResNotes = await request(
      'PUT',
      `/api/user-skills/${userSkillA.id}`,
      {
        currentLevel: 3,
        notes: 'Minor doc update without level change',
      },
      tokenA
    );
    assert(updateResNotes.status === 200, 'User A updated notes without level change');

    // Verify history length did NOT increase
    let historyRes3 = await request('GET', `/api/user-skills/${userSkillA.id}/history`, null, tokenA);
    assert(historyRes3.data.data.history.length === historyList2.length, 'No history row created when level did not change');

    // Upgrade skill to Level 4
    const updateRes2 = await request(
      'PUT',
      `/api/user-skills/${userSkillA.id}`,
      {
        currentLevel: 4,
        assessmentType: 'PROJECT_EVIDENCE',
        evidence: 'Passed Jepsen partition tests with linearizable reads',
      },
      tokenA
    );
    assert(updateRes2.status === 200, 'User A upgraded skill to Level 4');

    let historyRes4 = await request('GET', `/api/user-skills/${userSkillA.id}/history`, null, tokenA);
    const historyList4 = historyRes4.data.data.history;
    assert(historyList4.length >= 2, 'History now has 2 transitions (2->3 and 3->4)');
    assert(historyList4[0].previousLevel === 3 && historyList4[0].newLevel === 4, 'Latest transition is 3 -> 4');

    // Test cross-user isolation: User B tries to view User A's skill history
    const userBAccessSkillHist = await request('GET', `/api/user-skills/${userSkillA.id}/history`, null, tokenB);
    assert(userBAccessSkillHist.status === 404, 'User B rejected with 404 when querying User A skill history');

    // User A fetches all skill history
    const allSkillHistRes = await request('GET', '/api/progress/skills/history', null, tokenA);
    assert(allSkillHistRes.status === 200, 'User A fetched all skill history via /api/progress/skills/history');
    assert(allSkillHistRes.data.data.history.length >= 2, 'All skill history returns transitions');

    // -------------------------------------------------------------
    // TEST GROUP 3: METRICS, GROUND TRUTH & EXECUTION EXCLUSIONS
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: METRICS, ACTIVE DAYS & EXCLUSIONS ---');

    // Verify initial metrics for User A (no focus sessions yet)
    const initialProgressRes = await request('GET', '/api/progress?period=THIS_WEEK', null, tokenA);
    assert(initialProgressRes.status === 200, 'Fetched initial progress for User A');
    assert(initialProgressRes.data.data.metrics.totalFocusMinutes === 0, 'Initial focus minutes = 0');
    assert(initialProgressRes.data.data.metrics.activeDays === 0, 'Initial active days = 0');

    // Start and cancel a focus session
    const cancelSessionStart = await request(
      'POST',
      '/api/focus/start',
      {
        taskId: taskA1.id,
        durationMinutes: 25,
      },
      tokenA
    );
    assert(cancelSessionStart.status === 201, 'User A started a focus session to be cancelled');
    const cancelSessionId = cancelSessionStart.data.data.session.id;

    const cancelRes = await request('POST', `/api/focus/${cancelSessionId}/cancel`, {}, tokenA);
    assert(cancelRes.status === 200, 'User A cancelled the focus session');

    // Verify cancelled session is STRICTLY excluded from progress metrics
    const postCancelProgress = await request('GET', '/api/progress?period=THIS_WEEK', null, tokenA);
    assert(
      postCancelProgress.data.data.metrics.totalFocusMinutes === 0,
      'Cancelled session is STRICTLY excluded from total focus minutes (remains 0)'
    );
    assert(
      postCancelProgress.data.data.metrics.activeDays === 0,
      'Cancelled session does NOT count as an active day (remains 0)'
    );
    assert(
      postCancelProgress.data.data.metrics.focusSessionsCompleted === 0,
      'Cancelled session does NOT count in focusSessionsCompleted'
    );

    // Now start and legitimately finish a 45-minute focus session
    const validSessionStart = await request(
      'POST',
      '/api/focus/start',
      {
        taskId: taskA1.id,
        durationMinutes: 45,
      },
      tokenA
    );
    assert(validSessionStart.status === 201, 'User A started valid focus session');
    const validSessionId = validSessionStart.data.data.session.id;

    // Simulate completion
    const finishRes = await request(
      'POST',
      `/api/focus/${validSessionId}/finish`,
      {
        taskOutcome: 'COMPLETED',
        notes: 'Successfully implemented consensus state machine',
      },
      tokenA
    );
    assert(finishRes.status === 200, 'User A finished focus session with taskOutcome: COMPLETED');

    // Verify metrics updated
    const validProgressRes = await request('GET', '/api/progress?period=THIS_WEEK', null, tokenA);
    const m = validProgressRes.data.data.metrics;
    assert(m.focusSessionsCompleted === 1, 'Focus sessions completed is 1');
    assert(m.totalFocusMinutes > 0, 'Total focus minutes > 0');
    assert(m.activeDays === 1, 'Active days incremented to 1');
    assert(m.tasksCompleted >= 1, 'Tasks completed reflects finished task');

    // -------------------------------------------------------------
    // TEST GROUP 4: GOAL ATTRIBUTION & ROADMAP PROGRESS
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: GOAL ATTRIBUTION ---');
    const goalProg = validProgressRes.data.data.goalProgress;
    assert(goalProg.length >= 1, 'Goal progress returned for active goals');
    const goalAProgress = goalProg.find((g) => g.goalId === goalA.id);
    assert(goalAProgress, 'Goal A is present in goalProgress');
    assert(goalAProgress.focusMinutes > 0, 'Focus minutes correctly attributed to Goal A');
    assert(goalAProgress.tasksCompleted >= 1, 'Completed task correctly attributed to Goal A');

    // -------------------------------------------------------------
    // TEST GROUP 5: PLANNED VS ACTUAL CAREER TIME
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: PLANNED VS ACTUAL TIME ---');

    // Create a 2nd task for daily planning
    const taskA2Res = await request(
      'POST',
      '/api/tasks',
      {
        goalId: goalA.id,
        title: 'Benchmark linearizable write throughput',
        priority: 'MEDIUM',
        estimatedMinutes: 60,
      },
      tokenA
    );
    const taskA2 = taskA2Res.data.data.task;

    // Confirm a daily plan with plannedMinutes: 120
    const confirmPlanRes = await request(
      'POST',
      '/api/today/plan/confirm',
      {
        mainTaskId: taskA2.id,
        plannedMinutes: 120,
      },
      tokenA
    );
    assert(confirmPlanRes.status === 200, 'User A confirmed daily plan with plannedMinutes: 120');

    const progressWithPlan = await request('GET', '/api/progress?period=THIS_WEEK', null, tokenA);
    const planMetrics = progressWithPlan.data.data.metrics;
    assert(planMetrics.plannedMinutes >= 120, 'Progress aggregates plannedMinutes from confirmed daily plans');
    assert(planMetrics.dailyPlansConfirmed >= 1, 'Daily plans confirmed count is at least 1');

    // -------------------------------------------------------------
    // TEST GROUP 6: 8-WEEK TREND TRAJECTORY
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: 8-WEEK TRENDS ---');
    const trendsRes = await request('GET', '/api/progress/trends?weeks=8', null, tokenA);
    assert(trendsRes.status === 200, 'Fetched 8-week trend trajectory');
    assert(Array.isArray(trendsRes.data.data.trend), 'Trend is an array');
    assert(trendsRes.data.data.trend.length === 8, 'Returns exactly 8 weekly buckets');
    const currentWeekBucket = trendsRes.data.data.trend[7];
    assert(currentWeekBucket.focusMinutes > 0, 'Current week bucket captures logged focus minutes');

    // -------------------------------------------------------------
    // TEST GROUP 7: DETERMINISTIC ADAPTATION RULES
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: DETERMINISTIC ADAPTATIONS ---');

    // Create a blocked task for User A
    const blockedTaskRes = await request(
      'POST',
      '/api/tasks',
      {
        goalId: goalA.id,
        title: 'Provision dedicated 3-node baremetal testbed',
        priority: 'HIGH',
        status: 'BLOCKED',
        description: 'Waiting for datacenter IPMI credentials and subnet allocation',
      },
      tokenA
    );
    assert(blockedTaskRes.status === 201, 'Created blocked task for User A');

    // Fetch weekly review workspace which evaluates adaptation rules
    const reviewWorkspaceRes = await request('GET', '/api/reviews/weekly/current', null, tokenA);
    assert(reviewWorkspaceRes.status === 200, 'Fetched weekly review workspace');
    const adaptations = reviewWorkspaceRes.data.data.adaptations;
    assert(Array.isArray(adaptations), 'Adaptations is an array');
    const hasBlockerRule = adaptations.some((a) => a.type === 'RESOLVE_BLOCKERS');
    assert(hasBlockerRule, 'Deterministic rule RESOLVE_BLOCKERS triggered by blocked task');

    // -------------------------------------------------------------
    // TEST GROUP 8: WEEKLY REVIEW LIFECYCLE & SECURITY ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: WEEKLY REVIEW LIFECYCLE & ISOLATION ---');

    const reviewData = reviewWorkspaceRes.data.data.review;
    assert(reviewData.status === 'DRAFT', 'Current weekly review initialized as DRAFT');

    // Save draft with reflection
    const saveDraftRes = await request(
      'POST',
      '/api/reviews/weekly/draft',
      {
        reviewId: reviewData.id,
        wins: 'Completed Raft consensus engine core loop',
        challenges: 'Datacenter hardware provisioning delayed',
        learnings: 'Learned distributed log compaction algorithms',
        continueDoing: '90-minute morning deep work blocks',
        stopDoing: 'Checking emails before noon',
        startDoing: 'Pre-flight infra checks on Friday afternoon',
        plannedCareerMinutes: 360,
      },
      tokenA
    );
    assert(saveDraftRes.status === 200, 'Saved weekly review draft');
    assert(saveDraftRes.data.data.review.status === 'DRAFT', 'Review remains DRAFT after draft save');
    assert(saveDraftRes.data.data.review.wins.includes('Raft'), 'Draft wins persisted');

    // Security Isolation: Attempt to complete review with foreign Goal belonging to User B
    const foreignGoalAttempt = await request(
      'POST',
      '/api/reviews/weekly/complete',
      {
        reviewId: reviewData.id,
        nextWeekMainGoalId: goalB.id, // User B's goal!
      },
      tokenA
    );
    assert(
      foreignGoalAttempt.status === 404,
      'Completing review with foreign nextWeekMainGoalId rejected with 404 (ID security isolation)'
    );

    // Security Isolation: Attempt to complete review with foreign Task belonging to User B
    const foreignTaskAttempt = await request(
      'POST',
      '/api/reviews/weekly/complete',
      {
        reviewId: reviewData.id,
        nextWeekMainTaskId: taskB1.id, // User B's task!
      },
      tokenA
    );
    assert(
      foreignTaskAttempt.status === 404,
      'Completing review with foreign nextWeekMainTaskId rejected with 404 (ID security isolation)'
    );

    // Valid Completion: with User A's own goal and task
    const completeRes = await request(
      'POST',
      '/api/reviews/weekly/complete',
      {
        reviewId: reviewData.id,
        wins: 'Completed Raft consensus engine core loop',
        challenges: 'Datacenter hardware provisioning delayed',
        learnings: 'Learned distributed log compaction algorithms',
        continueDoing: '90-minute morning deep work blocks',
        stopDoing: 'Checking emails before noon',
        startDoing: 'Pre-flight infra checks on Friday afternoon',
        nextWeekMainGoalId: goalA.id,
        nextWeekMainTaskId: taskA2.id,
        plannedCareerMinutes: 480,
      },
      tokenA
    );
    assert(completeRes.status === 200, 'User A successfully completed weekly review');
    const completedReview = completeRes.data.data.review;
    assert(completedReview.status === 'COMPLETED', 'Status transitioned to COMPLETED');
    assert(completedReview.metricsSnapshot !== null, 'metricsSnapshot is populated and frozen');
    assert(completedReview.metricsSnapshot.focusSessionsCompleted >= 1, 'Snapshot contains focusSessionsCompleted');
    assert(completedReview.metricsSnapshot.activeDays >= 1, 'Snapshot contains activeDays');

    // History check
    const historyListRes = await request('GET', '/api/reviews/weekly/history', null, tokenA);
    assert(historyListRes.status === 200, 'User A fetched weekly review history');
    assert(historyListRes.data.data.history.length >= 1, 'Completed review is present in history list');
    const historicalItem = historyListRes.data.data.history[0];
    assert(historicalItem.metricsSnapshot.focusSessionsCompleted >= 1, 'History preserves frozen metrics snapshot');

    // Cross-user isolation: User B cannot fetch User A's completed review by ID
    const userBAccessReview = await request('GET', `/api/reviews/weekly/${completedReview.id}`, null, tokenB);
    assert(userBAccessReview.status === 404, 'User B rejected with 404 when querying User A review');

    // -------------------------------------------------------------
    // TEST GROUP 9: POSTGRESQL CONCURRENT SAFETY & ADVISORY LOCK
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 9: CONCURRENT FOCUS SESSION ADVISORY LOCK ---');

    // User A fires TWO concurrent POST /api/focus/start requests simultaneously
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      request('POST', '/api/focus/start', { taskId: taskA2.id, durationMinutes: 30 }, tokenA),
      request('POST', '/api/focus/start', { taskId: taskA2.id, durationMinutes: 30 }, tokenA),
    ]);

    const statuses = [concurrentRes1.status, concurrentRes2.status];
    assert(
      statuses.includes(201) && statuses.includes(409),
      `PostgreSQL advisory lock properly serialized concurrent focus start: one 201 Created and one 409 Conflict (got ${statuses.join(', ')})`
    );

    // Cancel active session to leave state clean
    const activeRes = await request('GET', '/api/focus/active', null, tokenA);
    if (activeRes.data?.data?.session?.id) {
      await request('POST', `/api/focus/${activeRes.data.data.session.id}/cancel`, {}, tokenA);
    }

    console.log('\n=============================================================');
    console.log(`🎉 ALL PHASE 1E E2E TESTS COMPLETED: ${testsPassed} PASS, ${testsFailed} FAIL`);
    console.log('=============================================================\n');
  } catch (err) {
    console.error('\n❌ E2E TEST CRASHED:', err.message);
    if (err.stack) console.error(err.stack);
    process.exitCode = 1;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }
}

runTests();
