/**
 * CareerOS Timezone & Reminder Verification Test Suite
 * Validates:
 * 1. isValidIanaTimezone & localDateTimeToUtc conversion accuracy
 * 2. computeNextTriggerDate timezone calculation
 * 3. UserProfile.timezone persistence with Asia/Kolkata
 * 4. Defaulting new reminders to user's UserProfile.timezone (Asia/Kolkata instead of UTC)
 * 5. Explicit timezone override during reminder creation
 * 6. Preserving existing reminder timezone on update unless explicitly edited
 */

const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = require('../src/config/db');
const reminderService = require('../src/services/reminders/reminder.service');
const { isValidIanaTimezone, localDateTimeToUtc } = require('../src/utils/timezone');
const settingsService = require('../src/services/settings/settings.service');

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
  console.log('🕒 STARTING TIMEZONE & REMINDER VERIFICATION TESTS');
  console.log('=============================================================\n');

  let testUser = null;
  let reminderA = null;
  let reminderB = null;

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: Timezone Utility Functions
    // -------------------------------------------------------------------------
    console.log('--- 1. Timezone Utility Validation ---');
    assert(isValidIanaTimezone('Asia/Kolkata') === true, 'Asia/Kolkata is a valid IANA timezone');
    assert(isValidIanaTimezone('America/New_York') === true, 'America/New_York is a valid IANA timezone');
    assert(isValidIanaTimezone('UTC') === true, 'UTC is a valid IANA timezone');
    assert(isValidIanaTimezone('Mars/Olympus_Mons') === false, 'Invalid timezone is rejected');

    // Test localDateTimeToUtc conversion for Asia/Kolkata (UTC+5:30)
    // 2026-09-09 20:00:00 IST must equal 2026-09-09 14:30:00 UTC
    const utcResult = localDateTimeToUtc(2026, 9, 9, 20, 0, 'Asia/Kolkata');
    assert(
      utcResult.toISOString() === '2026-09-09T14:30:00.000Z',
      `20:00 Asia/Kolkata correctly converts to 14:30 UTC (${utcResult.toISOString()})`
    );

    // Verify back-formatting into Asia/Kolkata matches 20:00
    const checkBackFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    assert(
      checkBackFormatter.format(utcResult) === '20:00',
      'UTC timestamp formats back to 20:00 in Asia/Kolkata'
    );

    // Test computeNextTriggerDate accuracy with Asia/Kolkata
    const fixedBaseDate = new Date('2026-09-09T08:00:00.000Z'); // 13:30 IST
    const nextTrigger = reminderService.computeNextTriggerDate('20:00', null, 'Asia/Kolkata', fixedBaseDate);
    assert(
      nextTrigger.toISOString() === '2026-09-09T14:30:00.000Z',
      `computeNextTriggerDate returns 14:30 UTC for 20:00 Asia/Kolkata (${nextTrigger.toISOString()})`
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 2: UserProfile Timezone Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- 2. UserProfile Timezone Persistence ---');
    const testEmail = `tz_test_${Date.now()}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234567890',
        fullName: 'Timezone Tester',
        profile: {
          create: {
            displayName: 'TZ Tester',
            timezone: 'UTC', // starts as default UTC
          },
        },
      },
      include: { profile: true },
    });

    assert(testUser.profile.timezone === 'UTC', 'User profile initial timezone is UTC');

    // Update settings to Asia/Kolkata
    const updatedProfile = await settingsService.updateProfile(testUser.id, {
      timezone: 'Asia/Kolkata',
      country: 'India',
    });

    assert(
      (updatedProfile.timezone || updatedProfile.profile?.timezone) === 'Asia/Kolkata',
      'UserProfile.timezone successfully updated to Asia/Kolkata via settingsService'
    );

    // Verify in DB directly
    const dbProfile = await prisma.userProfile.findUnique({
      where: { userId: testUser.id },
    });
    assert(
      dbProfile.timezone === 'Asia/Kolkata',
      'UserProfile.timezone in Prisma DB confirmed to be Asia/Kolkata'
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 3: Defaulting New Reminders to UserProfile.timezone
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Default New Reminder to UserProfile.timezone (Tasks 5 & 6) ---');
    // Create reminder without specifying timezone
    reminderA = await reminderService.createReminder(testUser.id, {
      title: 'Daily Evening Reflection',
      time: '21:00',
      type: 'DAILY_CAREEROS_REVIEW',
      recurrence: 'DAILY',
    });

    assert(
      reminderA.timezone === 'Asia/Kolkata',
      `New reminder inherits Asia/Kolkata from profile (got: ${reminderA.timezone})`
    );
    assert(
      reminderA.timezone !== 'UTC',
      'New reminder does NOT default to UTC when user timezone is Asia/Kolkata'
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 4: Explicit Timezone Override on Creation
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Explicit Timezone Override on Creation ---');
    reminderB = await reminderService.createReminder(testUser.id, {
      title: 'NYC Sync Call',
      time: '10:00',
      timezone: 'America/New_York',
      type: 'CUSTOM',
    });

    assert(
      reminderB.timezone === 'America/New_York',
      `Explicit timezone America/New_York is respected (got: ${reminderB.timezone})`
    );

    // -------------------------------------------------------------------------
    // TEST SUITE 5: Existing Reminders Retain Timezone on Update (Task 7)
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Preserving Reminder Timezone on Update unless Explicit (Task 7) ---');
    // Update reminderB title ONLY (no timezone in update payload)
    const updatedReminderB = await reminderService.updateReminder(testUser.id, reminderB.id, {
      title: 'NYC Sync Call (Updated Title)',
    });

    assert(
      updatedReminderB.timezone === 'America/New_York',
      `Existing reminder retains America/New_York when updated without timezone (got: ${updatedReminderB.timezone})`
    );

    // Now explicitly edit reminderB's timezone
    const explicitTzUpdate = await reminderService.updateReminder(testUser.id, reminderB.id, {
      timezone: 'Asia/Tokyo',
    });

    assert(
      explicitTzUpdate.timezone === 'Asia/Tokyo',
      `Explicitly edited reminder timezone updates to Asia/Tokyo (got: ${explicitTzUpdate.timezone})`
    );

    console.log('\n=============================================================');
    console.log(`✅ ALL TESTS PASSED! (${testsPassed} assertions)`);
    console.log('=============================================================');
  } finally {
    // Cleanup
    if (reminderA) {
      await prisma.reminder.deleteMany({ where: { id: reminderA.id } }).catch(() => {});
    }
    if (reminderB) {
      await prisma.reminder.deleteMany({ where: { id: reminderB.id } }).catch(() => {});
    }
    if (testUser) {
      await prisma.userProfile.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.user.deleteMany({ where: { id: testUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
