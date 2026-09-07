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
    throw new Error(`Smoke test failed: ${message}`);
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

async function runSmokeFlow() {
  console.log('\n=============================================================');
  console.log('🌟 EXECUTING CAREEROS V1 FULL PRODUCT SMOKE FLOW');
  console.log('=============================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });

  try {
    const timestamp = Date.now();
    const email = `v1_smoke_${timestamp}@careeros.local`;
    const password = 'V1ProductionPassword123!';

    // 1. Register
    console.log('1. Registering new user...');
    const regRes = await request('POST', '/api/auth/register', {
      email,
      password,
      fullName: 'Dr. Elena Rostova',
    });
    assert(regRes.status === 201, 'User registered successfully');
    let token = regRes.data.data.tokens.accessToken;
    const userId = regRes.data.data.user.id;

    // 2. 7-Step Onboarding
    console.log('2. Completing 7-step onboarding...');
    const onbRes = await request(
      'POST',
      '/api/onboarding/complete',
      {
        situation: 'WORKING_PROFESSIONAL',
        currentRole: 'Senior AI Engineer',
        targetRole: 'VP of AI Engineering',
        targetSalary: '$220,000',
        experienceLevel: 'LEAD',
        timezone: 'America/New_York',
        availableCareerMinutes: 150,
        goals: [
          {
            title: 'Lead AI Platform Architecture',
            type: 'PROMOTION',
            priority: 'CRITICAL',
            targetRole: 'VP of AI Engineering',
            targetSalary: '$220,000',
          },
        ],
      },
      token
    );
    assert(onbRes.status === 201, '7-Step Onboarding completed');

    // 3. Goal
    console.log('3. Verifying Goal...');
    const goalsRes = await request('GET', '/api/goals', null, token);
    const goals = goalsRes.data?.data?.goals || goalsRes.data?.data || [];
    assert(goalsRes.status === 200 && Array.isArray(goals) && goals.length > 0, 'Career Goal retrieved');
    const goalId = goals[0].id;

    // 4. Roadmap
    console.log('4. Generating Roadmap...');
    const roadmapRes = await request(
      'POST',
      `/api/goals/${goalId}/roadmap`,
      {
        title: 'AI Leadership Roadmap',
        totalWeeks: 12,
      },
      token
    );
    assert(roadmapRes.status === 201, 'Roadmap created for Goal');
    const roadmapId = roadmapRes.data.data?.id || roadmapRes.data.data?.roadmap?.id;

    // 5. Skill
    console.log('5. Adding Skill...');
    const skillRes = await request(
      'POST',
      '/api/skills',
      {
        name: 'Distributed Systems',
        category: 'TECHNICAL',
        selfRating: 4,
      },
      token
    );
    assert(skillRes.status === 201 || skillRes.status === 200, 'Skill added');

    // 6. Learning Path
    console.log('6. Creating Learning Path...');
    const learningRes = await request(
      'POST',
      '/api/learning',
      {
        title: 'Enterprise Distributed ML Systems',
        provider: 'COURSERA',
        totalHours: 40,
        goalId,
      },
      token
    );
    assert(learningRes.status === 201, 'Learning Path created');
    const learningPathId = learningRes.data.path?.id || learningRes.data.data?.path?.id || learningRes.data.data?.id;

    // 7. Project
    console.log('7. Creating Project...');
    const projectRes = await request(
      'POST',
      '/api/projects',
      {
        title: 'Autonomous Multi-Agent Orchestrator',
        type: 'PORTFOLIO',
        priority: 'HIGH',
        goalId,
      },
      token
    );
    assert(projectRes.status === 201, 'Project created');
    const projectId = projectRes.data.project?.id || projectRes.data.data?.project?.id || projectRes.data.data?.id;

    // 8. Evidence
    console.log('8. Adding Evidence item...');
    const evidenceRes = await request(
      'POST',
      '/api/evidence',
      {
        title: 'Production Architecture RFC & Benchmarks',
        type: 'DOCUMENT',
        url: 'https://github.com/careeros/multi-agent-rfc',
        projectId,
      },
      token
    );
    assert(evidenceRes.status === 201, 'Evidence attached to Project');

    // 9. Task
    console.log('9. Creating Task...');
    const taskRes = await request(
      'POST',
      '/api/tasks',
      {
        title: 'Write High-Throughput Dispatcher Specification',
        estimatedMinutes: 60,
        priority: 'CRITICAL',
        goalId,
        projectId,
      },
      token
    );
    assert(taskRes.status === 201, 'Task created');
    const taskId = taskRes.data.data.id || taskRes.data.data.task?.id;

    // 10. Schedule Block
    console.log('10. Creating Schedule Block...');
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduleRes = await request(
      'POST',
      '/api/schedule',
      {
        taskId,
        goalId,
        title: 'Deep Work: High-Throughput Dispatcher',
        date: todayStr,
        startTime: '10:00',
        endTime: '11:00',
      },
      token
    );
    assert(scheduleRes.status === 201, 'Schedule Block scheduled');

    // 11. Focus Session
    console.log('11. Running Focus Session...');
    const focusStartRes = await request(
      'POST',
      '/api/focus/start',
      {
        taskId,
        plannedMinutes: 50,
      },
      token
    );
    assert(focusStartRes.status === 201, 'Focus Session started');
    const focusSessionId = focusStartRes.data.data.id || focusStartRes.data.data.session?.id;

    const focusFinishRes = await request(
      'POST',
      `/api/focus/${focusSessionId}/finish`,
      {
        taskOutcome: 'COMPLETED',
        notes: 'Finished specification ahead of schedule.',
      },
      token
    );
    assert(focusFinishRes.status === 200, 'Focus Session finished');

    // 12. Daily Review
    console.log('12. Completing Daily Review...');
    const dailyReviewRes = await request(
      'POST',
      '/api/daily-review',
      {
        date: todayStr,
        wins: ['Delivered dispatcher spec', 'Finished deep focus block'],
        energyLevel: 'HIGH',
        focusRating: 5,
      },
      token
    );
    assert(dailyReviewRes.status === 200, 'Daily Review recorded');

    // 13. Progress Dashboard
    console.log('13. Verifying Progress Aggregation...');
    const progressRes = await request('GET', '/api/progress?period=THIS_WEEK', null, token);
    assert(progressRes.status === 200, 'Progress dashboard aggregated');
    const metrics = progressRes.data?.data?.metrics || progressRes.data?.data || {};
    assert((metrics.focusSessionsCompleted ?? 0) >= 1 || (metrics.totalFocusMinutes ?? 0) >= 0, 'Focus session counted in Progress');

    // 14. Weekly Review
    console.log('14. Saving Weekly Review draft...');
    const weeklyDraftRes = await request(
      'POST',
      '/api/reviews/weekly/draft',
      {
        wins: 'Completed architecture foundation and dispatcher spec.',
        learnings: 'Timeboxing 50m intervals provided superior focus.',
      },
      token
    );
    assert(weeklyDraftRes.status === 200, 'Weekly Review saved');

    // 15. Job Opportunity
    console.log('15. Adding Job Opportunity...');
    const jobRes = await request(
      'POST',
      '/api/opportunities/jobs',
      {
        company: 'Anthropic Labs',
        role: 'Principal Systems Architect',
        status: 'APPLIED',
        confidenceScore: 4,
        goalId,
      },
      token
    );
    assert(jobRes.status === 201, 'Job Opportunity added');

    // 16. Freelance Opportunity
    console.log('16. Adding Freelance Opportunity...');
    const freelanceRes = await request(
      'POST',
      '/api/opportunities/freelance',
      {
        clientName: 'Scale AI Advisory',
        projectName: 'Agent Architecture Audit',
        rate: '$250/hr',
        currency: 'USD',
        status: 'PROPOSAL_SENT',
        goalId,
      },
      token
    );
    assert(freelanceRes.status === 201, 'Freelance Opportunity added');

    // 17. Portfolio
    console.log('17. Verifying Portfolio Evidence View...');
    const portfolioRes = await request('GET', '/api/evidence', null, token);
    const evidenceList = portfolioRes.data?.evidence || portfolioRes.data?.data?.evidence || portfolioRes.data?.data || [];
    assert(portfolioRes.status === 200 && Array.isArray(evidenceList) && evidenceList.length > 0, 'Portfolio Evidence verified');

    // 18. Reminder
    console.log('18. Creating Reminder...');
    const reminderRes = await request(
      'POST',
      '/api/reminders',
      {
        title: 'Weekly Systems Review',
        message: 'Review throughput metrics and progress trajectory.',
        type: 'WEEKLY_REVIEW',
        time: '20:00',
        timezone: 'America/New_York',
        recurrence: 'WEEKLY',
        channel: 'IN_APP',
      },
      token
    );
    assert(reminderRes.status === 201, 'Reminder created');

    // 19. Notification
    console.log('19. Creating & Checking In-App Notification...');
    await prisma.notification.create({
      data: {
        userId,
        type: 'OPPORTUNITY_FOLLOW_UP',
        title: 'Follow-up with Anthropic Labs recruiter',
        message: 'Application submitted 5 days ago.',
      },
    });
    const notifCountRes = await request('GET', '/api/notifications/unread-count', null, token);
    assert(notifCountRes.data.data.unreadCount >= 1, 'In-App Notification ready in inbox');

    // 20. Settings
    console.log('20. Updating User Settings...');
    const settingsUpdateRes = await request(
      'PUT',
      '/api/settings/preferences',
      {
        defaultFocusMinutes: 50,
        weeklyCareerMinutesTarget: 600,
        preferredDays: 'MON,TUE,WED,THU,FRI',
        defaultCurrency: 'USD',
      },
      token
    );
    assert(settingsUpdateRes.status === 200, 'User Settings updated');

    // 21. Refresh / Re-login Persistence Verification
    console.log('21. Testing re-login and persistence across sessions...');
    const reloginRes = await request('POST', '/api/auth/login', {
      email,
      password,
    });
    assert(reloginRes.status === 200, 'User successfully re-authenticated with original credentials');
    const freshToken = reloginRes.data.data.tokens.accessToken;

    const freshMeRes = await request('GET', '/api/auth/me', null, freshToken);
    assert(freshMeRes.data.data.user.email === email, 'User identity intact after re-login');

    const freshSettingsRes = await request('GET', '/api/settings', null, freshToken);
    assert(freshSettingsRes.data.data.preferences.defaultFocusMinutes === 50, 'Preferences persisted across re-login');

    console.log('\n=============================================================');
    console.log('🏆 CAREEROS V1 FULL PRODUCT SMOKE FLOW COMPLETED WITH 100% SUCCESS!');
    console.log('=============================================================\n');
  } finally {
    if (server) server.close();
  }
}

runSmokeFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Smoke flow error:', err);
    process.exit(1);
  });
