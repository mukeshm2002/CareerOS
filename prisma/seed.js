const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function normalizeSkill(name) {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  console.log('🌱 Seeding CareerOS Development Database (Phase 1C)...');

  const demoEmail = 'demo@careeros.local';
  const rawPassword = 'Password123!';

  // Clean existing demo user if exists to allow re-seeding
  const existing = await prisma.user.findUnique({
    where: { email: demoEmail },
  });

  if (existing) {
    console.log('Cleaning existing demo user...');
    await prisma.user.delete({ where: { id: existing.id } });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  // 1. Create User & Profile
  const demoUser = await prisma.user.create({
    data: {
      email: demoEmail,
      passwordHash,
      fullName: 'Mukesh Sharma',
      role: 'USER',
      onboardingCompleted: true,
      lastLoginAt: new Date(),
      profile: {
        create: {
          firstName: 'Mukesh',
          lastName: 'Sharma',
          displayName: 'Mukesh S.',
          currentSituation: 'WORKING_PROFESSIONAL',
          currentRole: 'Software Developer',
          targetRole: 'Full Stack Developer',
          targetSalary: '$120,000 / yr',
          experienceLevel: 'MID_LEVEL',
          timezone: 'Asia/Kolkata',
          country: 'India',
          wakeTime: '06:00',
          workStartTime: '08:00',
          workEndTime: '19:00',
          personalStartTime: '19:00',
          personalEndTime: '20:00',
          sleepTime: '22:30',
          availableCareerMinutes: 130, // 20:00 to 22:10
          onboardingStep: 7,
          careerMission: 'Get a better-paying Software Developer role and start freelancing',
          bio: 'Full stack developer focused on mastering Spring Boot, React, and scalable systems.',
        },
      },
    },
  });

  console.log(`✓ Seeded User: ${demoUser.email} (ID: ${demoUser.id})`);

  // 2. Create Sample Goals (Section 34)
  const targetDate = new Date('2026-12-31T23:59:59Z');

  const goal1 = await prisma.goal.create({
    data: {
      userId: demoUser.id,
      title: 'Better Salary Job',
      description: 'Transition into a high-impact, higher-paying software development role.',
      type: 'JOB_SWITCH',
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 20,
      targetDate,
      targetRole: 'Full Stack Developer',
      targetSalary: '$120,000 / yr',
      salaryCurrency: 'USD',
      notes: 'Focus on Spring Boot, React Query, and algorithm patterns.',
    },
  });

  const goal2 = await prisma.goal.create({
    data: {
      userId: demoUser.id,
      title: 'Start Freelancing',
      description: 'Build initial freelance client base and establish supplemental tech consulting income.',
      type: 'FREELANCING',
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 0,
      targetDate,
      targetRole: 'Freelance Backend Engineer',
      targetSalary: '$3,000 / mo',
      salaryCurrency: 'USD',
      notes: 'Outreach to early-stage startups and agencies.',
    },
  });

  console.log(`✓ Seeded Goal 1: "${goal1.title}"`);
  console.log(`✓ Seeded Goal 2: "${goal2.title}"`);

  // 3. Create Roadmap for Better Salary Job (Section 34)
  const roadmap = await prisma.roadmap.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      title: 'Better Salary Job Roadmap',
      description: 'Step-by-step career transition plan into a senior full stack developer role.',
      status: 'ACTIVE',
      progress: 20, // 2 of 10 completed = 20%
    },
  });

  const stages = [
    { seq: 1, title: 'Define Target Role', status: 'COMPLETED', progress: 100 },
    { seq: 2, title: 'Assess Current Skills', status: 'COMPLETED', progress: 100 },
    { seq: 3, title: 'Close Critical Skill Gaps', status: 'IN_PROGRESS', progress: 50 },
    { seq: 4, title: 'Strengthen Proof of Work', status: 'NOT_STARTED', progress: 0 },
    { seq: 5, title: 'Update Resume & Profiles', status: 'NOT_STARTED', progress: 0 },
    { seq: 6, title: 'Prepare for Interviews', status: 'NOT_STARTED', progress: 0 },
    { seq: 7, title: 'Start Applications', status: 'NOT_STARTED', progress: 0 },
    { seq: 8, title: 'Interview Pipeline', status: 'NOT_STARTED', progress: 0 },
    { seq: 9, title: 'Evaluate Offers', status: 'NOT_STARTED', progress: 0 },
    { seq: 10, title: 'Transition', status: 'NOT_STARTED', progress: 0 },
  ];

  const createdMilestones = [];
  for (const s of stages) {
    const m = await prisma.roadmapMilestone.create({
      data: {
        roadmapId: roadmap.id,
        userId: demoUser.id,
        title: s.title,
        sequence: s.seq,
        status: s.status,
        progress: s.progress,
        startedAt: s.status !== 'NOT_STARTED' ? new Date() : null,
        completedAt: s.status === 'COMPLETED' ? new Date() : null,
      },
    });
    createdMilestones.push(m);
  }

  const milestone3 = createdMilestones.find((m) => m.sequence === 3);
  console.log(`✓ Seeded Roadmap with 10 milestones for "${goal1.title}"`);

  // 4. Create Skills & UserSkills (Section 34)
  const skillsConfig = [
    { name: 'Java', category: 'TECHNICAL', current: 4, target: 4, evidence: '3+ years enterprise experience' },
    { name: 'Spring Boot', category: 'TECHNICAL', current: 3, target: 4, evidence: 'Building REST APIs and microservices' },
    { name: 'React', category: 'TECHNICAL', current: 3, target: 4, evidence: 'Built frontend web applications' },
    { name: 'SQL', category: 'TECHNICAL', current: 3, target: 4, evidence: 'PostgreSQL schema and query optimization' },
    { name: 'DSA', category: 'TECHNICAL', current: 2, target: 4, evidence: 'Practicing tree and graph traversal algorithms' },
    { name: 'Git/GitHub', category: 'TOOLS', current: 3, target: 4, evidence: 'Version control and PR review workflows' },
  ];

  const createdSkills = {};
  for (const sc of skillsConfig) {
    const norm = normalizeSkill(sc.name);
    const skill = await prisma.skill.upsert({
      where: { normalizedName: norm },
      update: { name: sc.name, category: sc.category },
      create: {
        name: sc.name,
        normalizedName: norm,
        category: sc.category,
      },
    });
    createdSkills[sc.name] = skill;

    await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: demoUser.id,
          skillId: skill.id,
        },
      },
      update: {
        currentLevel: sc.current,
        targetLevel: sc.target,
        evidence: sc.evidence,
        assessmentType: 'SELF_ASSESSMENT',
      },
      create: {
        userId: demoUser.id,
        skillId: skill.id,
        currentLevel: sc.current,
        targetLevel: sc.target,
        evidence: sc.evidence,
        assessmentType: 'SELF_ASSESSMENT',
      },
    });
  }
  console.log('✓ Seeded 6 UserSkills with normalized names and assessments');

  // 5. Create Tasks (Section 34)
  const task1 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Complete Spring Security fundamentals',
      description: 'Review filter chains, user details service, and authentication providers.',
      priority: 'HIGH',
      status: 'COMPLETED',
      taskType: 'LEARNING',
      estimatedMinutes: 60,
      actualMinutes: 65,
      goalId: goal1.id,
      milestoneId: milestone3.id,
      skillId: createdSkills['Spring Boot'].id,
      completedAt: new Date(),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Build JWT authentication project',
      description: 'Implement refresh token rotation and protected route endpoints.',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      taskType: 'PROJECT',
      estimatedMinutes: 80,
      actualMinutes: 30,
      dueDate: new Date(),
      isMainDailyFocus: true,
      goalId: goal1.id,
      milestoneId: milestone3.id,
      skillId: createdSkills['Spring Boot'].id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Practice 3 DSA problems',
      description: 'Graph BFS/DFS and cycle detection in directed graphs.',
      priority: 'HIGH',
      status: 'TODO',
      taskType: 'LEARNING',
      estimatedMinutes: 45,
      actualMinutes: 0,
      dueDate: new Date(),
      goalId: goal1.id,
      milestoneId: milestone3.id,
      skillId: createdSkills['DSA'].id,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      userId: demoUser.id,
      title: 'Update GitHub README',
      description: 'Document architecture, tech stack, and live API endpoints.',
      priority: 'MEDIUM',
      status: 'TODO',
      taskType: 'PORTFOLIO',
      estimatedMinutes: 30,
      actualMinutes: 0,
      goalId: goal1.id,
      skillId: createdSkills['Git/GitHub'].id,
    },
  });

  console.log('✓ Seeded 4 Tasks linked to goal, milestone, and skills');

  // 6. Seed Schedule Blocks matching Section 55 routine
  const { getUserLocalDate, parseLocalDateToUtcDate } = require('../server/src/utils/timezone');
  const todayStr = getUserLocalDate('Asia/Kolkata');
  const today = parseLocalDateToUtcDate(todayStr);

  await prisma.scheduleBlock.createMany({
    data: [
      { userId: demoUser.id, title: 'Personal Routine', date: today, startTime: '06:00', endTime: '08:00', category: 'PERSONAL', recurrence: 'DAILY' },
      { userId: demoUser.id, title: 'Work Routine', date: today, startTime: '08:00', endTime: '19:00', category: 'WORK', recurrence: 'WEEKDAYS' },
      { userId: demoUser.id, title: 'Personal / Dinner', date: today, startTime: '19:00', endTime: '20:00', category: 'PERSONAL', recurrence: 'DAILY' },
      { userId: demoUser.id, title: 'CareerOS Review', date: today, startTime: '20:00', endTime: '20:10', category: 'CAREEROS', recurrence: 'DAILY', goalId: goal1.id },
      { userId: demoUser.id, title: 'Career Focus: Complete JWT Authentication', date: today, startTime: '20:10', endTime: '21:30', category: 'CAREEROS', recurrence: 'NONE', taskId: task2.id, goalId: goal1.id },
      { userId: demoUser.id, title: 'Break', date: today, startTime: '21:30', endTime: '21:40', category: 'PERSONAL', recurrence: 'DAILY' },
      { userId: demoUser.id, title: 'Light Learning: Spring Security', date: today, startTime: '21:40', endTime: '22:00', category: 'LEARNING', recurrence: 'DAILY' },
      { userId: demoUser.id, title: 'Daily Review', date: today, startTime: '22:00', endTime: '22:10', category: 'CAREEROS', recurrence: 'DAILY' },
      { userId: demoUser.id, title: 'Sleep & Recovery', date: today, startTime: '22:30', endTime: '06:00', category: 'OTHER', recurrence: 'DAILY' },
    ],
  });

  console.log('✓ Seeded Schedule Blocks (06:00 to 22:30 routine)');

  // 7. Seed Confirmed DailyPlan for today (Section 55)
  const dailyPlan = await prisma.dailyPlan.create({
    data: {
      userId: demoUser.id,
      date: today,
      mainTaskId: task2.id,
      status: 'CONFIRMED',
      recommendationReason: 'High-priority task in your current roadmap milestone and it fits tonight’s available career window.',
      plannedMinutes: 80,
      confirmedAt: new Date(),
    },
  });

  await prisma.dailyPlanSecondaryTask.createMany({
    data: [
      { dailyPlanId: dailyPlan.id, taskId: task3.id, position: 0 },
      { dailyPlanId: dailyPlan.id, taskId: task4.id, position: 1 },
    ],
  });

  console.log('✓ Seeded Confirmed DailyPlan with main task and 2 secondary tasks');

  console.log('✓ Seeded Confirmed DailyPlan with main task and 2 secondary tasks');

  // 8. Phase 1E: Historical Focus Sessions (320 min = 5h 20m total across 4 active days)
  // Clean old sessions for demo user
  await prisma.focusSession.deleteMany({ where: { userId: demoUser.id } });

  const d1 = new Date(today); d1.setDate(d1.getDate() - 4); d1.setHours(20, 10, 0, 0); // 4 days ago
  const d2 = new Date(today); d2.setDate(d2.getDate() - 3); d2.setHours(20, 0, 0, 0);  // 3 days ago
  const d3 = new Date(today); d3.setDate(d3.getDate() - 2); d3.setHours(19, 30, 0, 0); // 2 days ago
  const d4 = new Date(today); d4.setDate(d4.getDate() - 1); d4.setHours(20, 15, 0, 0); // yesterday

  await prisma.focusSession.createMany({
    data: [
      {
        userId: demoUser.id,
        taskId: task1.id,
        status: 'COMPLETED',
        plannedMinutes: 80,
        actualMinutes: 80,
        durationMinutes: 80,
        completed: true,
        startedAt: d1,
        endedAt: new Date(d1.getTime() + 80 * 60000),
        notes: 'Spring Security filter chain configuration and JWT token provider.',
      },
      {
        userId: demoUser.id,
        taskId: task2.id,
        status: 'COMPLETED',
        plannedMinutes: 90,
        actualMinutes: 90,
        durationMinutes: 90,
        completed: true,
        startedAt: d2,
        endedAt: new Date(d2.getTime() + 90 * 60000),
        notes: 'Implemented refresh token rotation and revoke endpoint in PostgreSQL.',
      },
      {
        userId: demoUser.id,
        taskId: task3.id,
        status: 'COMPLETED',
        plannedMinutes: 90,
        actualMinutes: 90,
        durationMinutes: 90,
        completed: true,
        startedAt: d3,
        endedAt: new Date(d3.getTime() + 90 * 60000),
        notes: 'Solved 3 Medium Graph and Dynamic Programming problems on LeetCode.',
      },
      {
        userId: demoUser.id,
        taskId: task4.id,
        status: 'COMPLETED',
        plannedMinutes: 60,
        actualMinutes: 60,
        durationMinutes: 60,
        completed: true,
        startedAt: d4,
        endedAt: new Date(d4.getTime() + 60 * 60000),
        notes: 'Updated portfolio with architecture diagram and setup instructions.',
      },
    ],
  });

  console.log('✓ Seeded historical focus sessions (5h 20m across 4 active days)');

  // 9. Phase 1E: Blocked Task & Additional Completed Tasks
  const blockedTask = await prisma.task.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      milestoneId: milestone3.id,
      title: 'Deploy JWT project to production cloud VPS',
      priority: 'HIGH',
      status: 'BLOCKED',
      estimatedMinutes: 60,
      actualMinutes: 15,
      description: 'Waiting for cloud firewall and SSL DNS propagation.',
    },
  });

  // 3 additional completed tasks to total 7 completed tasks
  await prisma.task.createMany({
    data: [
      {
        userId: demoUser.id,
        goalId: goal1.id,
        milestoneId: milestone3.id,
        title: 'Review Spring Boot transaction management docs',
        priority: 'MEDIUM',
        taskType: 'LEARNING',
        status: 'COMPLETED',
        estimatedMinutes: 45,
        actualMinutes: 40,
        completedAt: d1,
      },
      {
        userId: demoUser.id,
        goalId: goal1.id,
        milestoneId: milestone3.id,
        title: 'Write integration test suite for Auth API',
        priority: 'HIGH',
        taskType: 'PROJECT',
        status: 'COMPLETED',
        estimatedMinutes: 60,
        actualMinutes: 55,
        completedAt: d2,
      },
      {
        userId: demoUser.id,
        goalId: goal1.id,
        milestoneId: milestone3.id,
        title: 'Draft technical overview blog post',
        priority: 'LOW',
        taskType: 'PORTFOLIO',
        status: 'COMPLETED',
        estimatedMinutes: 45,
        actualMinutes: 45,
        completedAt: d3,
      },
    ],
  });

  console.log('✓ Seeded 1 blocked task and completed tasks (total 7 completed)');

  // 10. Phase 1E: Skill Assessment History for Spring Boot
  const springBootSkill = await prisma.skill.findUnique({ where: { normalizedName: 'spring boot' } });
  if (springBootSkill) {
    const springUserSkill = await prisma.userSkill.findFirst({
      where: { userId: demoUser.id, skillId: springBootSkill.id },
    });

    if (springUserSkill) {
      await prisma.userSkillAssessmentHistory.createMany({
        data: [
          {
            userId: demoUser.id,
            userSkillId: springUserSkill.id,
            skillId: springBootSkill.id,
            previousLevel: 2,
            newLevel: 3,
            targetLevel: 4,
            assessmentType: 'SELF_ASSESSMENT',
            evidence: 'Comfortable with basic CRUD APIs and JPA annotations.',
            notes: 'Completed initial self-audit.',
            changedAt: new Date(Date.now() - 14 * 86400000), // 2 weeks ago
          },
          {
            userId: demoUser.id,
            userSkillId: springUserSkill.id,
            skillId: springBootSkill.id,
            previousLevel: 3,
            newLevel: 4,
            targetLevel: 4,
            assessmentType: 'PROJECT_EVIDENCE',
            evidence: 'Built JWT Authentication & Refresh Token Rotation project with full test coverage.',
            notes: 'Verified against industry standard patterns.',
            changedAt: new Date(Date.now() - 2 * 86400000), // 2 days ago
          },
        ],
      });

      await prisma.userSkill.update({
        where: { id: springUserSkill.id },
        data: {
          currentLevel: 4,
          assessmentType: 'PROJECT_EVIDENCE',
          evidence: 'Built JWT Authentication & Refresh Token Rotation project with full test coverage.',
        },
      });
      console.log('✓ Seeded UserSkillAssessmentHistory for Spring Boot (2 -> 3 -> 4 with Project Evidence)');
    }
  }

  // 11. Phase 1E: Seed Past Completed WeeklyReview (Last Week)
  const lastWeekMonday = new Date(today);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 10);
  const lastWeekSunday = new Date(lastWeekMonday);
  lastWeekSunday.setDate(lastWeekSunday.getDate() + 6);

  await prisma.weeklyReview.create({
    data: {
      userId: demoUser.id,
      weekStartDate: lastWeekMonday,
      weekEndDate: lastWeekSunday,
      status: 'COMPLETED',
      wins: 'Consistently logged 4 focus sessions and finalized PostgreSQL transaction isolation logic.',
      challenges: 'Docker deployment took longer than expected due to WSL networking quirks.',
      learnings: 'Learned advisory locks in PostgreSQL for serialization without table contention.',
      continueDoing: 'Keep morning focus blocks distraction-free.',
      stopDoing: 'Stop browsing tech forums during build times.',
      startDoing: 'Start drafting the resume bullet points immediately upon finishing features.',
      nextWeekMainGoalId: goal1.id,
      nextWeekMainTaskId: task2.id,
      plannedCareerMinutes: 360,
      notes: 'Good execution rhythm established.',
      metricsSnapshot: {
        focusMinutes: 260,
        focusSessionsCompleted: 4,
        tasksCompleted: 5,
        activeDays: 4,
        mainFocusCompleted: 4,
        mainFocusConfirmed: 4,
        milestonesCompleted: 1,
        plannedMinutes: 300,
        differenceMinutes: -40,
        completedAt: lastWeekSunday.toISOString(),
      },
    },
  });

  console.log('✓ Seeded past completed WeeklyReview with snapshot');

  // 12. Phase 1F: Seed Opportunities & Activity History (Section 59)
  const job1 = await prisma.jobOpportunity.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      company: 'Acme Technologies',
      role: 'Software Developer',
      status: 'APPLIED',
      source: 'LINKEDIN',
      location: 'Bengaluru, India',
      workMode: 'HYBRID',
      employmentType: 'FULL_TIME',
      salaryMin: 800000,
      salaryMax: 1200000,
      salaryCurrency: 'INR',
      priority: 'HIGH',
      appliedDate: new Date(Date.now() - 5 * 86400000),
      nextAction: 'Follow up with recruiter',
      nextActionDate: new Date(Date.now() + 1 * 86400000),
      notes: 'Applied via LinkedIn job board. Submitted tailored full stack CV.',
    },
  });

  await prisma.opportunityActivity.createMany({
    data: [
      {
        userId: demoUser.id,
        opportunityType: 'JOB',
        opportunityId: job1.id,
        jobOpportunityId: job1.id,
        activityType: 'CREATED',
        toStatus: 'SAVED',
        title: 'Job opportunity created: Software Developer at Acme Technologies',
        occurredAt: new Date(Date.now() - 6 * 86400000),
      },
      {
        userId: demoUser.id,
        opportunityType: 'JOB',
        opportunityId: job1.id,
        jobOpportunityId: job1.id,
        activityType: 'APPLICATION_SENT',
        fromStatus: 'SAVED',
        toStatus: 'APPLIED',
        title: 'Application submitted for Software Developer at Acme Technologies',
        occurredAt: new Date(Date.now() - 5 * 86400000),
      },
    ],
  });

  const job2 = await prisma.jobOpportunity.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      company: 'Nova Labs',
      role: 'Backend Developer',
      status: 'INTERVIEW',
      source: 'REFERRAL',
      location: 'Remote',
      workMode: 'REMOTE',
      employmentType: 'FULL_TIME',
      salaryMin: 1200000,
      salaryMax: 1600000,
      salaryCurrency: 'INR',
      priority: 'CRITICAL',
      appliedDate: new Date(Date.now() - 10 * 86400000),
      nextAction: 'Prepare technical interview',
      nextActionDate: new Date(Date.now() + 2 * 86400000),
      notes: 'Referral from former colleague. Passed initial phone screen.',
    },
  });

  await prisma.opportunityActivity.createMany({
    data: [
      {
        userId: demoUser.id,
        opportunityType: 'JOB',
        opportunityId: job2.id,
        jobOpportunityId: job2.id,
        activityType: 'CREATED',
        toStatus: 'SAVED',
        title: 'Job opportunity created: Backend Developer at Nova Labs',
        occurredAt: new Date(Date.now() - 12 * 86400000),
      },
      {
        userId: demoUser.id,
        opportunityType: 'JOB',
        opportunityId: job2.id,
        jobOpportunityId: job2.id,
        activityType: 'APPLICATION_SENT',
        fromStatus: 'SAVED',
        toStatus: 'APPLIED',
        title: 'Applied via referral for Backend Developer',
        occurredAt: new Date(Date.now() - 10 * 86400000),
      },
      {
        userId: demoUser.id,
        opportunityType: 'JOB',
        opportunityId: job2.id,
        jobOpportunityId: job2.id,
        activityType: 'INTERVIEW',
        fromStatus: 'APPLIED',
        toStatus: 'INTERVIEW',
        title: 'Recruiter screen cleared. Invited to technical interview.',
        occurredAt: new Date(Date.now() - 2 * 86400000),
      },
    ],
  });

  // Task linked to Nova Labs opportunity
  await prisma.task.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      jobOpportunityId: job2.id,
      title: 'Prepare Nova Labs technical interview questions',
      description: 'Review system design concepts and Spring Boot microservice architectures.',
      priority: 'CRITICAL',
      status: 'TODO',
      taskType: 'JOB_SEARCH',
      dueDate: new Date(Date.now() + 2 * 86400000),
      estimatedMinutes: 60,
    },
  });

  const freelance1 = await prisma.freelanceOpportunity.create({
    data: {
      userId: demoUser.id,
      goalId: goal2.id,
      clientName: 'ABC Ltd',
      projectName: 'Website Redesign',
      status: 'PROPOSAL_SENT',
      source: 'DIRECT_OUTREACH',
      projectType: 'Web Development',
      estimatedValue: '35000 INR',
      estimatedAmount: 35000,
      currency: 'INR',
      priority: 'HIGH',
      firstContactDate: new Date(Date.now() - 8 * 86400000),
      proposalDate: new Date(Date.now() - 3 * 86400000),
      nextAction: 'Follow up on proposal',
      nextActionDate: new Date(Date.now() + 3 * 86400000),
      notes: 'Sent scoped redesign proposal with modern React and responsive layout.',
    },
  });

  await prisma.opportunityActivity.createMany({
    data: [
      {
        userId: demoUser.id,
        opportunityType: 'FREELANCE',
        opportunityId: freelance1.id,
        freelanceOpportunityId: freelance1.id,
        activityType: 'CREATED',
        toStatus: 'LEAD',
        title: 'Lead created for ABC Ltd',
        occurredAt: new Date(Date.now() - 8 * 86400000),
      },
      {
        userId: demoUser.id,
        opportunityType: 'FREELANCE',
        opportunityId: freelance1.id,
        freelanceOpportunityId: freelance1.id,
        activityType: 'PROPOSAL_SENT',
        fromStatus: 'DISCOVERY',
        toStatus: 'PROPOSAL_SENT',
        title: 'Sent Website Redesign Proposal (INR 35,000)',
        occurredAt: new Date(Date.now() - 3 * 86400000),
      },
    ],
  });

  const freelance2 = await prisma.freelanceOpportunity.create({
    data: {
      userId: demoUser.id,
      goalId: goal2.id,
      clientName: 'Client X',
      projectName: 'Analytics Dashboard',
      status: 'DISCOVERY',
      source: 'UPWORK',
      projectType: 'Full Stack App',
      estimatedValue: '50000 INR',
      estimatedAmount: 50000,
      currency: 'INR',
      priority: 'MEDIUM',
      firstContactDate: new Date(Date.now() - 2 * 86400000),
      nextAction: 'Schedule discovery call',
      nextActionDate: new Date(Date.now() + 1 * 86400000),
      notes: 'Upwork inbound query regarding real-time metrics dashboard.',
    },
  });

  await prisma.opportunityActivity.create({
    data: {
      userId: demoUser.id,
      opportunityType: 'FREELANCE',
      opportunityId: freelance2.id,
      freelanceOpportunityId: freelance2.id,
      activityType: 'CREATED',
      toStatus: 'LEAD',
      title: 'Inbound lead received from Client X',
      occurredAt: new Date(Date.now() - 2 * 86400000),
    },
  });

  const internship1 = await prisma.internshipOpportunity.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      company: 'TechCorp Labs',
      role: 'Full Stack Intern',
      status: 'SAVED',
      source: 'COMPANY_WEBSITE',
      location: 'Remote',
      workMode: 'REMOTE',
      stipend: '25000 INR',
      stipendMin: 25000,
      stipendMax: 30000,
      stipendCurrency: 'INR',
      priority: 'MEDIUM',
      nextAction: 'Submit portfolio and application',
      nextActionDate: new Date(Date.now() + 4 * 86400000),
      notes: 'Fallback opportunity for summer cohort.',
    },
  });

  await prisma.opportunityActivity.create({
    data: {
      userId: demoUser.id,
      opportunityType: 'INTERNSHIP',
      opportunityId: internship1.id,
      internshipOpportunityId: internship1.id,
      activityType: 'CREATED',
      toStatus: 'SAVED',
      title: 'Saved TechCorp Labs internship',
      occurredAt: new Date(),
    },
  });

  console.log('✓ Seeded Phase 1F Opportunities (Jobs: Acme, Nova Labs; Freelance: ABC Ltd, Client X; Internship: TechCorp)');

  // ==========================================
  // 9. PHASE 1G: PROJECTS, EVIDENCE & LEARNING (Section 72 & 73)
  // ==========================================
  const nodeSkill = await prisma.skill.upsert({
    where: { normalizedName: 'node.js' },
    update: {},
    create: {
      name: 'Node.js',
      normalizedName: 'node.js',
      category: 'TECHNICAL',
    },
  });

  const postgresSkill = await prisma.skill.upsert({
    where: { normalizedName: 'postgresql' },
    update: {},
    create: {
      name: 'PostgreSQL',
      normalizedName: 'postgresql',
      category: 'TECHNICAL',
    },
  });

  const projectCareerOS = await prisma.project.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      title: 'CareerOS',
      description: 'Personal Career Operating System turning learning and preparation into demonstrable proof of work.',
      projectType: 'PORTFOLIO',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      problemStatement: 'Career planning, preparation, and daily execution are fragmented across disparate spreadsheets, note apps, and job boards.',
      objective: 'Build an end-to-end career operating system linking goals, roadmaps, skills, opportunities, and portfolio evidence.',
      isPortfolioVisible: true,
      repositoryUrl: 'https://github.com/example-user/careeros',
      liveUrl: 'https://careeros.example.app',
      caseStudyUrl: 'https://careeros.example.app/case-study',
      startDate: new Date('2026-08-01T00:00:00Z'),
      targetDate: new Date('2026-10-31T00:00:00Z'),
    },
  });

  // Link skills to CareerOS
  const projectSkillNames = ['React', 'Node.js', 'PostgreSQL'];
  for (const sName of projectSkillNames) {
    let s = createdSkills[sName];
    if (!s) {
      if (sName === 'Node.js') s = nodeSkill;
      if (sName === 'PostgreSQL') s = postgresSkill;
    }
    if (s) {
      await prisma.projectSkill.create({
        data: {
          projectId: projectCareerOS.id,
          skillId: s.id,
          usageLevel: 'PRIMARY',
          notes: `Core technology demonstrated in ${projectCareerOS.title}`,
        },
      });
    }
  }

  // Milestones:
  // Foundation          COMPLETED
  // Planning            COMPLETED
  // Daily Execution     COMPLETED
  // Opportunities       COMPLETED
  // Portfolio Engine    IN_PROGRESS
  // Deployment          TODO
  const projectMilestonesData = [
    { title: 'Foundation', status: 'COMPLETED', order: 1 },
    { title: 'Planning', status: 'COMPLETED', order: 2 },
    { title: 'Daily Execution', status: 'COMPLETED', order: 3 },
    { title: 'Opportunities', status: 'COMPLETED', order: 4 },
    { title: 'Portfolio Engine', status: 'IN_PROGRESS', order: 5 },
    { title: 'Deployment', status: 'TODO', order: 6 },
  ];

  const createdProjectMilestones = [];
  for (const pm of projectMilestonesData) {
    const record = await prisma.projectMilestone.create({
      data: {
        userId: demoUser.id,
        projectId: projectCareerOS.id,
        title: pm.title,
        status: pm.status,
        order: pm.order,
        completedAt: pm.status === 'COMPLETED' ? new Date() : null,
      },
    });
    createdProjectMilestones.push(record);
  }

  // Evidence items:
  // 1. GitHub Repository
  const repoEvidence = await prisma.evidence.create({
    data: {
      userId: demoUser.id,
      projectId: projectCareerOS.id,
      title: 'CareerOS GitHub Repository',
      description: 'Full stack source code for CareerOS platform including server, client, and database schemas.',
      evidenceType: 'GITHUB_REPOSITORY',
      url: 'https://github.com/example-user/careeros',
    },
  });

  if (createdSkills['React']) {
    await prisma.evidenceSkill.create({
      data: {
        evidenceId: repoEvidence.id,
        skillId: createdSkills['React'].id,
        userId: demoUser.id,
        notes: 'Demonstrated React 18 component architecture and custom hooks',
      },
    });
  }

  if (nodeSkill) {
    await prisma.evidenceSkill.create({
      data: {
        evidenceId: repoEvidence.id,
        skillId: nodeSkill.id,
        userId: demoUser.id,
        notes: 'Demonstrated Node.js Express REST API backend architecture',
      },
    });
  }

  // 2. Project Architecture Document
  await prisma.evidence.create({
    data: {
      userId: demoUser.id,
      projectId: projectCareerOS.id,
      title: 'CareerOS Architecture Document',
      description: 'System design document outlining data flow, state machine, and timezone synchronization.',
      evidenceType: 'DOCUMENT',
      url: 'https://example.com/docs/careeros-architecture.pdf',
    },
  });

  // 3. Demo / Screenshot placeholder
  await prisma.evidence.create({
    data: {
      userId: demoUser.id,
      projectId: projectCareerOS.id,
      title: 'CareerOS Live Preview',
      description: 'Interactive preview and demo deployment of the application.',
      evidenceType: 'LIVE_DEMO',
      url: 'https://careeros.example.app/demo',
    },
  });

  // Learning Path: Spring Boot Backend (Section 73)
  const springSkill = createdSkills['Spring Boot'];
  const springUserSkill = await prisma.userSkill.findFirst({
    where: { userId: demoUser.id, skillId: springSkill?.id },
  });

  const springPath = await prisma.learningPath.create({
    data: {
      userId: demoUser.id,
      goalId: goal1.id,
      skillId: springSkill ? springSkill.id : null,
      userSkillId: springUserSkill ? springUserSkill.id : null,
      title: 'Spring Boot Backend',
      description: 'Master enterprise backend engineering with Spring Boot 3, JPA, and Spring Security.',
      provider: 'Official Docs & Practice',
      category: 'Backend Development',
      status: 'IN_PROGRESS',
      estimatedHours: 40.0,
      startedAt: new Date('2026-08-15T00:00:00Z'),
    },
  });

  // Modules:
  // REST Fundamentals       COMPLETED
  // Spring Data JPA         COMPLETED
  // Spring Security JWT     IN_PROGRESS
  // Testing                 NOT_STARTED
  // Deployment              NOT_STARTED
  const springModulesData = [
    { title: 'REST Fundamentals', status: 'COMPLETED', type: 'READ', order: 1, mins: 90 },
    { title: 'Spring Data JPA', status: 'COMPLETED', type: 'PRACTICE', order: 2, mins: 120 },
    { title: 'Spring Security JWT', status: 'IN_PROGRESS', type: 'BUILD', order: 3, mins: 150 },
    { title: 'Testing', status: 'NOT_STARTED', type: 'PRACTICE', order: 4, mins: 90 },
    { title: 'Deployment', status: 'NOT_STARTED', type: 'BUILD', order: 5, mins: 60 },
  ];

  for (const mod of springModulesData) {
    await prisma.learningModule.create({
      data: {
        userId: demoUser.id,
        learningPathId: springPath.id,
        title: mod.title,
        status: mod.status,
        moduleType: mod.type,
        order: mod.order,
        sequence: mod.order,
        estimatedMinutes: mod.mins,
        isCompleted: mod.status === 'COMPLETED',
        completedAt: mod.status === 'COMPLETED' ? new Date('2026-08-20T00:00:00Z') : null,
      },
    });
  }

  console.log('✓ Seeded Phase 1G Projects, Evidence, and Learning Path');

  // 13. Phase 1H: Settings, User Preferences, Reminders & In-App Notifications (Section 78)
  await prisma.userPreference.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      userId: demoUser.id,
      defaultFocusMinutes: 25,
      weeklyCareerMinutesTarget: 600,
      preferredDays: 'MON,TUE,WED,THU,FRI',
      preferredStartTime: '09:00',
      preferredEndTime: '18:00',
      defaultCurrency: 'USD',
      defaultOpportunityPriority: 'HIGH',
      emailNotificationsEnabled: true,
      inAppNotificationsEnabled: true,
      dailyReviewReminderEnabled: true,
      dailyReviewReminderTime: '20:00',
      careerReviewReminderEnabled: true,
      careerReviewReminderTime: '08:00',
      weeklyReviewReminderEnabled: true,
      weeklyReviewDay: 0, // Sunday
      weeklyReviewTime: '20:00',
      opportunityFollowUpReminderEnabled: true,
      taskDueReminderEnabled: true,
      theme: 'SYSTEM',
    },
  });

  await prisma.reminder.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Daily Career Focus Review',
        message: 'Review what moved today and pick tomorrow\'s top priority focus.',
        type: 'DAILY_CAREEROS_REVIEW',
        time: '20:00',
        enabled: true,
        channel: 'IN_APP',
        notificationChannel: 'IN_APP',
        timezone: 'Asia/Kolkata',
        recurrence: 'DAILY',
      },
      {
        userId: demoUser.id,
        title: 'Daily Shutdown & Tomorrow Plan',
        message: 'Log your progress and wrap up your daily career session.',
        type: 'DAILY_SHUTDOWN',
        time: '22:00',
        enabled: true,
        channel: 'IN_APP',
        notificationChannel: 'IN_APP',
        timezone: 'Asia/Kolkata',
        recurrence: 'DAILY',
      },
      {
        userId: demoUser.id,
        title: 'Weekly Career Review',
        message: 'Review weekly progress, reflect on wins, and set direction for next week.',
        type: 'WEEKLY_CAREER_REVIEW',
        time: '20:00',
        dayOfWeek: 0, // Sunday
        enabled: true,
        channel: 'IN_APP',
        notificationChannel: 'IN_APP',
        timezone: 'Asia/Kolkata',
        recurrence: 'WEEKLY',
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        type: 'DAILY_REVIEW',
        title: 'Daily Review Reminder',
        message: 'Time to complete your daily shutdown and reflect on today\'s achievements.',
        entityType: 'REVIEW',
        readAt: null,
        channel: 'IN_APP',
        deliveryStatus: 'SENT',
      },
      {
        userId: demoUser.id,
        type: 'OPPORTUNITY_FOLLOW_UP',
        title: 'Recruiter Follow-up Due',
        message: 'Follow-up is due for your Senior Full Stack application at Acme Corp.',
        entityType: 'OPPORTUNITY',
        readAt: null,
        channel: 'IN_APP',
        deliveryStatus: 'SENT',
      },
    ],
  });

  console.log('✓ Seeded Phase 1H Settings, Preferences, Reminders, and Notifications');

  console.log('\n=============================================');
  console.log('✅ Demo Seed Data Ready (Phase 1H):');
  console.log(`   Email:         ${demoEmail}`);
  console.log(`   Password:      ${rawPassword}`);
  console.log(`   Goal:          ${goal1.title}`);
  console.log(`   Roadmap:       ${roadmap.title} (2/10 milestones complete)`);
  console.log(`   Focus Hours:   5h 20m across 4 active days`);
  console.log(`   Skills Level:  Spring Boot level 4 (Project Evidence)`);
  console.log(`   Past Review:   Last week completed review with snapshot`);
  console.log(`   Opportunities: 2 Jobs, 2 Freelance, 1 Internship seeded`);
  console.log(`   Projects:      CareerOS (PORTFOLIO, 4/5 non-skipped milestones complete)`);
  console.log(`   Learning Path: Spring Boot Backend (2/5 modules complete)`);
  console.log(`   Reminders:     Daily Review (20:00), Daily Shutdown (22:00), Weekly Review (Sun 20:00)`);
  console.log(`   Notifications: 2 in-app notifications seeded`);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
