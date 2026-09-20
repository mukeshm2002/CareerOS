const prisma = require('../src/config/db');
const reminderService = require('../src/services/reminders/reminder.service');
const contactService = require('../src/services/contacts/contact.service');
const reminderSchedulerService = require('../src/services/reminders/reminderScheduler.service');
const schedulePlanningService = require('../src/services/planning/schedulePlanning.service');
const taskPlanningService = require('../src/services/planning/taskPlanning.service');
const voiceService = require('../src/services/reminders/voice/voiceService');

async function runTests() {
  console.log('=== STARTING EYTHU REMINDER SYSTEM TEST SUITE ===');
  let user1, user2;

  try {
    // 1. Setup two test users
    console.log('\n[SETUP] Creating test users...');
    user1 = await prisma.user.create({
      data: {
        email: `reminder-test-1-${Date.now()}@eythu.test`,
        passwordHash: 'dummy_hash',
        fullName: 'Mukesh Tester',
        profile: {
          create: {
            displayName: 'Mukesh Tester',
            timezone: 'Asia/Kolkata',
          },
        },
        preferences: {
          create: {
            theme: 'DARK',
            voiceRemindersEnabled: true,
            quietHoursStart: '22:00',
            quietHoursEnd: '07:00',
            fallbackNotificationEnabled: true,
          },
        },
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: `reminder-test-2-${Date.now()}@eythu.test`,
        passwordHash: 'dummy_hash',
        fullName: 'Other User',
        profile: {
          create: {
            displayName: 'Other User',
            timezone: 'America/New_York',
          },
        },
      },
    });

    console.log(`✓ Created test users: ${user1.id}, ${user2.id}`);

    // TEST 1: Create task with no reminder
    console.log('\n[TEST 1] Create task with no reminder');
    const task1 = await taskPlanningService.createTask(user1.id, {
      title: 'Task Without Reminder',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
    });
    const task1WithReminders = await taskPlanningService.getTaskById(user1.id, task1.id);
    if (task1WithReminders.reminders.length !== 0) {
      throw new Error(`Expected 0 reminders, got ${task1WithReminders.reminders.length}`);
    }
    console.log('✓ Task created with 0 reminders');

    // TEST 2: Create task with in-app reminder
    console.log('\n[TEST 2] Create task with in-app reminder');
    const taskDue = new Date(Date.now() + 7200000); // 2 hours from now
    const task2 = await taskPlanningService.createTask(user1.id, {
      title: 'Java Problem Solving',
      priority: 'HIGH',
      dueDate: taskDue.toISOString(),
      reminderOffsetMinutes: 10,
      reminderChannel: 'IN_APP',
    });
    const task2WithReminders = await taskPlanningService.getTaskById(user1.id, task2.id);
    if (task2WithReminders.reminders.length !== 1) {
      throw new Error(`Expected 1 reminder, got ${task2WithReminders.reminders.length}`);
    }
    const t2Reminder = task2WithReminders.reminders[0];
    const expectedTrigger = new Date(taskDue.getTime() - 10 * 60000);
    if (Math.abs(t2Reminder.nextTriggerAt.getTime() - expectedTrigger.getTime()) > 2000) {
      throw new Error(`Expected trigger around ${expectedTrigger}, got ${t2Reminder.nextTriggerAt}`);
    }
    console.log(`✓ Task created with 10-minute in-app reminder (trigger: ${t2Reminder.nextTriggerAt.toISOString()})`);

    // TEST 3: Schedule task with 10-minute reminder
    console.log('\n[TEST 3] Schedule task with 10-minute reminder');
    const schedDate = new Date();
    schedDate.setDate(schedDate.getDate() + 1);
    const schedDateStr = schedDate.toISOString().split('T')[0];

    const schedResult = await schedulePlanningService.createScheduleBlock(user1.id, {
      title: 'Review System Design',
      date: schedDateStr,
      startTime: '19:00',
      endTime: '19:30',
      category: 'CAREEROS',
      taskId: task1.id,
      reminderOffsetMinutes: 10,
      reminderChannel: 'IN_APP',
    });
    const blockId = schedResult.block.id;
    const blocks = await schedulePlanningService.getScheduleBlocks(user1.id, { date: schedDateStr });
    const createdBlock = blocks.find((b) => b.id === blockId);
    if (!createdBlock || createdBlock.reminders.length !== 1) {
      throw new Error(`Expected schedule block to have 1 reminder, found ${createdBlock?.reminders?.length}`);
    }
    const schedReminder = createdBlock.reminders[0];
    console.log(`✓ Schedule block created with linked reminder: ${schedReminder.id}`);

    // TEST 4: Edit scheduled time and confirm relative reminder recalculates
    console.log('\n[TEST 4] Edit scheduled time & confirm relative reminder recalculates');
    const updatedBlock = await schedulePlanningService.updateScheduleBlock(user1.id, blockId, {
      startTime: '20:00',
      endTime: '20:45',
    });
    const updatedReminder = await reminderService.getReminderById(user1.id, schedReminder.id);
    // 20:00 local time minus 10 minutes should be 19:50 local time
    console.log(`✓ Schedule time updated to 20:00. New reminder trigger: ${updatedReminder.nextTriggerAt.toISOString()}`);
    if (updatedReminder.nextTriggerAt.getTime() === schedReminder.nextTriggerAt.getTime()) {
      throw new Error('Reminder nextTriggerAt was NOT recalculated after schedule block time update!');
    }

    // TEST 5: Snooze reminder (does not mutate original task or schedule time)
    console.log('\n[TEST 5] Snooze reminder');
    const snoozed = await reminderService.snoozeReminder(user1.id, schedReminder.id, 15);
    if (snoozed.status !== 'SNOOZED') {
      throw new Error(`Expected status SNOOZED, got ${snoozed.status}`);
    }
    // Check schedule block is untouched
    const blockAfterSnooze = await prisma.scheduleBlock.findUnique({ where: { id: blockId } });
    if (blockAfterSnooze.startTime !== '20:00') {
      throw new Error('Snoozing reminder mutated the original schedule startTime!');
    }
    console.log(`✓ Reminder snoozed for 15 mins. Status: ${snoozed.status}, original schedule startTime remains ${blockAfterSnooze.startTime}`);

    // TEST 6: Delete task and confirm associated pending reminder cancelled
    console.log('\n[TEST 6] Delete task & confirm associated pending reminder cancelled');
    await taskPlanningService.deleteTask(user1.id, task2.id);
    const t2ReminderCheck = await prisma.reminder.findUnique({ where: { id: t2Reminder.id } });
    if (t2ReminderCheck.status !== 'CANCELLED' || t2ReminderCheck.enabled !== false) {
      throw new Error(`Expected reminder to be CANCELLED, got ${t2ReminderCheck.status}`);
    }
    console.log(`✓ Task deleted; linked reminder status is CANCELLED`);

    // TEST 7: Phone Contact Verification Architecture
    console.log('\n[TEST 7] Phone contact verification flow');
    // Start verification
    const startResult = await contactService.startVerification(user1.id, '+91 98765 43210');
    console.log(`✓ Verification started. Masked value: ${startResult.maskedValue}`);
    if (startResult.maskedValue !== '+91 ••••• ••210') {
      throw new Error(`Masked format incorrect: ${startResult.maskedValue}`);
    }

    // Verify OTP code
    const code = startResult.devCode; // Returned in development for testing
    const confirmResult = await contactService.confirmVerification(user1.id, code);
    if (!confirmResult.verified || !confirmResult.contact.verified) {
      throw new Error('Phone verification failed to mark verified');
    }
    console.log(`✓ Phone verified successfully: verified=${confirmResult.contact.verified}, verifiedAt=${confirmResult.contact.verifiedAt}`);

    // TEST 8: Attempt voice reminder with unverified phone on user2 vs verified on user1
    console.log('\n[TEST 8] Voice reminder authorization based on verification');
    let rejected = false;
    try {
      await reminderService.createReminder(user2.id, {
        title: 'Voice test on user2 without verified phone',
        channel: 'VOICE',
        time: '18:00',
      });
    } catch (err) {
      rejected = true;
      console.log(`✓ Unverified voice reminder rejected as expected: "${err.message}"`);
    }
    if (!rejected) {
      throw new Error('Expected voice reminder for unverified phone to be rejected!');
    }

    // User1 has verified phone, so VOICE reminder succeeds
    const voiceReminder = await reminderService.createReminder(user1.id, {
      title: 'Voice test on user1 with verified phone',
      channel: 'VOICE',
      sourceType: 'COMMUNICATION',
      time: '18:00',
      phoneContactId: confirmResult.contact.id,
    });
    console.log(`✓ Voice reminder created for user1: id=${voiceReminder.id}, channel=${voiceReminder.channel}`);

    // TEST 9: Voice provider adapter & simulated call
    console.log('\n[TEST 9] Voice provider execution');
    const callResult = await voiceService.dispatchVoiceReminder(voiceReminder.id);
    console.log(`✓ Dispatch result: status=${callResult.status}, providerCallId=${callResult.providerCallId}`);
    if (callResult.status !== 'ANSWERED') {
      throw new Error(`Expected simulated call status ANSWERED, got ${callResult.status}`);
    }

    // TEST 10: Missed call fallback to in-app notification
    console.log('\n[TEST 10] Missed call fallback');
    // Simulate a missed webhook
    const missedWebhookResult = await voiceService.handleWebhookCallback('console', {
      CallSid: callResult.providerCallId,
      CallStatus: 'no-answer',
    }, {});
    console.log(`✓ Missed call handled. Status updated: ${missedWebhookResult.status}, fallbackCreated=${missedWebhookResult.fallbackCreated}`);
    if (missedWebhookResult.status !== 'MISSED' || !missedWebhookResult.fallbackCreated) {
      throw new Error('Expected status MISSED and in-app fallback notification created');
    }

    // TEST 11: Quiet Hours suppression
    console.log('\n[TEST 11] Quiet hours suppression check');
    const isQuiet = voiceService.isInsideQuietHours('23:30', '22:00', '07:00');
    const isNotQuiet = voiceService.isInsideQuietHours('14:30', '22:00', '07:00');
    if (!isQuiet || isNotQuiet) {
      throw new Error(`Quiet hours calculation error: isQuiet=${isQuiet}, isNotQuiet=${isNotQuiet}`);
    }
    console.log('✓ Quiet hours correctly identified 23:30 inside 22:00-07:00 window and 14:30 outside');

    // TEST 12: Unauthorized access prevention
    console.log('\n[TEST 12] Unauthorized reminder access prevention');
    let accessBlocked = false;
    try {
      await reminderService.getReminderById(user2.id, voiceReminder.id);
    } catch (err) {
      accessBlocked = true;
      console.log(`✓ Access correctly blocked for other user: "${err.message}"`);
    }
    if (!accessBlocked) {
      throw new Error('User 2 was illegally allowed to access User 1 reminder!');
    }

    // TEST 13: Scheduler atomic locking and duplicate execution prevention
    console.log('\n[TEST 13] Scheduler atomic lock & claim');
    // Create a due reminder
    const dueReminder = await reminderService.createReminder(user1.id, {
      title: 'Due Reminder Test',
      sourceType: 'HEALTH',
      message: 'Drink a glass of water',
      channel: 'IN_APP',
      scheduledAt: new Date(Date.now() - 5000), // Due 5 seconds ago
    });
    console.log(`✓ Created due reminder ${dueReminder.id}, nextTriggerAt: ${dueReminder.nextTriggerAt}`);

    // Process due reminders
    const firstRun = await reminderSchedulerService.processDueReminders();
    console.log(`✓ First scheduler run: processed ${firstRun.processed} reminder(s)`);
    if (firstRun.processed < 1) {
      throw new Error('Expected at least 1 reminder to be processed');
    }

    // Verify reminder is now marked DELIVERED
    const executedReminder = await prisma.reminder.findUnique({ where: { id: dueReminder.id } });
    if (executedReminder.status !== 'DELIVERED') {
      throw new Error(`Expected executed reminder status DELIVERED, got ${executedReminder.status}`);
    }
    console.log(`✓ Executed reminder successfully marked as ${executedReminder.status}`);

    // Immediate second run must NOT re-process the completed reminder (duplicate execution protection)
    const secondRun = await reminderSchedulerService.processDueReminders();
    console.log(`✓ Second scheduler run: processed ${secondRun.processed} reminder(s), skippedDuplicates ${secondRun.skippedDuplicates}`);
    const recheck = await prisma.reminder.findUnique({ where: { id: dueReminder.id } });
    if (recheck.attemptCount > 1) {
      throw new Error('RACE CONDITION: Reminder was executed multiple times!');
    }
    console.log('✓ Duplicate execution protection verified: attemptCount is strictly 1');

    // TEST 14: Reminder Settings API
    console.log('\n[TEST 14] Reminder settings retrieval & update');
    const settings = await reminderService.getReminderSettings(user1.id);
    console.log(`✓ Retrieved reminder settings: defaultTaskOffset=${settings.defaultTaskReminderOffset}, voiceEnabled=${settings.voiceRemindersEnabled}`);
    const updatedSettings = await reminderService.updateReminderSettings(user1.id, {
      defaultTaskReminderOffset: 15,
      quietHoursStart: '23:00',
    });
    if (updatedSettings.defaultTaskReminderOffset !== 15 || updatedSettings.quietHoursStart !== '23:00') {
      throw new Error('Failed to update reminder settings');
    }
    console.log('✓ Updated reminder settings successfully');

    console.log('\n=============================================');
    console.log('ALL 14 BACKEND INTEGRATION TESTS PASSED! 🎉');
    console.log('=============================================\n');
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exitCode = 1;
  } finally {
    console.log('[CLEANUP] Cleaning up test data...');
    if (user1) {
      await prisma.userContact.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.reminder.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.scheduleBlock.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.task.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.userPreference.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId: user1.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: user1.id } }).catch(() => {});
    }
    if (user2) {
      await prisma.userContact.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.reminder.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.scheduleBlock.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.task.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.userPreference.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.userProfile.deleteMany({ where: { userId: user2.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: user2.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

runTests();
