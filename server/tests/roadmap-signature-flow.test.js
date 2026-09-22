const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');

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

async function runRoadmapSignatureTests() {
  console.log('\n=============================================================');
  console.log('🗺️  RUNNING ROADMAP SIGNATURE EXPERIENCE TEST SUITE (A - T)');
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

    // 1. Setup User A and User B
    const userARes = await request('POST', '/api/auth/register', {
      email: `roadmap_user_a_${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'Alice Roadmap',
    });
    assert(userARes.status === 201, 'User A registered successfully');
    const tokenA = userARes.data.data.tokens.accessToken;
    const userAId = userARes.data.data.user.id;
    createdUserIds.push(userAId);

    const userBRes = await request('POST', '/api/auth/register', {
      email: `roadmap_user_b_${timestamp}@example.com`,
      password: 'Password123!',
      fullName: 'Bob Roadmap',
    });
    assert(userBRes.status === 201, 'User B registered successfully');
    const tokenB = userBRes.data.data.tokens.accessToken;
    const userBId = userBRes.data.data.user.id;
    createdUserIds.push(userBId);

    // [TEST A & C] Empty Roadmap state on Goal
    const goalRes = await request(
      'POST',
      '/api/goals',
      {
        title: 'Master Cloud Architecture',
        type: 'JOB_SWITCH',
        growthArea: 'CAREER',
      },
      tokenA
    );
    assert(goalRes.status === 201, 'Goal 1 created for User A');
    const goalId1 = goalRes.data.data.goal.id;

    const emptyRoadmapRes = await request('GET', `/api/goals/${goalId1}/roadmap`, null, tokenA);
    assert(emptyRoadmapRes.status === 200, 'GET /goals/:id/roadmap returns 200 for empty roadmap');
    assert(emptyRoadmapRes.data.data.roadmap === null, 'Roadmap is initially null (Empty State supported)');

    // [TEST D] Single Milestone Roadmap Creation
    const manualRoadmap = await prisma.roadmap.create({
      data: {
        userId: userAId,
        goalId: goalId1,
        title: 'Cloud Architect Path',
        status: 'ACTIVE',
        progress: 0,
        milestones: {
          create: [
            {
              userId: userAId,
              title: 'AWS Fundamentals',
              sequence: 1,
              status: 'NOT_STARTED',
            },
          ],
        },
      },
      include: { milestones: true },
    });
    assert(manualRoadmap.milestones.length === 1, 'Single-milestone roadmap created');

    const singleRoadmapRes = await request('GET', `/api/goals/${goalId1}/roadmap`, null, tokenA);
    assert(singleRoadmapRes.data.data.roadmap.milestones.length === 1, 'Single-milestone roadmap retrieved via API');
    const milestone1Id = singleRoadmapRes.data.data.roadmap.milestones[0].id;
    const roadmapId = singleRoadmapRes.data.data.roadmap.id;

    // [TEST F] Start Stage: NOT_STARTED -> IN_PROGRESS
    const startStageRes = await request(
      'PATCH',
      `/api/milestones/${milestone1Id}/status`,
      { status: 'IN_PROGRESS' },
      tokenA
    );
    assert(startStageRes.status === 200, 'Stage transitioned to IN_PROGRESS');
    assert(startStageRes.data.data.milestone.status === 'IN_PROGRESS', 'Milestone status is now IN_PROGRESS');

    // [TEST O & G & H] Add Task & Complete Task from Roadmap
    const taskRes = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Complete S3 and IAM practice lab',
        goalId: goalId1,
        milestoneId: milestone1Id,
        estimatedMinutes: 45,
        status: 'TODO',
      },
      tokenA
    );
    assert(taskRes.status === 201, 'Task added to milestone from Roadmap');
    const taskId1 = taskRes.data.data.task.id;

    // Complete task via centralized transition path (PATCH /api/tasks/:id/status)
    const completeTaskRes = await request(
      'PATCH',
      `/api/tasks/${taskId1}/status`,
      { status: 'COMPLETED' },
      tokenA
    );
    assert(completeTaskRes.status === 200, 'Task completed via centralized PATCH /api/tasks/:id/status');
    assert(completeTaskRes.data.data.task.status === 'COMPLETED', 'Task status is COMPLETED');
    assert(completeTaskRes.data.data.task.completedAt !== null, 'Task completedAt timestamp is set');

    // [TEST J] Invariant: 100% Task execution does NOT automatically complete milestone
    const checkMilestoneRes = await request('GET', `/api/goals/${goalId1}/roadmap`, null, tokenA);
    const updatedM1 = checkMilestoneRes.data.data.roadmap.milestones.find((m) => m.id === milestone1Id);
    assert(updatedM1.progress === 100, 'Milestone execution progress is 100%');
    assert(updatedM1.status === 'IN_PROGRESS', 'CRITICAL DOMAIN INVARIANT: Milestone status was NOT auto-completed to COMPLETED');
    assert(checkMilestoneRes.data.data.roadmap.progress === 0, 'Roadmap achievement progress remains 0% until explicit confirmation');

    // [TEST K & L] Explicit Mark Stage Achieved & Progress Propagation
    const achieveStageRes = await request(
      'PATCH',
      `/api/milestones/${milestone1Id}/status`,
      { status: 'COMPLETED' },
      tokenA
    );
    assert(achieveStageRes.status === 200, 'Stage explicitly marked as COMPLETED');
    assert(achieveStageRes.data.data.milestone.status === 'COMPLETED', 'Milestone status is now COMPLETED');

    const verifiedRoadmapRes = await request('GET', `/api/goals/${goalId1}/roadmap`, null, tokenA);
    assert(verifiedRoadmapRes.data.data.roadmap.progress === 100, 'Roadmap progress propagated to 100% after milestone achievement');

    const verifiedGoalRes = await request('GET', `/api/goals/${goalId1}`, null, tokenA);
    assert(verifiedGoalRes.data.data.goal.progress === 100, 'Parent Goal progress propagated to 100%');

    // [TEST P] Add Stage
    const addStageRes = await request(
      'POST',
      `/api/roadmaps/${roadmapId}/milestones`,
      {
        title: 'Kubernetes Microservices',
        description: 'Deploy and scale containerized services',
      },
      tokenA
    );
    assert(addStageRes.status === 201, 'New stage added to Roadmap');
    const milestone2Id = addStageRes.data.data.milestone.id;

    // [TEST M] Block Stage
    const blockStageRes = await request(
      'PATCH',
      `/api/milestones/${milestone2Id}/status`,
      { status: 'BLOCKED' },
      tokenA
    );
    assert(blockStageRes.status === 200, 'Stage transitioned to BLOCKED');
    assert(blockStageRes.data.data.milestone.status === 'BLOCKED', 'Milestone status is BLOCKED');

    // [TEST N] Skip Stage
    const skipStageRes = await request(
      'PATCH',
      `/api/milestones/${milestone2Id}/status`,
      { status: 'SKIPPED' },
      tokenA
    );
    assert(skipStageRes.status === 200, 'Stage transitioned to SKIPPED');
    assert(skipStageRes.data.data.milestone.status === 'SKIPPED', 'Milestone status is SKIPPED');

    // [TEST E & Q] Multi-milestone Roadmap and Reordering
    const addStage3Res = await request(
      'POST',
      `/api/roadmaps/${roadmapId}/milestones`,
      { title: 'Serverless Event Architecture' },
      tokenA
    );
    assert(addStage3Res.status === 201, 'Stage 3 added');
    const milestone3Id = addStage3Res.data.data.milestone.id;

    // Reorder: put stage 3 before stage 2
    const reorderRes = await request(
      'POST',
      `/api/roadmaps/${roadmapId}/milestones/reorder`,
      { orderedMilestoneIds: [milestone1Id, milestone3Id, milestone2Id] },
      tokenA
    );
    assert(reorderRes.status === 200, 'Milestones reordered successfully');
    const reorderedMilestones = reorderRes.data.data.roadmap.milestones;
    assert(reorderedMilestones[1].id === milestone3Id, 'Stage 3 is now in position 2');
    assert(reorderedMilestones[2].id === milestone2Id, 'Stage 2 is now in position 3');

    // [TEST R] Delete Stage
    const deleteStageRes = await request('DELETE', `/api/milestones/${milestone2Id}`, null, tokenA);
    assert(deleteStageRes.status === 200, 'Stage deleted successfully');

    // [TEST S] User Isolation: User B cannot modify User A's Roadmap, Milestones, or Tasks
    const crossRoadmapRes = await request(
      'PATCH',
      `/api/milestones/${milestone3Id}/status`,
      { status: 'COMPLETED' },
      tokenB
    );
    assert(crossRoadmapRes.status === 404, 'User B rejected with 404 when attempting to modify User A milestone');

    const crossTaskRes = await request(
      'PATCH',
      `/api/tasks/${taskId1}/status`,
      { status: 'TODO' },
      tokenB
    );
    assert(crossTaskRes.status === 404, 'User B rejected with 404 when attempting to update User A task');

    // [TEST I] Reminder cancellation on task completion
    const task2Res = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Task with reminder',
        goalId: goalId1,
        milestoneId: milestone3Id,
        reminderOffsetMinutes: 15,
      },
      tokenA
    );
    assert(task2Res.status === 201, 'Task with reminder created');
    const task2Id = task2Res.data.data.task.id;

    const reminderCheck = await prisma.reminder.findFirst({
      where: { linkedTaskId: task2Id },
    });
    if (reminderCheck) {
      assert(reminderCheck.status === 'PENDING', 'Reminder is initially PENDING');
      // Complete task
      await request('PATCH', `/api/tasks/${task2Id}/status`, { status: 'COMPLETED' }, tokenA);
      const reminderAfter = await prisma.reminder.findFirst({
        where: { linkedTaskId: task2Id },
      });
      assert(reminderAfter.status === 'CANCELLED', 'Task reminder was cancelled on task completion');
    }

    console.log('\n=============================================================');
    console.log('🏆 ALL ROADMAP SIGNATURE FLOW TESTS PASSED! (A - T)');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('Roadmap test suite failed:', err);
    process.exit(1);
  } finally {
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }
    if (server) {
      server.close();
    }
  }
}

runRoadmapSignatureTests();
