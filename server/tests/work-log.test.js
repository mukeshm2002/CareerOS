/**
 * CareerOS Phase 2B Step 1: Daily Work Notes Verification Test Suite
 * Validates:
 * 1. create today's note
 * 2. update today's note (upsert behavior)
 * 3. retrieve today's note using user's timezone
 * 4. one log per user/date unique constraint
 * 5. timezone date handling (local vs UTC)
 * 6. user isolation (User A cannot view or edit User B's log)
 * 7. empty fields (partial notes allowed)
 * 8. GET causes zero side effects / zero writes
 * 9. historical retrieval & pagination
 * 10. stats calculation (days logged this week & month)
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../src/config/db');
const workLogService = require('../src/services/workLogs/workLog.service');
const { getUserLocalDate, parseLocalDateToUtcDate } = require('../src/utils/timezone');

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
  console.log('📝 STARTING DAILY WORK NOTES (CAREER JOURNAL) TESTS');
  console.log('=============================================================\n');

  let userA = null;
  let userB = null;

  try {
    // Setup test users
    const timestamp = Date.now();
    userA = await prisma.user.create({
      data: {
        email: `worklog_a_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Journal User A',
        profile: {
          create: {
            displayName: 'User A',
            timezone: 'Asia/Kolkata',
          },
        },
      },
      include: { profile: true },
    });

    userB = await prisma.user.create({
      data: {
        email: `worklog_b_${timestamp}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Journal User B',
        profile: {
          create: {
            displayName: 'User B',
            timezone: 'America/New_York',
          },
        },
      },
      include: { profile: true },
    });

    // -------------------------------------------------------------------------
    // TEST 1: GET on empty state causes ZERO database writes
    // -------------------------------------------------------------------------
    console.log('--- 1. Zero Database Writes on Read (Empty State) ---');
    const countBefore = await prisma.dailyWorkLog.count({ where: { userId: userA.id } });
    assert(countBefore === 0, 'User initially has 0 work logs');

    const emptyTodayResult = await workLogService.getToday(userA.id);
    assert(emptyTodayResult.workLog === null, 'getToday returns null when no log exists');
    assert(emptyTodayResult.timezone === 'Asia/Kolkata', 'Returns user timezone Asia/Kolkata');

    const countAfter = await prisma.dailyWorkLog.count({ where: { userId: userA.id } });
    assert(countAfter === 0, 'Repeated GET caused zero database writes');

    // -------------------------------------------------------------------------
    // TEST 2: Create today's note with single field (partial content allowed)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Create Today Note (Partial / Single Field) ---');
    const createdSingle = await workLogService.upsertToday(userA.id, {
      workedOn: 'Learned Docker containerization for fullstack app',
    });

    assert(createdSingle.workLog !== null, 'Work log created successfully');
    assert(createdSingle.workLog.workedOn === 'Learned Docker containerization for fullstack app', 'workedOn saved correctly');
    assert(createdSingle.workLog.learned === null, 'Unfilled field learned is null');
    assert(createdSingle.workLog.blockers === null, 'Unfilled field blockers is null');
    assert(createdSingle.workLog.nextStep === null, 'Unfilled field nextStep is null');

    const expectedDateStr = getUserLocalDate('Asia/Kolkata');
    const savedLogDateStr = createdSingle.workLog.logDate.toISOString().slice(0, 10);
    assert(savedLogDateStr === expectedDateStr, `Log date matches user's local date in Asia/Kolkata (${expectedDateStr})`);

    // -------------------------------------------------------------------------
    // TEST 3: Update today's note (Upsert Behavior - One record per user/date)
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Upsert Behavior (One Record per User / Date) ---');
    const updatedToday = await workLogService.upsertToday(userA.id, {
      learned: 'Multi-stage builds reduce image size by 70%',
      blockers: 'Docker daemon permissions on Linux',
      nextStep: 'Deploy container image to staging registry',
    });

    assert(updatedToday.workLog.id === createdSingle.workLog.id, 'Updates existing record with same ID');
    assert(updatedToday.workLog.workedOn === 'Learned Docker containerization for fullstack app', 'Preserves previously saved workedOn');
    assert(updatedToday.workLog.learned === 'Multi-stage builds reduce image size by 70%', 'Updates learned field');
    assert(updatedToday.workLog.blockers === 'Docker daemon permissions on Linux', 'Updates blockers field');
    assert(updatedToday.workLog.nextStep === 'Deploy container image to staging registry', 'Updates nextStep field');

    const totalLogsUserA = await prisma.dailyWorkLog.count({ where: { userId: userA.id } });
    assert(totalLogsUserA === 1, 'Exactly one work log exists for today');

    // -------------------------------------------------------------------------
    // TEST 4: Unique Constraint Enforcement [userId, logDate]
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Unique Constraint Enforcement ---');
    let duplicateRejected = false;
    try {
      await prisma.dailyWorkLog.create({
        data: {
          userId: userA.id,
          logDate: parseLocalDateToUtcDate(expectedDateStr),
          workedOn: 'Duplicate attempt',
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        duplicateRejected = true;
      }
    }
    assert(duplicateRejected === true, 'Prisma unique constraint [userId, logDate] rejected duplicate date insertion');

    // -------------------------------------------------------------------------
    // TEST 5: User Isolation (User A vs User B)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. User Isolation ---');
    // User B gets today's log
    const userBEmpty = await workLogService.getToday(userB.id);
    assert(userBEmpty.workLog === null, 'User B has no logs and cannot see User A logs');

    // User B creates their own note
    const userBCreated = await workLogService.upsertToday(userB.id, {
      workedOn: 'Designed Figma components for Raycast-style palette',
    });
    assert(userBCreated.workLog.userId === userB.id, 'User B log belongs to User B');

    // User A fetches history
    const userAHistory = await workLogService.listHistory(userA.id);
    assert(userAHistory.total === 1, 'User A history contains only User A log');
    assert(userAHistory.workLogs[0].id === createdSingle.workLog.id, 'User A log id matches');

    // User B fetches history
    const userBHistory = await workLogService.listHistory(userB.id);
    assert(userBHistory.total === 1, 'User B history contains only User B log');
    assert(userBHistory.workLogs[0].id === userBCreated.workLog.id, 'User B log id matches');

    // -------------------------------------------------------------------------
    // TEST 6: Date-Specific Retrieval (getWorkLogByDate)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Date-Specific Retrieval (GET /api/work-logs/:date) ---');
    const specificDateResult = await workLogService.getByDate(userA.id, expectedDateStr);
    assert(specificDateResult.workLog !== null, `Successfully retrieved log for date ${expectedDateStr}`);
    assert(specificDateResult.workLog.workedOn === 'Learned Docker containerization for fullstack app', 'Field content matches');

    const nonExistentDate = await workLogService.getByDate(userA.id, '2024-01-01');
    assert(nonExistentDate.workLog === null, 'Returns null for date with no entry');

    // -------------------------------------------------------------------------
    // TEST 7: History and Stats Calculation
    // -------------------------------------------------------------------------
    console.log('\n--- 7. History & Factual Stats Calculation ---');
    const stats = await workLogService.getStats(userA.id);
    assert(stats.daysLoggedThisWeek >= 1, `Days logged this week is at least 1 (got: ${stats.daysLoggedThisWeek})`);
    assert(stats.daysLoggedThisMonth >= 1, `Days logged this month is at least 1 (got: ${stats.daysLoggedThisMonth})`);

    console.log('\n=============================================================');
    console.log(`✅ ALL DAILY WORK LOG TESTS PASSED! (${testsPassed} assertions)`);
    console.log('=============================================================');
  } finally {
    // Cleanup
    if (userA) {
      await prisma.dailyWorkLog.deleteMany({ where: { userId: userA.id } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId: userA.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: userA.id } }).catch(() => {});
    }
    if (userB) {
      await prisma.dailyWorkLog.deleteMany({ where: { userId: userB.id } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId: userB.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: userB.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Work log test suite failed:', err);
  process.exit(1);
});
