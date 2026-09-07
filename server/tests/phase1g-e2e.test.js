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

  await request(
    'POST',
    '/api/onboarding/complete',
    {
      situation: 'WORKING_PROFESSIONAL',
      targetRole: 'Full Stack Engineer',
      targetSalary: '$130,000',
      availableCareerMinutes: 120,
      confidenceScore: 3,
      timezone,
    },
    token
  );

  return token;
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🚀 STARTING PHASE 1G E2E REGRESSION SUITE');
  console.log('=============================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`Test server running on port ${port}`);
      resolve();
    });
  });

  const timestamp = Date.now();
  const userAEmail = `user1g_a_${timestamp}@careeros.local`;
  const userBEmail = `user1g_b_${timestamp}@careeros.local`;
  const password = 'Password123!';

  let tokenA;
  let tokenB;
  let userAId;
  let userBId;
  let testSkill;

  try {
    tokenA = await registerAndLogin(userAEmail, password, 'User 1G A', 'Asia/Kolkata');
    tokenB = await registerAndLogin(userBEmail, password, 'User 1G B', 'America/New_York');

    const meA = await request('GET', '/api/users/me', null, tokenA);
    userAId = meA.data.data?.user?.id || meA.data.data?.id;
    const meB = await request('GET', '/api/users/me', null, tokenB);
    userBId = meB.data.data?.user?.id || meB.data.data?.id;

    // Create a global skill for testing
    testSkill = await prisma.skill.upsert({
      where: { normalizedName: `react_1g_${timestamp}` },
      update: {},
      create: {
        name: `React 1G ${timestamp}`,
        normalizedName: `react_1g_${timestamp}`,
        category: 'TECHNICAL',
      },
    });

    // Create a Goal for User A
    const goalRes = await request(
      'POST',
      '/api/goals',
      {
        title: 'Senior Full Stack Role',
        type: 'JOB_SWITCH',
        priority: 'HIGH',
      },
      tokenA
    );
    const goalAId = goalRes.data.data?.goal?.id || goalRes.data.goal?.id || goalRes.data.data?.id;

    // Create a Goal for User B
    const goalBRes = await request(
      'POST',
      '/api/goals',
      {
        title: 'User B Goal',
        type: 'CAREER_CHANGE',
      },
      tokenB
    );
    const goalBId = goalBRes.data.data?.goal?.id || goalBRes.data.goal?.id || goalBRes.data.data?.id;

    // =============================================================
    // TEST GROUP 1: PROJECT CRUD, OWNERSHIP & FILTERING (Section 75)
    // =============================================================
    console.log('\n--- TEST GROUP 1: PROJECT CRUD, OWNERSHIP & FILTERING ---');

    // 1. Create project
    const createProjRes = await request(
      'POST',
      '/api/projects',
      {
        title: 'HRMS REST API',
        description: 'Employee management backend API in Node.js and PostgreSQL',
        projectType: 'PERSONAL',
        priority: 'HIGH',
        goalId: goalAId,
        problemStatement: 'Manual HR tracking causes payroll errors and record fragmentation.',
        objective: 'Build an automated REST API with role-based access control and audit logging.',
        repositoryUrl: 'https://github.com/user/hrms-api',
        liveUrl: 'https://hrms.example.app',
      },
      tokenA
    );
    assert(createProjRes.status === 201, 'Project created with 201 OK');
    const project1 = createProjRes.data.project;
    assert(project1.title === 'HRMS REST API', 'Project title matches');
    assert(project1.status === 'IDEA', 'Default status is IDEA');
    assert(project1.goalId === goalAId, 'Goal linked correctly');

    // 2. Cross-user goal linking must return safe 404 (Section 8)
    const crossGoalRes = await request(
      'POST',
      '/api/projects',
      {
        title: 'Cross Goal Project',
        goalId: goalBId, // Goal belongs to User B!
      },
      tokenA
    );
    assert(crossGoalRes.status === 404, 'Cross-user Goal linking returns safe 404 Not Found (Section 8)');

    // 3. Read project by ID
    const getProjRes = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    assert(getProjRes.status === 200, 'GET /api/projects/:id returns 200 OK');
    assert(getProjRes.data.project.id === project1.id, 'Fetched project matches created ID');

    // 4. Update project
    const updateProjRes = await request(
      'PUT',
      `/api/projects/${project1.id}`,
      {
        description: 'Updated HRMS backend specification',
        caseStudyUrl: 'https://hrms.example.app/case-study',
      },
      tokenA
    );
    assert(updateProjRes.status === 200, 'PUT /api/projects/:id returns 200 OK');
    assert(updateProjRes.data.project.description === 'Updated HRMS backend specification', 'Description updated');
    assert(updateProjRes.data.project.caseStudyUrl === 'https://hrms.example.app/case-study', 'Case study URL updated');

    // 5. Link skill to project (Section 9 & 36)
    const addSkillRes = await request(
      'POST',
      `/api/projects/${project1.id}/skills`,
      {
        skillId: testSkill.id,
        usageLevel: 'PRIMARY',
        notes: 'Core framework for dashboard',
      },
      tokenA
    );
    assert(addSkillRes.status === 201, 'POST /api/projects/:id/skills returns 201 OK');

    // 6. Duplicate skill prevention
    const dupSkillRes = await request(
      'POST',
      `/api/projects/${project1.id}/skills`,
      {
        skillId: testSkill.id,
        notes: 'Updated notes',
      },
      tokenA
    );
    assert(dupSkillRes.status === 201 || dupSkillRes.status === 200, 'Duplicate skill gracefully handled');

    // 7. Status changes
    const statusRes = await request(
      'PATCH',
      `/api/projects/${project1.id}/status`,
      { status: 'IN_PROGRESS' },
      tokenA
    );
    assert(statusRes.status === 200, 'PATCH /api/projects/:id/status to IN_PROGRESS returns 200 OK');
    assert(statusRes.data.project.status === 'IN_PROGRESS', 'Status updated to IN_PROGRESS');

    // 8. Search & Filters
    const listRes = await request('GET', '/api/projects?search=HRMS', null, tokenA);
    assert(listRes.status === 200, 'GET /api/projects with search returns 200 OK');
    assert(listRes.data.projects.some((p) => p.id === project1.id), 'Search found project by title');

    // =============================================================
    // TEST GROUP 2: PROJECT MILESTONES & PROGRESS CALCULATION (Section 76)
    // =============================================================
    console.log('\n--- TEST GROUP 2: PROJECT MILESTONES & PROGRESS (Section 76) ---');

    // 1. Zero milestones: progressPercent = null (Section 11)
    const zeroMilestoneRes = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    assert(zeroMilestoneRes.data.project.progressPercent === null, 'Zero milestones returns progressPercent = null (Section 11)');

    // 2. Exact fixture from Section 76:
    // 6 milestones: 4 completed, 1 skipped, 1 pending (TODO)
    // Expected denominator: 5 non-skipped. Progress = 4 / 5 = 80%.
    const m1 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M1 Auth', status: 'COMPLETED', order: 1 }, tokenA);
    const m2 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M2 Database', status: 'COMPLETED', order: 2 }, tokenA);
    const m3 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M3 APIs', status: 'COMPLETED', order: 3 }, tokenA);
    const m4 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M4 Tests', status: 'COMPLETED', order: 4 }, tokenA);
    const m5 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M5 Legacy Import', status: 'SKIPPED', order: 5 }, tokenA);
    const m6 = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'M6 Deployment', status: 'TODO', order: 6 }, tokenA);

    assert(m1.status === 201 && m6.status === 201, 'Created 6 milestones with exact statuses');

    // Fetch project and verify progress calculation
    const progressProjRes = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    const milestoneProgress = progressProjRes.data.project.milestoneProgress;
    assert(milestoneProgress.totalMilestones === 6, 'Total milestones count = 6');
    assert(milestoneProgress.completedMilestones === 4, 'Completed milestones count = 4');
    assert(milestoneProgress.nonSkippedMilestones === 5, 'Non-skipped milestones count = 5');
    assert(progressProjRes.data.project.progressPercent === 80, 'Progress calculated exactly as 4/5 = 80% (Section 76)');

    // 3. Milestone task conversion (Section 39)
    const taskConvRes = await request(
      'POST',
      `/api/projects/${project1.id}/milestones/${m6.data.milestone.id}/task`,
      { title: 'Deploy HRMS to Staging' },
      tokenA
    );
    assert(taskConvRes.status === 201, 'POST /milestones/:id/task creates actionable task');
    assert(taskConvRes.data.task.projectId === project1.id, 'Task linked to projectId');
    assert(taskConvRes.data.task.projectMilestoneId === m6.data.milestone.id, 'Task linked to projectMilestoneId');

    // Idempotent double submit check
    const taskConvDupRes = await request(
      'POST',
      `/api/projects/${project1.id}/milestones/${m6.data.milestone.id}/task`,
      { title: 'Deploy HRMS to Staging' },
      tokenA
    );
    assert(taskConvDupRes.data.task.id === taskConvRes.data.task.id, 'Task conversion is idempotent (no duplicates on double-click)');

    // =============================================================
    // TEST GROUP 3: PROJECT TASK & FOCUS SESSION TIME (Section 77)
    // =============================================================
    console.log('\n--- TEST GROUP 3: PROJECT TASK FOCUS SESSION TIME ---');

    const projectTask = taskConvRes.data.task;

    // Completed focus session (45 minutes)
    await prisma.focusSession.create({
      data: {
        userId: userAId,
        taskId: projectTask.id,
        status: 'COMPLETED',
        completed: true,
        actualMinutes: 45,
        durationMinutes: 45,
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(),
      },
    });

    // Incomplete/paused session (30 minutes) - should NOT be counted
    await prisma.focusSession.create({
      data: {
        userId: userAId,
        taskId: projectTask.id,
        status: 'PAUSED',
        completed: false,
        actualMinutes: 30,
        durationMinutes: 30,
        startedAt: new Date(),
      },
    });

    const projectDetailFocused = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    assert(projectDetailFocused.data.project.focusedMinutes === 45, 'Project focused minutes includes only COMPLETED sessions (45 min) (Section 77)');

    // =============================================================
    // TEST GROUP 4: EVIDENCE ENGINE CRUD, LINKING & SKILL NON-UPGRADE (Section 78)
    // =============================================================
    console.log('\n--- TEST GROUP 4: EVIDENCE ENGINE & SKILL NON-UPGRADE ---');

    // Record initial skill level
    const userSkillA = await prisma.userSkill.findFirst({
      where: { userId: userAId, skillId: testSkill.id },
    });
    const initialSkillLevel = userSkillA?.currentLevel || 1;

    // 1. Create Evidence
    const createEvRes = await request(
      'POST',
      '/api/evidence',
      {
        title: 'HRMS GitHub Repo',
        description: 'Production-ready Node.js API with comprehensive test coverage',
        evidenceType: 'GITHUB_REPOSITORY',
        url: 'https://github.com/user/hrms-api',
        projectId: project1.id,
        projectMilestoneId: m4.data.milestone.id,
        skillIds: [testSkill.id],
      },
      tokenA
    );
    assert(createEvRes.status === 201, 'POST /api/evidence creates evidence record');
    const evidence1 = createEvRes.data.evidence;
    assert(evidence1.evidenceType === 'GITHUB_REPOSITORY', 'Evidence type preserved');
    assert(evidence1.projectId === project1.id, 'Linked to project');

    // 2. Verify adding evidence did NOT silently change UserSkill.currentLevel (Section 19 & 78)
    const userSkillAfterEvidence = await prisma.userSkill.findFirst({
      where: { userId: userAId, skillId: testSkill.id },
    });
    const levelAfterEvidence = userSkillAfterEvidence?.currentLevel || 1;
    assert(levelAfterEvidence === initialSkillLevel, 'Adding evidence did NOT silently upgrade skill level (Section 19 & 78)');

    // 3. Filter evidence by projectId
    const evFilterRes = await request('GET', `/api/evidence?projectId=${project1.id}`, null, tokenA);
    assert(evFilterRes.status === 200, 'GET /api/evidence with projectId filter returns 200 OK');
    assert(evFilterRes.data.evidence.some((e) => e.id === evidence1.id), 'Evidence returned in filtered query');

    // 4. Update evidence
    const updateEvRes = await request(
      'PUT',
      `/api/evidence/${evidence1.id}`,
      {
        description: 'Updated repository description with benchmarks',
      },
      tokenA
    );
    assert(updateEvRes.status === 200, 'PUT /api/evidence/:id returns 200 OK');
    assert(updateEvRes.data.evidence.description === 'Updated repository description with benchmarks', 'Description updated');

    // =============================================================
    // TEST GROUP 5: DELIBERATE SKILL ASSESSMENT FROM EVIDENCE (Section 79)
    // =============================================================
    console.log('\n--- TEST GROUP 5: SKILL ASSESSMENT FROM EVIDENCE (Section 79) ---');

    // Set user skill current level to 2 initially
    await prisma.userSkill.upsert({
      where: { userId_skillId: { userId: userAId, skillId: testSkill.id } },
      update: { currentLevel: 2, targetLevel: 4 },
      create: { userId: userAId, skillId: testSkill.id, currentLevel: 2, targetLevel: 4 },
    });

    const assessRes = await request(
      'POST',
      '/api/evidence/assess-skill',
      {
        skillId: testSkill.id,
        newLevel: 3,
        notes: 'Demonstrated deep proficiency in backend architecture',
        evidenceText: 'HRMS GitHub Repo and test suites',
      },
      tokenA
    );
    assert(assessRes.status === 200, 'POST /api/evidence/assess-skill returns 200 OK');
    assert(assessRes.data.userSkill.currentLevel === 3, 'UserSkill level updated 2 -> 3 (Section 79)');

    const historyCount = await prisma.userSkillAssessmentHistory.count({
      where: {
        userId: userAId,
        skillId: testSkill.id,
        assessmentType: 'PROJECT_EVIDENCE',
      },
    });
    assert(historyCount >= 1, 'SkillAssessmentHistory record created via Phase 1E engine (Section 20 & 79)');

    // =============================================================
    // TEST GROUP 6: PORTFOLIO ENGINE & VISIBILITY TOGGLE (Section 80)
    // =============================================================
    console.log('\n--- TEST GROUP 6: PORTFOLIO VISIBILITY TOGGLE (Section 80) ---');

    // Project is currently isPortfolioVisible = false
    const portBeforeRes = await request('GET', '/api/projects?portfolio=true', null, tokenA);
    const inPortfolioBefore = portBeforeRes.data.projects.some((p) => p.id === project1.id);
    assert(!inPortfolioBefore, 'isPortfolioVisible = false project is NOT in portfolio view');

    // Toggle portfolio visible -> true
    const toggleTrueRes = await request('PATCH', `/api/projects/${project1.id}/portfolio`, { isPortfolioVisible: true }, tokenA);
    assert(toggleTrueRes.status === 200, 'PATCH /portfolio to true returns 200 OK');
    assert(toggleTrueRes.data.project.isPortfolioVisible === true, 'Project isPortfolioVisible is true');

    const portAfterRes = await request('GET', '/api/projects?portfolio=true', null, tokenA);
    const inPortfolioAfter = portAfterRes.data.projects.some((p) => p.id === project1.id);
    assert(inPortfolioAfter, 'Project is now returned in portfolio view (Section 80)');

    // Toggle portfolio visible -> false
    const toggleFalseRes = await request('PATCH', `/api/projects/${project1.id}/portfolio`, { isPortfolioVisible: false }, tokenA);
    assert(toggleFalseRes.status === 200, 'PATCH /portfolio to false returns 200 OK');

    const portAfterHideRes = await request('GET', '/api/projects?portfolio=true', null, tokenA);
    assert(!portAfterHideRes.data.projects.some((p) => p.id === project1.id), 'Project removed from portfolio view');

    // Project itself remains intact
    const intactCheck = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    assert(intactCheck.status === 200 && intactCheck.data.project.id === project1.id, 'Project itself remains completely intact (Section 80)');

    // Re-enable portfolio visibility for subsequent tests
    await request('PATCH', `/api/projects/${project1.id}/portfolio`, { isPortfolioVisible: true }, tokenA);

    // =============================================================
    // TEST GROUP 7: FACTUAL PORTFOLIO READINESS TEST (Section 81)
    // =============================================================
    console.log('\n--- TEST GROUP 7: PORTFOLIO READINESS CHECKLIST (Section 81) ---');

    // Fixture:
    // Description: yes
    // Problem Statement: yes
    // Skills: yes
    // Evidence: yes
    // Primary Link: yes
    // Case Study: no (clear caseStudyUrl)
    await request('PUT', `/api/projects/${project1.id}`, { caseStudyUrl: null }, tokenA);

    const readinessRes = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    const readiness = readinessRes.data.project.portfolioReadiness;
    assert(readiness.totalChecks === 6, 'Total checks is exactly 6');
    assert(readiness.completedChecks === 5, 'Exact 5 of 6 checks completed (Section 81)');
    assert(readiness.missingItems.includes('Case Study'), 'missingItems exactly contains "Case Study" (Section 81)');

    // Add case study -> 6 of 6
    await request('PUT', `/api/projects/${project1.id}`, { caseStudyUrl: 'https://example.com/case-study' }, tokenA);
    const readinessCompleteRes = await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    assert(readinessCompleteRes.data.project.portfolioReadiness.completedChecks === 6, 'All 6 of 6 checks complete');
    assert(readinessCompleteRes.data.project.portfolioReadiness.missingItems.length === 0, 'No missing items');

    // =============================================================
    // TEST GROUP 8: LEARNING ENGINE CRUD & PROGRESS (Section 82 & 83)
    // =============================================================
    console.log('\n--- TEST GROUP 8: LEARNING PATHS & PROGRESS ---');

    // 1. Create Learning Path
    const createPathRes = await request(
      'POST',
      '/api/learning',
      {
        title: 'Distributed Systems & Kafka',
        description: 'Master message brokers, partitions, and consumer groups',
        provider: 'Confluent & Architecture Blogs',
        category: 'Backend',
        estimatedHours: 25.0,
        skillId: testSkill.id,
        goalId: goalAId,
        status: 'IN_PROGRESS',
      },
      tokenA
    );
    assert(createPathRes.status === 201, 'POST /api/learning creates learning path');
    const path1 = createPathRes.data.path;
    assert(path1.status === 'IN_PROGRESS', 'Path status is IN_PROGRESS');

    // 2. Zero modules: progress = null (Section 83)
    const zeroPathRes = await request('GET', `/api/learning/${path1.id}`, null, tokenA);
    assert(zeroPathRes.data.path.progressPercent === null, 'Zero modules returns progressPercent = null (Section 83)');

    // 3. Exact fixture from Section 83:
    // 5 modules: 3 completed, 2 incomplete -> expected progress = 60%
    await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Kafka Architecture', status: 'COMPLETED', order: 1 }, tokenA);
    await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Partitions & Offsets', status: 'COMPLETED', order: 2 }, tokenA);
    await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Consumer Groups', status: 'COMPLETED', order: 3 }, tokenA);
    const mod4 = await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Idempotent Producers', status: 'IN_PROGRESS', order: 4 }, tokenA);
    await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Schema Registry', status: 'NOT_STARTED', order: 5 }, tokenA);

    const pathProgressRes = await request('GET', `/api/learning/${path1.id}`, null, tokenA);
    assert(pathProgressRes.data.path.progressPercent === 60, '5 modules (3 completed, 2 incomplete) = 60% progress (Section 83)');

    // =============================================================
    // TEST GROUP 9: LEARNING → TASK CONVERSION & FOCUSED MINUTES (Section 84)
    // =============================================================
    console.log('\n--- TEST GROUP 9: LEARNING TASK & FOCUSED MINUTES ---');

    const modTaskRes = await request(
      'POST',
      `/api/learning/${path1.id}/modules/${mod4.data.module.id}/task`,
      { title: 'Study Idempotent Producers' },
      tokenA
    );
    assert(modTaskRes.status === 201, 'POST /learning/:id/modules/:mId/task creates task (Section 30)');
    const learningTask = modTaskRes.data.task;
    assert(learningTask.learningModuleId === mod4.data.module.id, 'Task linked to learningModuleId');
    assert(learningTask.taskType === 'LEARNING', 'Task taskType is LEARNING');

    // Run completed focus session for 60 minutes on this learning task
    await prisma.focusSession.create({
      data: {
        userId: userAId,
        taskId: learningTask.id,
        status: 'COMPLETED',
        completed: true,
        actualMinutes: 60,
        durationMinutes: 60,
        startedAt: new Date(Date.now() - 3600000),
        endedAt: new Date(),
      },
    });

    // Run completed focus session for 30 minutes on an unrelated task
    const unrelatedTask = await prisma.task.create({
      data: {
        userId: userAId,
        title: 'Unrelated Routine Work',
        taskType: 'ROUTINE',
      },
    });
    await prisma.focusSession.create({
      data: {
        userId: userAId,
        taskId: unrelatedTask.id,
        status: 'COMPLETED',
        completed: true,
        actualMinutes: 30,
        durationMinutes: 30,
        startedAt: new Date(),
      },
    });

    const pathFocusedRes = await request('GET', `/api/learning/${path1.id}`, null, tokenA);
    assert(pathFocusedRes.data.path.focusedMinutes === 60, 'Learning path focused minutes includes only learning module sessions (60 min) (Section 84)');

    // =============================================================
    // TEST GROUP 10: CREATE PROJECT FROM LEARNING (Section 32)
    // =============================================================
    console.log('\n--- TEST GROUP 10: CREATE PROJECT FROM LEARNING ---');

    const projFromLearnRes = await request(
      'POST',
      `/api/learning/${path1.id}/create-project`,
      { title: 'Kafka Streaming Microservice' },
      tokenA
    );
    assert(projFromLearnRes.status === 201, 'POST /learning/:id/create-project returns 201 OK (Section 32)');
    assert(projFromLearnRes.data.project.title === 'Kafka Streaming Microservice', 'Project created with correct title');
    assert(projFromLearnRes.data.project.projectType === 'LEARNING', 'Project type is LEARNING');

    // =============================================================
    // TEST GROUP 11: DASHBOARD INTEGRATION & SIDE EFFECT FREEDOM (Section 85)
    // =============================================================
    console.log('\n--- TEST GROUP 11: DASHBOARD INTEGRATION & SIDE EFFECT FREEDOM ---');

    const dashRes = await request('GET', '/api/dashboard', null, tokenA);
    assert(dashRes.status === 200, 'GET /api/dashboard returns 200 OK');
    const dashData = dashRes.data.data || dashRes.data;
    assert(typeof dashData.activeProjects === 'number', 'Factual activeProjects returned (Section 85)');
    assert(typeof dashData.portfolioProjects === 'number', 'Factual portfolioProjects returned (Section 85)');
    assert(typeof dashData.evidenceCount === 'number', 'Factual evidenceCount returned (Section 85)');
    assert(typeof dashData.activeLearningPaths === 'number', 'Factual activeLearningPaths returned (Section 85)');
    assert(dashData.careerCheck.projects !== undefined, 'Career check includes projects (Section 57)');
    assert(dashData.careerCheck.learning !== undefined, 'Career check includes learning (Section 57)');

    // Zero side effects rule: Repeated GET requests must create ZERO new records (Section 69 & 85)
    const pCountBefore = await prisma.project.count({ where: { userId: userAId } });
    const mCountBefore = await prisma.projectMilestone.count({ where: { userId: userAId } });
    const tCountBefore = await prisma.task.count({ where: { userId: userAId } });
    const eCountBefore = await prisma.evidence.count({ where: { userId: userAId } });
    const lpCountBefore = await prisma.learningPath.count({ where: { userId: userAId } });

    await request('GET', '/api/dashboard', null, tokenA);
    await request('GET', '/api/projects', null, tokenA);
    await request('GET', `/api/projects/${project1.id}`, null, tokenA);
    await request('GET', '/api/learning', null, tokenA);
    await request('GET', `/api/learning/${path1.id}`, null, tokenA);
    await request('GET', '/api/evidence', null, tokenA);

    const pCountAfter = await prisma.project.count({ where: { userId: userAId } });
    const mCountAfter = await prisma.projectMilestone.count({ where: { userId: userAId } });
    const tCountAfter = await prisma.task.count({ where: { userId: userAId } });
    const eCountAfter = await prisma.evidence.count({ where: { userId: userAId } });
    const lpCountAfter = await prisma.learningPath.count({ where: { userId: userAId } });

    assert(pCountBefore === pCountAfter, 'Repeated GET created 0 new projects');
    assert(mCountBefore === mCountAfter, 'Repeated GET created 0 new milestones');
    assert(tCountBefore === tCountAfter, 'Repeated GET created 0 new tasks');
    assert(eCountBefore === eCountAfter, 'Repeated GET created 0 new evidence');
    assert(lpCountBefore === lpCountAfter, 'Repeated GET created 0 new learning paths');

    // =============================================================
    // TEST GROUP 12: DETERMINISTIC PROGRESS FIXTURE (Section 86)
    // =============================================================
    console.log('\n--- TEST GROUP 12: DETERMINISTIC PROGRESS FIXTURE (Section 86) ---');

    // Create a fresh test user with isolated records for the exact fixture
    const fixtureUserEmail = `fixture_user_${timestamp}@careeros.local`;
    const fixtureToken = await registerAndLogin(fixtureUserEmail, password, 'Fixture User', 'Asia/Kolkata');
    const meFix = await request('GET', '/api/users/me', null, fixtureToken);
    const fixUserId = meFix.data.data?.user?.id || meFix.data.data?.id;

    // Deterministic fixture requirements:
    // Projects completed = 2
    // Milestones completed = 6
    // Learning modules completed = 4
    // Learning focus minutes = 180
    // Evidence added = 5
    // Portfolio projects = 3

    const now = new Date();

    // 1. Projects completed = 2 (and 1 more visible so portfolio projects = 3)
    const fp1 = await prisma.project.create({
      data: {
        userId: fixUserId,
        title: 'Fix Project 1',
        status: 'COMPLETED',
        completedAt: now,
        isPortfolioVisible: true,
      },
    });
    const fp2 = await prisma.project.create({
      data: {
        userId: fixUserId,
        title: 'Fix Project 2',
        status: 'COMPLETED',
        completedAt: now,
        isPortfolioVisible: true,
      },
    });
    const fp3 = await prisma.project.create({
      data: {
        userId: fixUserId,
        title: 'Fix Project 3 (Active Portfolio)',
        status: 'IN_PROGRESS',
        isPortfolioVisible: true,
      },
    });

    // 2. Milestones completed = 6
    for (let i = 1; i <= 6; i++) {
      await prisma.projectMilestone.create({
        data: {
          userId: fixUserId,
          projectId: fp1.id,
          title: `Milestone ${i}`,
          status: 'COMPLETED',
          completedAt: now,
          order: i,
        },
      });
    }

    // 3. Learning modules completed = 4
    const fixPath = await prisma.learningPath.create({
      data: {
        userId: fixUserId,
        title: 'Fix Learning Path',
        status: 'IN_PROGRESS',
      },
    });

    const fixModules = [];
    for (let i = 1; i <= 4; i++) {
      const lm = await prisma.learningModule.create({
        data: {
          userId: fixUserId,
          learningPathId: fixPath.id,
          title: `Fix Module ${i}`,
          status: 'COMPLETED',
          completedAt: now,
          isCompleted: true,
          order: i,
        },
      });
      fixModules.push(lm);
    }

    // 4. Learning focus minutes = 180 (3 completed sessions of 60 mins each on learning tasks)
    for (let i = 0; i < 3; i++) {
      const lTask = await prisma.task.create({
        data: {
          userId: fixUserId,
          title: `Study Session Task ${i + 1}`,
          taskType: 'LEARNING',
          learningModuleId: fixModules[i].id,
        },
      });
      await prisma.focusSession.create({
        data: {
          userId: fixUserId,
          taskId: lTask.id,
          status: 'COMPLETED',
          completed: true,
          actualMinutes: 60,
          durationMinutes: 60,
          startedAt: now,
        },
      });
    }

    // 5. Evidence added = 5
    for (let i = 1; i <= 5; i++) {
      await prisma.evidence.create({
        data: {
          userId: fixUserId,
          title: `Evidence ${i}`,
          evidenceType: 'GITHUB_REPOSITORY',
          createdAt: now,
        },
      });
    }

    const progRes = await request('GET', '/api/progress?period=this_week', null, fixtureToken);
    assert(progRes.status === 200, 'GET /api/progress returns 200 OK');

    const progData = progRes.data.data || progRes.data;
    const pMetrics = progData.metrics;
    assert(pMetrics.projectsCompleted === 2, `Projects completed is exactly 2 (got ${pMetrics?.projectsCompleted}) (Section 86)`);
    assert(pMetrics.projectMilestonesCompleted === 6, `Project milestones completed is exactly 6 (got ${pMetrics?.projectMilestonesCompleted}) (Section 86)`);
    assert(pMetrics.learningModulesCompleted === 4, `Learning modules completed is exactly 4 (got ${pMetrics?.learningModulesCompleted}) (Section 86)`);
    assert(pMetrics.learningFocusMinutes === 180, `Learning focus minutes is exactly 180 (got ${pMetrics?.learningFocusMinutes}) (Section 86)`);
    assert(pMetrics.evidenceAdded === 5, `Evidence added is exactly 5 (got ${pMetrics?.evidenceAdded}) (Section 86)`);
    assert(pMetrics.portfolioProjects === 3, `Portfolio projects is exactly 3 (got ${pMetrics?.portfolioProjects}) (Section 86)`);

    // =============================================================
    // TEST GROUP 13: WEEKLY REVIEW SNAPSHOT & IMMUTABILITY (Section 87)
    // =============================================================
    console.log('\n--- TEST GROUP 13: WEEKLY REVIEW SNAPSHOT IMMUTABILITY ---');

    const curReviewRes = await request('GET', '/api/reviews/weekly/current', null, fixtureToken);
    assert(curReviewRes.status === 200, 'GET /api/reviews/weekly/current returns 200 OK');
    const curReviewData = curReviewRes.data.data || curReviewRes.data;
    const reviewObj = curReviewData.review;
    assert(curReviewData.currentFacts.projects.projectsCompleted === 2, 'Weekly review currentFacts projectsCompleted matches');
    assert(curReviewData.currentFacts.learning.modulesCompleted === 4, 'Weekly review currentFacts modulesCompleted matches');

    // Complete weekly review to freeze snapshot
    const completeRes = await request(
      'POST',
      `/api/reviews/weekly/${reviewObj.id}/complete`,
      { wins: 'Completed 2 projects and kafka learning' },
      fixtureToken
    );
    assert(completeRes.status === 200, 'Complete weekly review returns 200 OK');
    const completeData = completeRes.data.data || completeRes.data;
    const snapshot = completeData.review.metricsSnapshot;
    assert(snapshot.projects.projectsCompleted === 2, 'Snapshot contains projectsCompleted = 2');
    assert(snapshot.learning.modulesCompleted === 4, 'Snapshot contains modulesCompleted = 4');
    assert(snapshot.evidence.added === 5, 'Snapshot contains evidence added = 5');

    // Now modify records afterward (add another completed project)
    await prisma.project.create({
      data: {
        userId: fixUserId,
        title: 'Project Created After Review Complete',
        status: 'COMPLETED',
        completedAt: now,
      },
    });

    // Re-fetch completed review: Historical snapshot must remain unchanged! (Section 61 & 87)
    const refetchedReview = await request('GET', `/api/reviews/weekly/${reviewObj.id}`, null, fixtureToken);
    const refetchedData = refetchedReview.data.data || refetchedReview.data;
    const frozenSnapshot = refetchedData.review?.metricsSnapshot || refetchedData.metricsSnapshot;
    assert(frozenSnapshot.projects.projectsCompleted === 2, 'Historical snapshot remained completely frozen (still 2, not 3) (Section 87)');

    // =============================================================
    // TEST GROUP 14: STRICT USER ISOLATION (Section 70)
    // =============================================================
    console.log('\n--- TEST GROUP 14: STRICT USER ISOLATION ---');

    // User B attempts to read User A's project -> 404
    const isoProjRead = await request('GET', `/api/projects/${project1.id}`, null, tokenB);
    assert(isoProjRead.status === 404, 'User B GET User A project returns safe 404 Not Found (Section 70)');

    // User B attempts to update User A's project -> 404
    const isoProjUpdate = await request('PUT', `/api/projects/${project1.id}`, { title: 'Hacked' }, tokenB);
    assert(isoProjUpdate.status === 404, 'User B PUT User A project returns safe 404 Not Found');

    // User B attempts to add milestone to User A's project -> 404
    const isoAddMilestone = await request('POST', `/api/projects/${project1.id}/milestones`, { title: 'Hacked Milestone' }, tokenB);
    assert(isoAddMilestone.status === 404, 'User B POST milestone to User A project returns safe 404');

    // User B attempts to create task on User A's milestone -> 404
    const isoMilestoneTask = await request('POST', `/api/projects/${project1.id}/milestones/${m1.data.milestone.id}/task`, {}, tokenB);
    assert(isoMilestoneTask.status === 404, 'User B create task on User A milestone returns safe 404');

    // User B attempts to read User A's evidence -> 404
    const isoEvRead = await request('GET', `/api/evidence/${evidence1.id}`, null, tokenB);
    assert(isoEvRead.status === 404, 'User B GET User A evidence returns safe 404');

    // User B attempts to read User A's learning path -> 404
    const isoLpRead = await request('GET', `/api/learning/${path1.id}`, null, tokenB);
    assert(isoLpRead.status === 404, 'User B GET User A learning path returns safe 404');

    // User B attempts to add module to User A's learning path -> 404
    const isoAddMod = await request('POST', `/api/learning/${path1.id}/modules`, { title: 'Hacked Module' }, tokenB);
    assert(isoAddMod.status === 404, 'User B add module to User A learning path returns safe 404');

    // Unauthenticated requests return 401
    const unauthProj = await request('GET', '/api/projects');
    assert(unauthProj.status === 401, 'Unauthenticated GET /api/projects returns 401');

    console.log('\n=============================================================');
    console.log(`🎉 ALL PHASE 1G E2E TESTS COMPLETED: ${testsPassed} PASS, ${testsFailed} FAIL`);
    console.log('=============================================================\n');
  } finally {
    if (server) {
      server.close();
    }
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
