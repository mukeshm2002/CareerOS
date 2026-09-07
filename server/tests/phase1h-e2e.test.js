const http = require('http');
const app = require('../src/app');
const prisma = require('../src/config/db');
const reminderSchedulerService = require('../src/services/reminders/reminderScheduler.service');

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

async function request(method, path, body = null, token = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (cookie) {
      headers['Cookie'] = cookie;
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
  const refreshToken = regRes.data.data.tokens.refreshToken;

  await request(
    'POST',
    '/api/onboarding/complete',
    {
      situation: 'WORKING_PROFESSIONAL',
      targetRole: 'Staff Architect',
      targetSalary: '$160,000',
      availableCareerMinutes: 120,
      confidenceScore: 4,
      timezone,
      goals: [
        {
          title: 'Become Staff Architect',
          type: 'PROMOTION',
          priority: 'HIGH',
        },
      ],
    },
    token
  );

  return { token, refreshToken, userId: regRes.data.data.user.id };
}

async function runTests() {
  console.log('\n=============================================================');
  console.log('🚀 STARTING PHASE 1H E2E REGRESSION SUITE');
  console.log('=============================================================\n');

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      console.log(`Test server running at ${baseUrl}\n`);
      resolve();
    });
  });

  try {
    const timestamp = Date.now();
    const userAEmail = `phase1h_usera_${timestamp}@example.com`;
    const userBEmail = `phase1h_userb_${timestamp}@example.com`;
    const password = 'Password123!';

    // =========================================================================
    // 1. HEALTH & READINESS & SECURITY HEADERS
    // =========================================================================
    console.log('--- 1. Health, Readiness & Security Headers ---');
    const healthRes = await request('GET', '/api/health');
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK (Section 48)');
    assert(healthRes.data.success === true, 'Health check returns success: true');
    assert(healthRes.data.data?.status === 'healthy', 'Health check status is "healthy"');
    assert(healthRes.data.data?.database === 'connected', 'Health check confirms database is connected');
    assert(healthRes.headers['x-request-id'] !== undefined, 'Response includes X-Request-ID correlation header (Section 46)');
    assert(healthRes.headers['x-content-type-options'] === 'nosniff', 'Security header X-Content-Type-Options: nosniff present (Section 36)');

    const readyRes = await request('GET', '/api/ready');
    assert(readyRes.status === 200, 'GET /api/ready returns 200 OK (Section 49)');
    assert(readyRes.data.data?.status === 'ready', 'Readiness check returns status: "ready"');
    assert(readyRes.data.data?.database === 'connected', 'Readiness check confirms database is connected');

    // =========================================================================
    // 2. USER REGISTRATION & COOKIE ISSUANCE
    // =========================================================================
    console.log('\n--- 2. Registration & Cookie Security ---');
    const userA = await registerAndLogin(userAEmail, password, 'Alice Architect', 'Asia/Kolkata');
    assert(userA.token !== undefined, 'User A registered and received access token');

    // Test login and verify refresh token cookie
    const loginRes = await request('POST', '/api/auth/login', {
      email: userAEmail,
      password,
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200');
    assert(loginRes.data.data.tokens?.accessToken !== undefined, 'Login returns access token in JSON');

    const setCookieHeader = loginRes.headers['set-cookie'];
    assert(setCookieHeader && setCookieHeader.some((c) => c.includes('refreshToken=')), 'Login issues refreshToken cookie (Section 30)');
    assert(setCookieHeader && setCookieHeader.some((c) => c.toLowerCase().includes('httponly')), 'Refresh cookie has HttpOnly flag (Section 31)');

    const userB = await registerAndLogin(userBEmail, password, 'Bob Builder', 'America/New_York');
    assert(userB.token !== undefined, 'User B registered for user-isolation tests');

    // =========================================================================
    // 3. SETTINGS DOMAIN (Profile, Preferences, Notifications)
    // =========================================================================
    console.log('\n--- 3. Settings Domain ---');
    // GET /api/settings
    const getSettingsRes = await request('GET', '/api/settings', null, userA.token);
    assert(getSettingsRes.status === 200, 'GET /api/settings returns 200 (Section 52)');
    assert(getSettingsRes.data.data.profile !== undefined, 'Settings includes profile data');
    assert(getSettingsRes.data.data.preferences !== undefined, 'Settings includes user preferences');
    assert(getSettingsRes.data.data.user.email === userAEmail, 'Settings returns correct account email');

    // PUT /api/settings/profile
    const updateProfileRes = await request(
      'PUT',
      '/api/settings/profile',
      {
        firstName: 'Alice',
        lastName: 'Wonderland',
        currentRole: 'Principal Architect',
        targetRole: 'VP of Engineering',
        experienceLevel: 'LEAD',
        country: 'India',
        timezone: 'Asia/Kolkata',
      },
      userA.token
    );
    assert(updateProfileRes.status === 200, 'PUT /api/settings/profile returns 200 (Section 5)');
    assert(updateProfileRes.data.data.profile.currentRole === 'Principal Architect', 'Profile currentRole updated');
    assert(updateProfileRes.data.data.profile.timezone === 'Asia/Kolkata', 'Profile timezone updated');

    // Reject invalid timezone
    const invalidTzRes = await request(
      'PUT',
      '/api/settings/profile',
      {
        timezone: 'Invalid/City_Nowhere',
      },
      userA.token
    );
    assert(invalidTzRes.status === 400, 'PUT /api/settings/profile rejects invalid IANA timezone with 400');

    // PUT /api/settings/preferences
    const updatePrefRes = await request(
      'PUT',
      '/api/settings/preferences',
      {
        defaultFocusMinutes: 45,
        weeklyCareerMinutesTarget: 300,
        preferredDays: 'MON,WED,FRI',
        preferredStartTime: '09:00',
        preferredEndTime: '18:00',
        defaultCurrency: 'USD',
        defaultOpportunityPriority: 'HIGH',
      },
      userA.token
    );
    assert(updatePrefRes.status === 200, 'PUT /api/settings/preferences returns 200 (Section 6)');
    assert(updatePrefRes.data.data.preferences.defaultFocusMinutes === 45, 'defaultFocusMinutes set to 45');
    assert(updatePrefRes.data.data.preferences.defaultCurrency === 'USD', 'defaultCurrency set to USD');
    assert(updatePrefRes.data.data.preferences.preferredDays === 'MON,WED,FRI', 'preferredDays updated');

    // PUT /api/settings/notifications
    const updateNotifPrefRes = await request(
      'PUT',
      '/api/settings/notifications',
      {
        emailNotificationsEnabled: true,
        inAppNotificationsEnabled: true,
        dailyReviewReminderEnabled: true,
        dailyReviewReminderTime: '20:30',
        weeklyReviewReminderEnabled: true,
        weeklyReviewDay: 0,
        weeklyReviewTime: '21:00',
        opportunityFollowUpReminderEnabled: true,
      },
      userA.token
    );
    assert(updateNotifPrefRes.status === 200, 'PUT /api/settings/notifications returns 200 (Section 26)');
    assert(updateNotifPrefRes.data.data.preferences.dailyReviewReminderTime === '20:30', 'Daily review reminder time updated');
    assert(updateNotifPrefRes.data.data.preferences.emailNotificationsEnabled === true, 'emailNotificationsEnabled active');

    // =========================================================================
    // 4. REMINDERS CRUD & RECURRENCE
    // =========================================================================
    console.log('\n--- 4. Reminders Engine ---');
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create Reminder
    const createRemRes = await request(
      'POST',
      '/api/reminders',
      {
        title: 'Review System Design Portfolio',
        message: 'Ensure the microservices diagrams and RFC evidence are attached.',
        type: 'CUSTOM',
        scheduledFor: futureDate,
        timezone: 'Asia/Kolkata',
        recurrence: 'DAILY',
        channel: 'IN_APP',
      },
      userA.token
    );
    assert(createRemRes.status === 201, 'POST /api/reminders creates reminder (Section 13)');
    const reminderId = createRemRes.data.data.reminder.id;
    assert(reminderId !== undefined, 'Reminder returns valid ID');
    assert(createRemRes.data.data.reminder.recurrence === 'DAILY', 'Reminder recurrence is DAILY');
    assert(createRemRes.data.data.reminder.enabled === true, 'Reminder defaults to enabled');

    // GET /api/reminders
    const listRemRes = await request('GET', '/api/reminders', null, userA.token);
    assert(listRemRes.status === 200, 'GET /api/reminders returns 200');
    assert(Array.isArray(listRemRes.data.data.reminders), 'Reminders list is an array');
    assert(listRemRes.data.data.reminders.some((r) => r.id === reminderId), 'Created reminder present in list');

    // Filter by type
    const filterRemRes = await request('GET', '/api/reminders?type=CUSTOM', null, userA.token);
    assert(filterRemRes.status === 200, 'GET /api/reminders?type=CUSTOM returns 200');
    assert(filterRemRes.data.data.reminders.every((r) => r.type === 'CUSTOM'), 'All filtered reminders match CUSTOM');

    // GET /api/reminders/:id
    const getRemRes = await request('GET', `/api/reminders/${reminderId}`, null, userA.token);
    assert(getRemRes.status === 200, 'GET /api/reminders/:id returns 200');
    assert(getRemRes.data.data.reminder.title === 'Review System Design Portfolio', 'Reminder title matches');

    // PUT /api/reminders/:id
    const updateRemRes = await request(
      'PUT',
      `/api/reminders/${reminderId}`,
      {
        title: 'Updated Portfolio Review',
        recurrence: 'WEEKLY',
      },
      userA.token
    );
    assert(updateRemRes.status === 200, 'PUT /api/reminders/:id returns 200');
    assert(updateRemRes.data.data.reminder.title === 'Updated Portfolio Review', 'Reminder title updated');
    assert(updateRemRes.data.data.reminder.recurrence === 'WEEKLY', 'Reminder recurrence updated to WEEKLY');

    // PATCH /api/reminders/:id/enabled (disable and re-enable)
    const disableRemRes = await request(
      'PATCH',
      `/api/reminders/${reminderId}/enabled`,
      { enabled: false },
      userA.token
    );
    assert(disableRemRes.status === 200, 'PATCH /api/reminders/:id/enabled disables reminder');
    assert(disableRemRes.data.data.reminder.enabled === false, 'Reminder state is now enabled=false');

    const reenableRemRes = await request(
      'PATCH',
      `/api/reminders/${reminderId}/enabled`,
      { enabled: true },
      userA.token
    );
    assert(reenableRemRes.status === 200, 'PATCH /api/reminders/:id/enabled re-enables reminder');
    assert(reenableRemRes.data.data.reminder.enabled === true, 'Reminder state is now enabled=true');

    // =========================================================================
    // 5. IN-APP NOTIFICATIONS
    // =========================================================================
    console.log('\n--- 5. In-App Notifications ---');
    // Create direct test notification for User A
    const testNotif = await prisma.notification.create({
      data: {
        userId: userA.userId,
        type: 'TASK_DUE',
        title: 'Task Due Today',
        message: 'Complete the architecture diagrams review.',
      },
    });

    // GET /api/notifications/unread-count
    const unreadCountRes = await request('GET', '/api/notifications/unread-count', null, userA.token);
    assert(unreadCountRes.status === 200, 'GET /api/notifications/unread-count returns 200 (Section 12)');
    assert(unreadCountRes.data.data.unreadCount >= 1, 'Unread count is at least 1');

    // GET /api/notifications
    const listNotifRes = await request('GET', '/api/notifications', null, userA.token);
    assert(listNotifRes.status === 200, 'GET /api/notifications returns 200');
    assert(listNotifRes.data.data.notifications.some((n) => n.id === testNotif.id), 'Notification found in inbox');

    // PATCH /api/notifications/:id/read
    const markReadRes = await request('PATCH', `/api/notifications/${testNotif.id}/read`, {}, userA.token);
    assert(markReadRes.status === 200, 'PATCH /api/notifications/:id/read returns 200');
    assert(markReadRes.data.data.readAt !== null, 'Notification marked with readAt timestamp');

    // POST /api/notifications/read-all
    const testNotif2 = await prisma.notification.create({
      data: {
        userId: userA.userId,
        type: 'WEEKLY_REVIEW',
        title: 'Weekly Review Due',
        message: 'Time to reflect on this week achievements.',
      },
    });
    const markAllReadRes = await request('POST', '/api/notifications/read-all', {}, userA.token);
    assert(markAllReadRes.status === 200, 'POST /api/notifications/read-all returns 200');

    const checkCountRes = await request('GET', '/api/notifications/unread-count', null, userA.token);
    assert(checkCountRes.data.data.unreadCount === 0, 'Unread count is 0 after mark-all-read');

    // =========================================================================
    // 6. SCHEDULER EXECUTION & CONCURRENT DUPLICATE PROTECTION
    // =========================================================================
    console.log('\n--- 6. Scheduler Execution & Concurrency Protection ---');
    // Create a due reminder scheduled in the past
    const dueReminder = await prisma.reminder.create({
      data: {
        userId: userA.userId,
        title: 'Immediate Daily Career Review',
        message: 'Plan your tomorrow now.',
        type: 'DAILY_CAREER_REVIEW',
        time: '20:00',
        scheduledFor: new Date(Date.now() - 10000),
        nextTriggerAt: new Date(Date.now() - 10000),
        timezone: 'Asia/Kolkata',
        recurrence: 'DAILY',
        channel: 'IN_APP',
        enabled: true,
      },
    });

    // Count notifications for this user before scheduler
    const countBefore = await prisma.notification.count({
      where: { userId: userA.userId, title: 'Immediate Daily Career Review' },
    });
    assert(countBefore === 0, 'No notification exists before scheduler trigger');

    // Execute scheduler concurrently (two simultaneous runs) to test idempotency (Section 69)
    const [resultWorker1, resultWorker2] = await Promise.all([
      reminderSchedulerService.processDueReminders(),
      reminderSchedulerService.processDueReminders(),
    ]);

    const totalProcessed = resultWorker1.processed + resultWorker2.processed;
    const totalSent = resultWorker1.notificationsCreated + resultWorker2.notificationsCreated;
    console.log(`  ℹ Worker 1 processed: ${resultWorker1.processed}, Worker 2 processed: ${resultWorker2.processed}`);

    // Verify exactly ONE notification was generated across both concurrent workers
    const countAfter = await prisma.notification.count({
      where: { userId: userA.userId, title: 'Immediate Daily Career Review' },
    });
    assert(countAfter === 1, 'Scheduler concurrency test: exactly ONE notification created (no duplicate) (Section 69)');

    // Verify reminder state was safely advanced
    const updatedReminder = await prisma.reminder.findUnique({
      where: { id: dueReminder.id },
    });
    assert(updatedReminder.lastTriggeredAt !== null, 'Reminder lastTriggeredAt timestamp is recorded');
    assert(updatedReminder.nextTriggerAt > new Date(), 'Reminder nextTriggerAt advanced to future recurrence');

    // =========================================================================
    // 7. TIMEZONE & DST AWARENESS
    // =========================================================================
    console.log('\n--- 7. Timezone & DST Calculations ---');
    const nyReminder = await prisma.reminder.create({
      data: {
        userId: userB.userId,
        title: 'New York Evening Review',
        message: 'Shutdown time in NYC.',
        type: 'DAILY_SHUTDOWN',
        time: '20:00',
        scheduledFor: new Date('2026-11-01T20:00:00Z'),
        timezone: 'America/New_York',
        recurrence: 'DAILY',
        channel: 'IN_APP',
        enabled: true,
      },
    });
    assert(nyReminder.timezone === 'America/New_York', 'Reminder stores IANA timezone America/New_York (Section 65)');

    // =========================================================================
    // 8. AUTH SECURITY (Logout-All & Change Password)
    // =========================================================================
    console.log('\n--- 8. Authentication Hardening ---');
    // Change Password
    const changePassRes = await request(
      'POST',
      '/api/account/change-password',
      {
        currentPassword: password,
        newPassword: 'BrandNewSecurePassword456!',
      },
      userA.token
    );
    assert(changePassRes.status === 200, 'POST /api/account/change-password returns 200 (Section 41)');
    assert(changePassRes.data.success === true, 'Change password success is true');

    // Try logging in with old password -> should fail
    const oldLoginRes = await request('POST', '/api/auth/login', {
      email: userAEmail,
      password,
    });
    assert(oldLoginRes.status === 401, 'Login with old password fails with 401');

    // Try logging in with new password -> should succeed
    const newLoginRes = await request('POST', '/api/auth/login', {
      email: userAEmail,
      password: 'BrandNewSecurePassword456!',
    });
    assert(newLoginRes.status === 200, 'Login with new password succeeds with 200');
    const newAccessToken = newLoginRes.data.data.tokens.accessToken;

    // Logout-all sessions (Section 42)
    const logoutAllRes = await request('POST', '/api/auth/logout-all', {}, newAccessToken);
    assert(logoutAllRes.status === 200, 'POST /api/auth/logout-all returns 200 (Section 42)');

    // Refresh tokens count for User A in DB should now be 0
    const activeTokens = await prisma.refreshToken.count({
      where: { userId: userA.userId },
    });
    assert(activeTokens === 0, 'All refresh tokens revoked for user upon logout-all (Section 42)');

    // =========================================================================
    // 9. STRICT USER ISOLATION
    // =========================================================================
    console.log('\n--- 9. Strict User Isolation ---');
    // User B attempts to access User A's reminder -> returns safe 404
    const isoGetRem = await request('GET', `/api/reminders/${reminderId}`, null, userB.token);
    assert(isoGetRem.status === 404, 'User B GET User A reminder returns safe 404 (Section 61)');

    const isoUpdateRem = await request('PUT', `/api/reminders/${reminderId}`, { title: 'Hacked' }, userB.token);
    assert(isoUpdateRem.status === 404, 'User B PUT User A reminder returns safe 404');

    const isoDelRem = await request('DELETE', `/api/reminders/${reminderId}`, null, userB.token);
    assert(isoDelRem.status === 404, 'User B DELETE User A reminder returns safe 404');

    // User B attempts to read User A's notification -> returns safe 404
    const isoNotifRead = await request('PATCH', `/api/notifications/${testNotif.id}/read`, {}, userB.token);
    assert(isoNotifRead.status === 404, 'User B PATCH User A notification returns safe 404');

    // User B attempts to delete User A's notification -> returns safe 404
    const isoNotifDel = await request('DELETE', `/api/notifications/${testNotif.id}`, null, userB.token);
    assert(isoNotifDel.status === 404, 'User B DELETE User A notification returns safe 404');

    // =========================================================================
    // 10. ERROR SANITIZATION
    // =========================================================================
    console.log('\n--- 10. Production Error Sanitization ---');
    const notFoundRes = await request('GET', '/api/some-nonexistent-endpoint', null, userB.token);
    assert(notFoundRes.status === 404, 'Nonexistent endpoint returns clean 404');
    assert(notFoundRes.data.success === false, 'Error response has success: false');
    assert(typeof notFoundRes.data.message === 'string', 'Error response has sanitized message string');
    assert(notFoundRes.data.stack === undefined, 'No stack traces exposed in error response (Section 44)');

    // Cleanup created reminder
    const cleanupRem = await request('DELETE', `/api/reminders/${reminderId}`, null, newAccessToken);
    assert(cleanupRem.status === 200, 'DELETE /api/reminders/:id removes reminder cleanly');

    console.log('\n=============================================================');
    console.log(`🎉 ALL PHASE 1H E2E TESTS COMPLETED: ${testsPassed} PASS, ${testsFailed} FAIL`);
    console.log('=============================================================\n');
  } finally {
    reminderSchedulerService.stop();
    if (server) {
      server.close();
    }
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Phase 1H test suite failed:', err);
    process.exit(1);
  });
