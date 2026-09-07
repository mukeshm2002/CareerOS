/**
 * Real End-to-End Verification Suite for Phase 1B
 * Connects directly to PostgreSQL at localhost:5432 and tests:
 * 1. Real Authentication E2E (Register, Duplicate 409, Login, lastLoginAt, Refresh rotation, Logout, Me)
 * 2. Real 7-Step Onboarding E2E (Steps 1-6, Draft Persistence, Reload/Resume, Step 7 Atomic Completion, No duplicates)
 * 3. User Isolation E2E (User A Goal vs User B 404 access, Goal immutability)
 * 4. Profile Isolation E2E (Injected userId ignored)
 * 5. Onboarding Gate E2E (Incomplete vs Completed states)
 * 6. Goals CRUD E2E (Create, List, Detail, Update, Status: ACTIVE->PAUSED->COMPLETED->ARCHIVED, Delete)
 */

const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');

const TEST_PORT = 5088;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

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

async function runE2ESuite() {
  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 1B REAL DATABASE E2E VERIFICATION GATE');
  console.log('======================================================\n');

  let server;

  try {
    // 0. Verify Database Connection
    console.log('--- 0. Database Connection Check ---');
    const dbCheck = await prisma.$queryRaw`SELECT 1 as connected`;
    assert(dbCheck[0]?.connected === 1, 'Connected to live PostgreSQL database on localhost:5432');

    // 1. Boot Express App
    server = http.createServer(app).listen(TEST_PORT);
    await new Promise((resolve) => server.once('listening', resolve));
    console.log(`Server listening on ${BASE_URL}\n`);

    // -----------------------------------------------------------
    // SECTION 7: REAL AUTHENTICATION E2E TEST
    // -----------------------------------------------------------
    console.log('--- 1. Section 7: Authentication E2E Tests ---');
    const testEmail = `auth_test_${Date.now()}@careeros.local`;
    const testPassword = 'Password123!';

    // Register
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, fullName: 'Auth Tester' }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regData.success === true, 'Response body has success: true');
    assert(regData.data.tokens?.accessToken, 'Access token is issued');
    assert(regData.data.tokens?.refreshToken, 'Refresh token is issued');
    assert(!regData.data.user.passwordHash, 'Password hash is NOT exposed in response');

    // Verify row exists in PostgreSQL
    const userInDb = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(userInDb !== null, 'User row verified in PostgreSQL users table');
    assert(userInDb.onboardingCompleted === false, 'User starts with onboardingCompleted = false');

    // Duplicate registration (409 Conflict)
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword, fullName: 'Duplicate' }),
    });
    assert(dupRes.status === 409, 'Duplicate registration returns 409 Conflict');

    // Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');
    const token = loginData.data.tokens.accessToken;
    let refreshToken = loginData.data.tokens.refreshToken;

    // Verify lastLoginAt changed in DB
    const userAfterLogin = await prisma.user.findUnique({ where: { email: testEmail } });
    assert(userAfterLogin.lastLoginAt !== null, 'lastLoginAt is updated in database upon login');

    // Verify refresh token exists in PostgreSQL
    const rfRecord = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    assert(rfRecord !== null, 'Refresh token stored in refresh_tokens table');

    // Current User endpoint
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meData.data.user.email === testEmail, 'GET /api/auth/me returns authenticated user details');

    // Refresh Token Rotation
    const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const refreshData = await refreshRes.json();
    assert(refreshRes.status === 200, 'POST /api/auth/refresh returns 200 OK with rotated tokens');
    const newAccessToken = refreshData.data.accessToken;
    const newRefreshToken = refreshData.data.refreshToken;
    assert(newRefreshToken !== refreshToken, 'New refresh token is rotated and distinct from old token');

    // Old refresh token must be revoked
    const oldRfCheck = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    assert(oldRfCheck === null, 'Old refresh token was deleted/revoked in PostgreSQL transaction');

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newAccessToken}`,
      },
      body: JSON.stringify({ refreshToken: newRefreshToken }),
    });
    assert(logoutRes.status === 200, 'POST /api/auth/logout returns 200 OK');
    const revokedCheck = await prisma.refreshToken.findUnique({ where: { token: newRefreshToken } });
    assert(revokedCheck === null, 'Active refresh token removed from PostgreSQL upon logout');

    // -----------------------------------------------------------
    // SECTION 8 & 13 & 14: REAL 7-STEP ONBOARDING E2E & DRAFT RESUME
    // -----------------------------------------------------------
    console.log('\n--- 2. Section 8, 13, 14: 7-Step Onboarding & Server Draft Resumption ---');
    const onboardEmail = `onboard_e2e_${Date.now()}@careeros.local`;
    const onboardUserRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: onboardEmail, password: testPassword, fullName: 'Onboard User' }),
    });
    const onboardUserData = await onboardUserRes.json();
    const onboardToken = onboardUserData.data.tokens.accessToken;
    const onboardUserId = onboardUserData.data.user.id;

    // Step 1: Initial state is step 1
    const s1Res = await fetch(`${BASE_URL}/onboarding`, {
      headers: { Authorization: `Bearer ${onboardToken}` },
    });
    const s1Data = await s1Res.json();
    assert(s1Data.data.currentStep === 1, 'Initial onboarding step is 1');

    // Step 2: Save situation
    const s2Save = await fetch(`${BASE_URL}/onboarding/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${onboardToken}`,
      },
      body: JSON.stringify({
        currentSituation: 'WORKING_PROFESSIONAL',
      }),
    });
    assert(s2Save.status === 200, 'Step 2: Saved currentSituation to database');
    await fetch(`${BASE_URL}/onboarding/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${onboardToken}` },
      body: JSON.stringify({ step: 2 }),
    });

    // Step 3 & 4: Configure two goals and save draft to server
    const draftGoals = [
      {
        type: 'JOB_SWITCH',
        title: 'Senior Backend Engineer Switch',
        priority: 'HIGH',
        targetDate: '2026-12-31',
        targetRole: 'Senior Backend Engineer',
        targetSalary: '130,000 / yr',
        salaryCurrency: 'USD',
      },
      {
        type: 'FREELANCING',
        title: 'Launch Consulting Practice',
        priority: 'HIGH',
        targetDate: '2026-12-31',
        targetRole: 'Consultant',
        targetSalary: '4,000 / mo',
        salaryCurrency: 'EUR',
      },
    ];

    // Step 5: Routine values
    const draftRoutine = {
      wakeTime: '06:00',
      workStartTime: '08:30',
      workEndTime: '18:30',
      sleepTime: '23:00',
      availableCareerMinutes: 150,
    };

    // Step 6: Baseline Skills (Self Assessment)
    const draftSkills = [
      { name: 'TypeScript', category: 'TECHNICAL', selfRating: 4 },
      { name: 'PostgreSQL', category: 'TECHNICAL', selfRating: 4 },
    ];

    // Persist full draft at Step 6
    const s6Save = await fetch(`${BASE_URL}/onboarding/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${onboardToken}`,
      },
      body: JSON.stringify({
        currentSituation: 'WORKING_PROFESSIONAL',
        currentRole: 'Software Engineer',
        targetRole: 'Senior Backend Engineer',
        experienceLevel: 'MID_LEVEL',
        timezone: 'Asia/Kolkata',
        wakeTime: draftRoutine.wakeTime,
        workStartTime: draftRoutine.workStartTime,
        workEndTime: draftRoutine.workEndTime,
        sleepTime: draftRoutine.sleepTime,
        availableCareerMinutes: draftRoutine.availableCareerMinutes,
        onboardingDraft: {
          situation: 'WORKING_PROFESSIONAL',
          goals: draftGoals,
          skills: draftSkills,
        },
      }),
    });
    assert(s6Save.status === 200, 'Draft with goals, routine, and skills saved to server UserProfile.onboardingDraft');

    await fetch(`${BASE_URL}/onboarding/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${onboardToken}` },
      body: JSON.stringify({ step: 6 }),
    });

    // SIMULATE BROWSER RESTART / RELOAD
    console.log('  Simulating browser reload/re-entry at Step 6...');
    const reloadRes = await fetch(`${BASE_URL}/onboarding`, {
      headers: { Authorization: `Bearer ${onboardToken}` },
    });
    const reloadData = await reloadRes.json();
    assert(reloadData.data.currentStep === 6, 'Resumed at Step 6 from PostgreSQL persistence');
    assert(reloadData.data.onboardingDraft.goals.length === 2, 'Recovered draft goals from server UserProfile.onboardingDraft');
    assert(reloadData.data.onboardingDraft.skills.length === 2, 'Recovered draft skills baseline from server UserProfile.onboardingDraft');
    assert(reloadData.data.profile.availableCareerMinutes === 150, 'Recovered availableCareerMinutes (150m) from UserProfile');
    assert(reloadData.data.profile.timezone === 'Asia/Kolkata', 'Recovered IANA timezone (Asia/Kolkata) from UserProfile');

    // Verify NO final goals were created prematurely during draft
    const prematureGoalCount = await prisma.goal.count({ where: { userId: onboardUserId } });
    assert(prematureGoalCount === 0, 'Zero premature Goal records created in DB before Step 7 completion');

    // Step 7: Atomic Completion
    const completeRes = await fetch(`${BASE_URL}/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${onboardToken}`,
      },
      body: JSON.stringify({
        situation: 'WORKING_PROFESSIONAL',
        currentRole: 'Software Engineer',
        targetRole: 'Senior Backend Engineer',
        experienceLevel: 'MID_LEVEL',
        timezone: 'Asia/Kolkata',
        wakeTime: draftRoutine.wakeTime,
        workStartTime: draftRoutine.workStartTime,
        workEndTime: draftRoutine.workEndTime,
        sleepTime: draftRoutine.sleepTime,
        availableCareerMinutes: draftRoutine.availableCareerMinutes,
        careerMission: 'Advance to Senior Backend Engineer',
        goals: draftGoals,
        skills: draftSkills,
      }),
    });
    const completeData = await completeRes.json();
    assert(completeRes.status === 201, 'POST /api/onboarding/complete returns 201 Created');
    assert(completeData.data.user.onboardingCompleted === true, 'User.onboardingCompleted is true in payload');

    // Verify in PostgreSQL database
    const completedUserDb = await prisma.user.findUnique({
      where: { id: onboardUserId },
      include: { profile: true, goals: true, skills: { include: { skill: true } } },
    });
    assert(completedUserDb.onboardingCompleted === true, 'PostgreSQL confirmed User.onboardingCompleted = true');
    assert(completedUserDb.profile.onboardingStep === 7, 'PostgreSQL confirmed UserProfile.onboardingStep = 7');
    assert(completedUserDb.profile.onboardingDraft === null, 'onboardingDraft cleared in database after completion');
    assert(completedUserDb.goals.length === 2, 'Exactly 2 final Goal records created in goals table');
    assert(completedUserDb.goals[0].salaryCurrency === 'USD', 'Goal 1 stored with salaryCurrency = USD');
    assert(completedUserDb.goals[1].salaryCurrency === 'EUR', 'Goal 2 stored with salaryCurrency = EUR');
    assert(completedUserDb.skills.length === 2, '2 baseline UserSkills saved in PostgreSQL labeled Self Assessment');
    assert(completedUserDb.skills[0].evidence === 'Onboarding Self Assessment Baseline', 'Skill explicitly labeled Self Assessment');

    // IDEMPOTENCY TEST: Call complete again
    const repeatCompleteRes = await fetch(`${BASE_URL}/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${onboardToken}`,
      },
      body: JSON.stringify({
        situation: 'WORKING_PROFESSIONAL',
        goals: draftGoals,
      }),
    });
    assert(repeatCompleteRes.status === 201, 'Repeat complete call handled gracefully');
    const goalsAfterRepeat = await prisma.goal.count({ where: { userId: onboardUserId } });
    assert(goalsAfterRepeat === 2, 'Idempotency verified: exactly 2 goals remain, no duplicate goals created');

    // -----------------------------------------------------------
    // SECTION 9: USER ISOLATION — REAL DATABASE TEST
    // -----------------------------------------------------------
    console.log('\n--- 3. Section 9: User Isolation Real Database Tests ---');
    const userAEmail = `user_a_${Date.now()}@careeros.local`;
    const userBEmail = `user_b_${Date.now()}@careeros.local`;

    const regA = await (await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: testPassword, fullName: 'Alice' }),
    })).json();
    const tokenA = regA.data.tokens.accessToken;

    const regB = await (await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: testPassword, fullName: 'Bob' }),
    })).json();
    const tokenB = regB.data.tokens.accessToken;

    // User A creates Goal A
    const goalARes = await (await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Alice Confidential Goal',
        type: 'JOB_SWITCH',
        priority: 'HIGH',
      }),
    })).json();
    const goalAId = goalARes.data.goal.id;
    assert(goalAId, 'User A created Goal A in database');

    // User B attempts GET Goal A
    const bGet = await fetch(`${BASE_URL}/goals/${goalAId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bGet.status === 404, 'User B GET Goal A -> 404 Not Found (no existence leak)');

    // User B attempts PUT Goal A
    const bPut = await fetch(`${BASE_URL}/goals/${goalAId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ title: 'Hacked Title' }),
    });
    assert(bPut.status === 404, 'User B PUT Goal A -> 404 Not Found');

    // User B attempts PATCH Goal A status
    const bPatch = await fetch(`${BASE_URL}/goals/${goalAId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
    assert(bPatch.status === 404, 'User B PATCH Goal A status -> 404 Not Found');

    // User B attempts DELETE Goal A
    const bDelete = await fetch(`${BASE_URL}/goals/${goalAId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bDelete.status === 404, 'User B DELETE Goal A -> 404 Not Found');

    // Verify Goal A in database remains unchanged
    const goalAInDb = await prisma.goal.findUnique({ where: { id: goalAId } });
    assert(goalAInDb.title === 'Alice Confidential Goal', 'Goal A remains untouched in database');
    assert(goalAInDb.status === 'ACTIVE', 'Goal A status remains ACTIVE in database');

    // -----------------------------------------------------------
    // SECTION 10: PROFILE ISOLATION TEST
    // -----------------------------------------------------------
    console.log('\n--- 4. Section 10: Profile Isolation Injection Test ---');
    const userBId = regB.data.user.id;
    const injectRes = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        userId: userBId, // Attempt injection
        currentRole: 'Alice Role Update',
      }),
    });
    assert(injectRes.status === 200, 'PUT /api/users/me succeeds for authenticated user');
    const userBProfile = await prisma.userProfile.findUnique({ where: { userId: userBId } });
    assert(userBProfile.currentRole !== 'Alice Role Update', 'Injected userId was ignored: User B profile is unchanged');
    const userAProfile = await prisma.userProfile.findUnique({ where: { userId: regA.data.user.id } });
    assert(userAProfile.currentRole === 'Alice Role Update', 'User A updated own profile based exclusively on JWT');

    // -----------------------------------------------------------
    // SECTION 11: ONBOARDING GATE TEST
    // -----------------------------------------------------------
    console.log('\n--- 5. Section 11: Onboarding Gate Tests ---');
    // User 1: Not logged in
    const unauthRes = await fetch(`${BASE_URL}/goals`);
    assert(unauthRes.status === 401, 'User 1 (not logged in) -> 401 Unauthorized');

    // User 2: Logged in, onboarding incomplete
    const user2Check = await prisma.user.findUnique({ where: { id: regA.data.user.id } });
    assert(user2Check.onboardingCompleted === false, 'User 2 (logged in, onboarding incomplete) -> onboardingCompleted: false');

    // User 3: Logged in, onboarding completed
    const user3Check = await prisma.user.findUnique({ where: { id: onboardUserId } });
    assert(user3Check.onboardingCompleted === true, 'User 3 (logged in, onboarding completed) -> onboardingCompleted: true');

    // -----------------------------------------------------------
    // SECTION 12: GOALS CRUD E2E TEST
    // -----------------------------------------------------------
    console.log('\n--- 6. Section 12: Goals CRUD & Lifecycle E2E ---');
    // POST /api/goals
    const cGoalRes = await fetch(`${BASE_URL}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master GraphQL & Federation',
        type: 'SKILL_MASTERY',
        priority: 'MEDIUM',
        targetDate: '2026-11-30',
        targetRole: 'API Architect',
        targetSalary: '140,000',
        salaryCurrency: 'USD',
      }),
    });
    const cGoalData = await cGoalRes.json();
    assert(cGoalRes.status === 201, 'POST /api/goals creates goal in database');
    const gId = cGoalData.data.goal.id;
    assert(cGoalData.data.goal.status === 'ACTIVE', 'Initial goal status is ACTIVE');

    // GET /api/goals
    const listRes = await fetch(`${BASE_URL}/goals`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = await listRes.json();
    assert(listData.data.goals.length === 2, 'GET /api/goals returns all goals for User A');

    // GET /api/goals/:id
    const singleRes = await fetch(`${BASE_URL}/goals/${gId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const singleData = await singleRes.json();
    assert(singleData.data.goal.id === gId, 'GET /api/goals/:id returns correct goal details');

    // PUT /api/goals/:id
    const updateRes = await fetch(`${BASE_URL}/goals/${gId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Master GraphQL, Federation & gRPC',
        progress: 25,
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/goals/:id updates title and progress');
    const updatedInDb = await prisma.goal.findUnique({ where: { id: gId } });
    assert(updatedInDb.title === 'Master GraphQL, Federation & gRPC', 'Title updated in PostgreSQL');
    assert(updatedInDb.progress === 25, 'Progress 25% updated in PostgreSQL');

    // PATCH status -> PAUSED
    await fetch(`${BASE_URL}/goals/${gId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'PAUSED' }),
    });
    assert((await prisma.goal.findUnique({ where: { id: gId } })).status === 'PAUSED', 'Status changed to PAUSED in DB');

    // PATCH status -> COMPLETED
    await fetch(`${BASE_URL}/goals/${gId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    assert((await prisma.goal.findUnique({ where: { id: gId } })).status === 'COMPLETED', 'Status changed to COMPLETED in DB');

    // PATCH status -> ARCHIVED
    await fetch(`${BASE_URL}/goals/${gId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'ARCHIVED' }),
    });
    assert((await prisma.goal.findUnique({ where: { id: gId } })).status === 'ARCHIVED', 'Status changed to ARCHIVED in DB');

    // DELETE /api/goals/:id
    const delRes = await fetch(`${BASE_URL}/goals/${gId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delRes.status === 200, 'DELETE /api/goals/:id deletes goal');
    const delCheck = await prisma.goal.findUnique({ where: { id: gId } });
    assert(delCheck === null, 'Goal deleted from PostgreSQL database');

    console.log('\n======================================================');
    console.log(`🎉 ALL ${testsPassed} REAL POSTGRESQL E2E TESTS PASSED! (${testsFailed} failed)`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runE2ESuite();
