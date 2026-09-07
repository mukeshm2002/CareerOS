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

    req.on('error', (err) => reject(err));
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

async function runE2ESuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 1C REAL DATABASE E2E VERIFICATION GATE');
  console.log('======================================================\n');

  // --- 0. Database Connection Check ---
  console.log('--- 0. Database Connection Check ---');
  await prisma.$connect();
  const dbCheck = await prisma.$queryRaw`SELECT 1 as connected`;
  assert(dbCheck[0].connected === 1, 'Connected to live PostgreSQL database');

  // Start temporary test server
  const TEST_PORT = 5089;
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  baseUrl = `http://localhost:${TEST_PORT}/api`;
  console.log(`Test server listening on ${baseUrl}\n`);

  const runId = Date.now();
  const userAEmail = `user_a_${runId}@careeros.local`;
  const userBEmail = `user_b_${runId}@careeros.local`;
  const password = 'Password123!';

  // Register User A
  const regARes = await request('POST', '/auth/register', {
    email: userAEmail,
    password,
    fullName: 'Alice Test',
  });
  assert(regARes.status === 201, 'User A registered');
  const tokenA = regARes.data.data.tokens.accessToken;
  const userAId = regARes.data.data.user.id;

  // Complete User A onboarding with 1 goal
  const obARes = await request('POST', '/onboarding/complete', {
    situation: 'WORKING_PROFESSIONAL',
    targetRole: 'Senior Backend Engineer',
    targetSalary: '$120,000',
    availableCareerMinutes: 130,
    wakeTime: '06:00',
    workStartTime: '08:00',
    workEndTime: '19:00',
    personalStartTime: '19:00',
    personalEndTime: '20:00',
    sleepTime: '22:30',
    goals: [
      {
        title: 'Better Salary Job',
        type: 'JOB_SWITCH',
        priority: 'HIGH',
      },
    ],
  }, tokenA);
  if (obARes.status !== 201) {
    console.error('User A onboarding failed:', obARes.status, obARes.data);
  }
  assert(obARes.status === 201, 'User A completed onboarding');

  // Register User B
  const regBRes = await request('POST', '/auth/register', {
    email: userBEmail,
    password,
    fullName: 'Bob Test',
  });
  assert(regBRes.status === 201, 'User B registered');
  const tokenB = regBRes.data.data.tokens.accessToken;
  const userBId = regBRes.data.data.user.id;

  // Complete User B onboarding
  const obBRes = await request('POST', '/onboarding/complete', {
    situation: 'STUDENT',
    targetRole: 'Junior Developer',
    goals: [
      {
        title: 'User B First Job',
        type: 'FIRST_JOB',
        priority: 'MEDIUM',
      },
    ],
  }, tokenB);
  if (obBRes.status !== 201) {
    console.error('User B onboarding failed:', obBRes.status, obBRes.data);
  }
  assert(obBRes.status === 201, 'User B completed onboarding');

  // Retrieve User A Goal
  const goalsResA = await request('GET', '/goals', null, tokenA);
  const goalA = goalsResA.data?.data?.goals?.[0];
  assert(goalA && goalA.title === 'Better Salary Job', 'User A has active goal');

  // Retrieve User B Goal
  const goalsResB = await request('GET', '/goals', null, tokenB);
  const goalB = goalsResB.data.data.goals[0];
  assert(goalB && goalB.title === 'User B First Job', 'User B has active goal');

  // =========================================================================
  // 1. SECTION 36: ROADMAP TESTS
  // =========================================================================
  console.log('\n--- 1. Section 36: Roadmap & Milestone Engine Tests ---');

  // A. Template preview
  const prevRes = await request('GET', '/roadmap-templates/JOB_SWITCH?goalTitle=Better%20Salary%20Job', null, tokenA);
  assert(prevRes.status === 200, 'GET /roadmap-templates/:goalType returns 200 OK');
  assert(prevRes.data.data.preview.stagesCount === 10, 'Template preview has exactly 10 stages');
  assert(prevRes.data.data.preview.milestones[0].title === 'Define Target Role', 'Stage 1 matches JOB_SWITCH template');

  // B. Create roadmap from template
  const createRoadmapRes = await request('POST', `/goals/${goalA.id}/roadmap`, {
    useTemplate: true,
  }, tokenA);
  assert(createRoadmapRes.status === 201, 'POST /goals/:id/roadmap creates active roadmap');
  const roadmapA = createRoadmapRes.data.data.roadmap;
  assert(roadmapA.status === 'ACTIVE', 'Roadmap starts with status ACTIVE');
  assert(roadmapA.progress === 0, 'Roadmap starts with progress 0%');
  assert(roadmapA.milestones.length === 10, 'Roadmap seeded with 10 milestones');

  // C. Prevent duplicate active roadmap
  const dupRoadmapRes = await request('POST', `/goals/${goalA.id}/roadmap`, {
    useTemplate: true,
  }, tokenA);
  assert(dupRoadmapRes.status === 409, 'Duplicate active roadmap rejected with 409 Conflict');

  // D. Read roadmap
  const readRoadmapRes = await request('GET', `/goals/${goalA.id}/roadmap`, null, tokenA);
  assert(readRoadmapRes.status === 200, 'GET /goals/:id/roadmap returns active roadmap');
  assert(readRoadmapRes.data.data.roadmap.id === roadmapA.id, 'Roadmap ID matches');

  // E. Add custom milestone
  const addMilestoneRes = await request('POST', `/roadmaps/${roadmapA.id}/milestones`, {
    title: 'Bonus Stage: Network with Alumni',
    description: 'Connect with 5 senior engineers in alumni group',
  }, tokenA);
  assert(addMilestoneRes.status === 201, 'POST /roadmaps/:id/milestones adds milestone');
  const customMilestone = addMilestoneRes.data.data.milestone;
  assert(customMilestone.sequence === 11, 'Appended milestone has sequence 11');

  // F. Update milestone
  const updateMilestoneRes = await request('PUT', `/milestones/${customMilestone.id}`, {
    title: 'Bonus Stage: Alumni & Mentor Outreach',
  }, tokenA);
  assert(updateMilestoneRes.status === 200, 'PUT /milestones/:id updates title');
  assert(updateMilestoneRes.data.data.milestone.title === 'Bonus Stage: Alumni & Mentor Outreach', 'Updated title persisted');

  // Self-dependency prevention
  const selfDepRes = await request('PUT', `/milestones/${customMilestone.id}`, {
    dependencyMilestoneId: customMilestone.id,
  }, tokenA);
  assert(selfDepRes.status === 400, 'Milestone self-dependency rejected with 400 Bad Request');

  // G. Milestone status transitions & Progress Calculation
  const m1 = roadmapA.milestones[0];
  const m2 = roadmapA.milestones[1];
  const m3 = roadmapA.milestones[2];

  // Complete milestone 1
  const compM1Res = await request('PATCH', `/milestones/${m1.id}/status`, { status: 'COMPLETED' }, tokenA);
  assert(compM1Res.status === 200, 'Milestone 1 marked COMPLETED');
  assert(compM1Res.data.data.milestone.completedAt !== null, 'Milestone 1 completedAt timestamp recorded');

  // Complete milestone 2
  await request('PATCH', `/milestones/${m2.id}/status`, { status: 'COMPLETED' }, tokenA);

  // Milestone 3 IN_PROGRESS
  const startM3Res = await request('PATCH', `/milestones/${m3.id}/status`, { status: 'IN_PROGRESS' }, tokenA);
  assert(startM3Res.data.data.milestone.startedAt !== null, 'Milestone 3 startedAt timestamp recorded');

  // Block milestone 4
  const m4 = roadmapA.milestones[3];
  await request('PATCH', `/milestones/${m4.id}/status`, { status: 'BLOCKED' }, tokenA);

  // Skip custom milestone 11
  await request('PATCH', `/milestones/${customMilestone.id}/status`, { status: 'SKIPPED' }, tokenA);

  // Check progress: 2 completed out of 10 active milestones (excluding 1 skipped) = 2 / 10 = 20%
  const updatedRoadmapRes = await request('GET', `/roadmaps/${roadmapA.id}`, null, tokenA);
  const updatedRoadmap = updatedRoadmapRes.data.data.roadmap;
  assert(updatedRoadmap.progress === 20, `Roadmap progress correctly calculated as 20% (got ${updatedRoadmap.progress}%)`);
  assert(updatedRoadmap.goal.progress === 20, 'Goal progress synchronized with active roadmap progress');

  // H. Reorder milestones
  const reorderedIds = [m2.id, m1.id, m3.id];
  const reorderRes = await request('POST', `/roadmaps/${roadmapA.id}/milestones/reorder`, {
    orderedMilestoneIds: reorderedIds,
  }, tokenA);
  assert(reorderRes.status === 200, 'POST /roadmaps/:id/milestones/reorder succeeds');

  // I. Delete milestone
  const delMilestoneRes = await request('DELETE', `/milestones/${customMilestone.id}`, null, tokenA);
  assert(delMilestoneRes.status === 200, 'DELETE /milestones/:id deletes milestone');

  // J. Cross-user isolation on roadmap and milestones
  const foreignRoadmapRes = await request('GET', `/roadmaps/${roadmapA.id}`, null, tokenB);
  assert(foreignRoadmapRes.status === 404, 'User B GET User A roadmap -> 404 Not Found');

  const foreignMilestoneRes = await request('PATCH', `/milestones/${m1.id}/status`, { status: 'NOT_STARTED' }, tokenB);
  assert(foreignMilestoneRes.status === 404, 'User B PATCH User A milestone -> 404 Not Found');

  const foreignDelMilestoneRes = await request('DELETE', `/milestones/${m1.id}`, null, tokenB);
  assert(foreignDelMilestoneRes.status === 404, 'User B DELETE User A milestone -> 404 Not Found');

  // =========================================================================
  // 2. SECTION 37: SKILL TESTS
  // =========================================================================
  console.log('\n--- 2. Section 37: Skills, Normalization & Role Readiness Tests ---');

  // A. Create global normalized skill
  const skill1Res = await request('POST', '/skills', {
    name: 'Spring Boot',
    category: 'TECHNICAL',
  }, tokenA);
  assert(skill1Res.status === 201, 'POST /skills creates global skill');
  const globalSkill1 = skill1Res.data.data.skill;
  assert(globalSkill1.normalizedName === 'spring boot', 'Skill name normalized to lower case');

  // B. Normalization deduplication test: "spring boot" and "SPRING BOOT"
  const skill2Res = await request('POST', '/skills', {
    name: '  spring   boot  ',
  }, tokenA);
  assert(skill2Res.status === 201, 'Duplicate normalized skill resolved to existing row');
  assert(skill2Res.data.data.skill.id === globalSkill1.id, '"Spring Boot" and "spring boot" share same global skill ID');

  const skill3Res = await request('POST', '/skills', {
    name: 'SPRING BOOT',
  }, tokenA);
  assert(skill3Res.data.data.skill.id === globalSkill1.id, '"SPRING BOOT" resolves to same global skill ID');

  // C. Add UserSkills with levels and assessments
  const us1Res = await request('POST', '/user-skills', {
    skillName: 'Spring Boot',
    currentLevel: 2,
    targetLevel: 4,
    evidence: 'Built REST APIs',
  }, tokenA);
  assert(us1Res.status === 201, 'POST /user-skills adds user skill');
  assert(us1Res.data.data.userSkill.gap === 2, 'Gap = targetLevel (4) - currentLevel (2) = 2');
  assert(us1Res.data.data.userSkill.gapPriority === 'HIGH', 'Gap of 2 has priority HIGH');

  // Add a second skill (Critical gap: 1 -> 4 = 3)
  const us2Res = await request('POST', '/user-skills', {
    skillName: 'Data Structures & Algorithms',
    currentLevel: 1,
    targetLevel: 4,
  }, tokenA);
  assert(us2Res.data.data.userSkill.gap === 3, 'Gap of 3 calculated');
  assert(us2Res.data.data.userSkill.gapPriority === 'CRITICAL', 'Gap of 3 has priority CRITICAL');

  // Add a third skill (Ready: 4 -> 4 = 0)
  const us3Res = await request('POST', '/user-skills', {
    skillName: 'Java',
    currentLevel: 4,
    targetLevel: 4,
  }, tokenA);
  assert(us3Res.data.data.userSkill.gap === 0, 'Gap of 0 calculated');
  assert(us3Res.data.data.userSkill.gapPriority === 'READY', 'Gap of 0 has priority READY');

  // D. Update UserSkill levels
  const userSkill1Id = us1Res.data.data.userSkill.id;
  const updateUsRes = await request('PUT', `/user-skills/${userSkill1Id}`, {
    currentLevel: 3,
    targetLevel: 4,
  }, tokenA);
  assert(updateUsRes.status === 200, 'PUT /user-skills/:id updates current level');
  assert(updateUsRes.data.data.userSkill.gap === 1, 'Updated gap is 1');
  assert(updateUsRes.data.data.userSkill.gapPriority === 'MODERATE', 'Gap of 1 has priority MODERATE');

  // E. Calculate Gaps & Role Readiness
  // User A skills:
  // Spring Boot: current 3, target 4 (min = 3)
  // DSA: current 1, target 4 (min = 1)
  // Java: current 4, target 4 (min = 4)
  // Total target = 4 + 4 + 4 = 12
  // Total achieved = 3 + 1 + 4 = 8
  // Readiness = (8 / 12) * 100 = 67%
  const readinessRes = await request('GET', '/user-skills/gaps', null, tokenA);
  assert(readinessRes.status === 200, 'GET /user-skills/gaps returns readiness report');
  assert(readinessRes.data.data.hasEnoughData === true, 'hasEnoughData is true');
  assert(readinessRes.data.data.readinessScore === 67, `Role readiness calculated as 67% (got ${readinessRes.data.data.readinessScore}%)`);
  assert(readinessRes.data.data.label === 'Self-Assessed Role Readiness', 'Explicit label verified');
  assert(readinessRes.data.data.topGaps.length === 2, 'Identified top 2 skill gaps');

  // F. Delete UserSkill
  const delUsRes = await request('DELETE', `/user-skills/${userSkill1Id}`, null, tokenA);
  assert(delUsRes.status === 200, 'DELETE /user-skills/:id removes skill');

  // G. Cross-user isolation on UserSkills
  const foreignUsRes = await request('PUT', `/user-skills/${us2Res.data.data.userSkill.id}`, {
    currentLevel: 5,
  }, tokenB);
  assert(foreignUsRes.status === 404, 'User B PUT User A skill -> 404 Not Found');

  const foreignDelUsRes = await request('DELETE', `/user-skills/${us2Res.data.data.userSkill.id}`, null, tokenB);
  assert(foreignDelUsRes.status === 404, 'User B DELETE User A skill -> 404 Not Found');

  // =========================================================================
  // 3. SECTION 38: TASK TESTS
  // =========================================================================
  console.log('\n--- 3. Section 38: Task Domain & Cross-Resource Validation Tests ---');

  // A. Create Task linked to goal, milestone, and skill
  const taskRes = await request('POST', '/tasks', {
    title: 'Complete Spring Security JWT Authentication',
    description: 'Implement refresh tokens and BCrypt hashing',
    priority: 'HIGH',
    status: 'TODO',
    taskType: 'LEARNING',
    estimatedMinutes: 80,
    goalId: goalA.id,
    milestoneId: m3.id,
    skillId: globalSkill1.id,
    dueDate: new Date().toISOString(),
  }, tokenA);
  assert(taskRes.status === 201, 'POST /tasks creates task linked to goal, milestone, skill');
  const taskA = taskRes.data.data.task;
  assert(taskA.goalId === goalA.id, 'Task linked to User A goal');
  assert(taskA.milestoneId === m3.id, 'Task linked to User A milestone');

  // B. Cross-resource validation: Reject foreign goal
  const foreignGoalTaskRes = await request('POST', '/tasks', {
    title: 'Hacked task with foreign goal',
    goalId: goalB.id, // User B goal!
  }, tokenA);
  assert(foreignGoalTaskRes.status === 404, 'Task with foreign goal rejected with 404 Not Found');

  // C. Cross-resource validation: Reject foreign milestone
  // Let's create a roadmap & milestone for User B
  const bRoadmapRes = await request('POST', `/goals/${goalB.id}/roadmap`, { useTemplate: true }, tokenB);
  const bMilestone = bRoadmapRes.data.data.roadmap.milestones[0];

  const foreignMilestoneTaskRes = await request('POST', '/tasks', {
    title: 'Hacked task with foreign milestone',
    milestoneId: bMilestone.id, // User B milestone!
  }, tokenA);
  assert(foreignMilestoneTaskRes.status === 404, 'Task with foreign milestone rejected with 404 Not Found');

  // D. Cross-resource validation: Reject milestone/goal mismatch
  // Create second goal for User A
  const goalA2Res = await request('POST', '/goals', {
    title: 'Second Goal for User A',
    type: 'FREELANCING',
  }, tokenA);
  const goalA2 = goalA2Res.data.data.goal;

  const mismatchTaskRes = await request('POST', '/tasks', {
    title: 'Mismatched goal and milestone',
    goalId: goalA2.id, // User A Goal 2
    milestoneId: m3.id, // User A Goal 1 Milestone!
  }, tokenA);
  assert(mismatchTaskRes.status === 400, 'Goal and Milestone mismatch rejected with 400 Bad Request');

  // E. Task status transitions
  // Start task
  const startTaskRes = await request('PATCH', `/tasks/${taskA.id}/status`, { status: 'IN_PROGRESS' }, tokenA);
  assert(startTaskRes.status === 200, 'Task status updated to IN_PROGRESS');

  // Complete task
  const completeTaskRes = await request('PATCH', `/tasks/${taskA.id}/status`, { status: 'COMPLETED' }, tokenA);
  assert(completeTaskRes.status === 200, 'Task status updated to COMPLETED');
  assert(completeTaskRes.data.data.task.completedAt !== null, 'completedAt timestamp recorded on task completion');

  // F. Filter tasks
  const filterByStatusRes = await request('GET', '/tasks?status=COMPLETED', null, tokenA);
  assert(filterByStatusRes.data.data.tasks.length >= 1, 'Filter by status=COMPLETED works');

  const filterByGoalRes = await request('GET', `/tasks?goalId=${goalA.id}`, null, tokenA);
  assert(filterByGoalRes.data.data.tasks.length >= 1, 'Filter by goalId works');

  const filterByMilestoneRes = await request('GET', `/tasks?milestoneId=${m3.id}`, null, tokenA);
  assert(filterByMilestoneRes.data.data.tasks.length >= 1, 'Filter by milestoneId works');

  // G. Cross-user isolation on tasks
  const foreignTaskGetRes = await request('GET', `/tasks/${taskA.id}`, null, tokenB);
  assert(foreignTaskGetRes.status === 404, 'User B GET User A task -> 404 Not Found');

  const foreignTaskPatchRes = await request('PATCH', `/tasks/${taskA.id}/status`, { status: 'TODO' }, tokenB);
  assert(foreignTaskPatchRes.status === 404, 'User B PATCH User A task -> 404 Not Found');

  const foreignTaskDeleteRes = await request('DELETE', `/tasks/${taskA.id}`, null, tokenB);
  assert(foreignTaskDeleteRes.status === 404, 'User B DELETE User A task -> 404 Not Found');

  // =========================================================================
  // 4. SECTION 39: SCHEDULE TESTS
  // =========================================================================
  console.log('\n--- 4. Section 39: Schedule Blocks, Overlaps & Time Validation ---');

  const todayStr = new Date().toISOString().split('T')[0];

  // A. Create schedule block
  const block1Res = await request('POST', '/schedule', {
    title: 'Career Deep Work: JWT Auth',
    date: todayStr,
    startTime: '20:10',
    endTime: '21:30',
    category: 'CAREEROS',
    taskId: taskA.id,
    goalId: goalA.id,
  }, tokenA);
  assert(block1Res.status === 201, 'POST /schedule creates block');
  const block1 = block1Res.data.data.block;
  assert(block1.taskId === taskA.id, 'Block linked to task');
  assert(block1.goalId === goalA.id, 'Block linked to goal');

  // B. Reject endTime <= startTime
  const invalidTimeRes = await request('POST', '/schedule', {
    title: 'Invalid End Time Block',
    date: todayStr,
    startTime: '21:00',
    endTime: '20:00', // End before start!
  }, tokenA);
  assert(invalidTimeRes.status === 400, 'endTime <= startTime rejected with 400 Bad Request');

  const equalTimeRes = await request('POST', '/schedule', {
    title: 'Equal Start/End Time Block',
    date: todayStr,
    startTime: '21:00',
    endTime: '21:00',
  }, tokenA);
  assert(equalTimeRes.status === 400, 'endTime === startTime rejected with 400 Bad Request');

  // C. Overlap warning (Section 25: Warn user, do not silently replace)
  const overlappingRes = await request('POST', '/schedule', {
    title: 'Overlapping Mentorship Session',
    date: todayStr,
    startTime: '20:30',
    endTime: '21:15', // Overlaps with 20:10-21:30
    category: 'CAREEROS',
  }, tokenA);
  assert(overlappingRes.status === 201, 'Overlapping block created with warning');
  assert(overlappingRes.data.data.hasOverlap === true, 'hasOverlap is true');
  assert(overlappingRes.data.data.overlapWarning !== null, 'Overlap warning text provided');

  // D. Query schedule by date
  const dateQueryRes = await request('GET', `/schedule?date=${todayStr}`, null, tokenA);
  assert(dateQueryRes.status === 200, 'GET /schedule?date=... returns blocks');
  assert(dateQueryRes.data.data.blocks.length >= 2, 'Query returned scheduled blocks for date');

  // E. Reject foreign task in schedule block
  const foreignTaskBlockRes = await request('POST', '/schedule', {
    title: 'Block with foreign task',
    date: todayStr,
    startTime: '22:00',
    endTime: '22:30',
    taskId: taskA.id, // User A's task!
  }, tokenB); // User B token!
  assert(foreignTaskBlockRes.status === 404, 'Schedule block with foreign task rejected with 404 Not Found');

  // F. Cross-user isolation on schedule blocks
  const foreignBlockPutRes = await request('PUT', `/schedule/${block1.id}`, {
    title: 'Hacked block',
  }, tokenB);
  assert(foreignBlockPutRes.status === 404, 'User B PUT User A schedule block -> 404 Not Found');

  const foreignBlockDelRes = await request('DELETE', `/schedule/${block1.id}`, null, tokenB);
  assert(foreignBlockDelRes.status === 404, 'User B DELETE User A schedule block -> 404 Not Found');

  // =========================================================================
  // 5. SECTION 40: PLANNING ENGINE TESTS
  // =========================================================================
  console.log('\n--- 5. Section 40: Planning Engine & Suggestion Tests ---');

  // Create Task X (80 min)
  const taskXRes = await request('POST', '/tasks', {
    title: 'Task X (80 min work)',
    estimatedMinutes: 80,
    status: 'TODO',
  }, tokenA);
  const taskX = taskXRes.data.data.task;

  // Plan Task X into schedule
  const planXRes = await request('POST', '/schedule/plan-task', {
    taskId: taskX.id,
    date: '2026-10-15',
  }, tokenA);
  assert(planXRes.status === 200, 'POST /schedule/plan-task returns 200 OK');
  assert(planXRes.data.data.fits === true, 'Task X (80 min) fits available career window (130m available)');
  assert(planXRes.data.data.suggestedBlock !== null, 'Suggested time block generated');
  assert(planXRes.data.data.reason === 'Fits your available career time.', 'Explainable suggestion reason returned');

  // Create Task Y (200 min - exceeds available career window of 130 min)
  const taskYRes = await request('POST', '/tasks', {
    title: 'Task Y (200 min large project)',
    estimatedMinutes: 200,
    status: 'TODO',
  }, tokenA);
  const taskY = taskYRes.data.data.task;

  const planYRes = await request('POST', '/schedule/plan-task', {
    taskId: taskY.id,
    date: '2026-10-15',
  }, tokenA);
  assert(planYRes.status === 200, 'POST /schedule/plan-task returns 200 OK');
  assert(planYRes.data.data.fits === false, 'Task Y (200 min) does NOT fit 130m career window');
  assert(planYRes.data.data.suggestedBlock === null, 'No suggested block returned for oversized task');

  // Today's Candidate Focus Task Recommendation (Section 30)
  // Create an urgent/critical task for today
  const urgentTaskRes = await request('POST', '/tasks', {
    title: 'Urgent: Review Production Deploy Checklist',
    priority: 'CRITICAL',
    status: 'TODO',
    estimatedMinutes: 45,
    dueDate: new Date().toISOString(),
    goalId: goalA.id,
    milestoneId: m3.id,
  }, tokenA);
  const urgentTask = urgentTaskRes.data.data.task;

  const todayFocusRes = await request('GET', '/tasks/recommendation/today', null, tokenA);
  assert(todayFocusRes.status === 200, 'GET /tasks/recommendation/today returns 200 OK');
  assert(todayFocusRes.data.data.recommendedTask !== null, 'Candidate focus task recommended');
  assert(todayFocusRes.data.data.recommendedTask.id === urgentTask.id, 'Critical due-today task prioritized as #1 focus');
  assert(typeof todayFocusRes.data.data.reason === 'string', 'Deterministic rationale provided');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${testsPassed} REAL POSTGRESQL E2E TESTS PASSED! (${testsFailed} failed)`);
  console.log('======================================================\n');
}

runE2ESuite()
  .catch((err) => {
    console.error('\n❌ PHASE 1C TEST SUITE FAILED:', err);
    process.exit(1);
  })
  .finally(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  });
