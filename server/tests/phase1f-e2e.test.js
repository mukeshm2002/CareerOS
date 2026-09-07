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

  return {
    id: regRes.data.data.user.id,
    token,
    email,
  };
}

async function runPhase1FTests() {
  console.log('=============================================================');
  console.log('🚀 CAREEROS PHASE 1F REAL POSTGRESQL E2E VERIFICATION SUITE');
  console.log('=============================================================\n');

  const port = 63920 + Math.floor(Math.random() * 50);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, resolve));
  baseUrl = `http://localhost:${port}`;
  console.log(`Test server running on port ${port}\n`);

  try {
    // -------------------------------------------------------------
    // 1. SETUP & ONBOARDING (User A and User B)
    // -------------------------------------------------------------
    console.log('--- TEST GROUP 1: SETUP & USER ISOLATION PREREQUISITES ---');
    const ts = Date.now();
    const userA = await registerAndLogin(`userA_p1f_${ts}@test.com`, 'Pass1234!', 'User A India', 'Asia/Kolkata');
    assert(userA.token, 'User A registered and authenticated in Asia/Kolkata');

    const userB = await registerAndLogin(`userB_p1f_${ts}@test.com`, 'Pass1234!', 'User B NYC', 'America/New_York');
    assert(userB.token, 'User B registered and authenticated in America/New_York');

    // Create Goal for User A
    const goalResA = await request('POST', '/api/goals', {
      title: 'Target Software Engineer Role',
      type: 'JOB_SWITCH',
      priority: 'HIGH',
      targetRole: 'Senior Full Stack',
      targetSalary: '$140k',
    }, userA.token);
    assert(goalResA.status === 201, 'User A created Goal A');
    const goalIdA = goalResA.data.data.goal?.id || goalResA.data.data.id;

    // Create Goal for User B
    const goalResB = await request('POST', '/api/goals', {
      title: 'User B NYC Goal',
      type: 'SALARY_GROWTH',
      priority: 'HIGH',
    }, userB.token);
    assert(goalResB.status === 201, 'User B created Goal B');
    const goalIdB = goalResB.data.data.goal?.id || goalResB.data.data.id;

    // -------------------------------------------------------------
    // 2. JOB OPPORTUNITY LIFECYCLE & ACTIVITY LOGGING
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 2: JOB OPPORTUNITY LIFECYCLE & ACTIVITY HISTORY ---');
    
    // Create Job
    const createJobRes = await request('POST', '/api/opportunities/jobs', {
      company: 'Acme Systems',
      role: 'Full Stack Engineer',
      goalId: goalIdA,
      source: 'LINKEDIN',
      location: 'Remote',
      workMode: 'REMOTE',
      employmentType: 'FULL_TIME',
      salaryMin: 900000,
      salaryMax: 1300000,
      salaryCurrency: 'INR',
      priority: 'HIGH',
      status: 'SAVED',
      nextAction: 'Tailor resume and portfolio',
      nextActionDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      notes: 'Initial bookmark from LinkedIn recruiter email.',
    }, userA.token);

    assert(createJobRes.status === 201, 'User A created Job Opportunity (201 Created)');
    const jobA = createJobRes.data.job;
    assert(jobA.company === 'Acme Systems', 'Job company saved accurately');
    assert(jobA.status === 'SAVED', 'Job starts in SAVED status');
    assert(jobA.goalId === goalIdA, 'Job successfully linked to User A Goal');
    assert(jobA.activities && jobA.activities.length === 1, 'Initial CREATED activity automatically logged');
    assert(jobA.activities[0].activityType === 'CREATED', 'Activity type is CREATED');

    // Read Job by ID
    const getJobRes = await request('GET', `/api/opportunities/jobs/${jobA.id}`, null, userA.token);
    assert(getJobRes.status === 200, 'GET /api/opportunities/jobs/:id returns 200 OK');
    assert(getJobRes.data.job.id === jobA.id, 'Fetched job ID matches');

    // Update Stage to APPLIED
    const applyRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'APPLIED',
      notes: 'Submitted customized application with project links.',
    }, userA.token);

    assert(applyRes.status === 200, 'PATCH status to APPLIED returns 200 OK');
    assert(applyRes.data.job.status === 'APPLIED', 'Job status updated to APPLIED');
    assert(applyRes.data.job.activities.length === 2, 'Activity history has 2 immutable entries');
    assert(applyRes.data.job.activities[0].activityType === 'APPLICATION_SENT', 'New activity is APPLICATION_SENT');
    assert(applyRes.data.job.activities[0].fromStatus === 'SAVED', 'fromStatus is SAVED');
    assert(applyRes.data.job.activities[0].toStatus === 'APPLIED', 'toStatus is APPLIED');

    // Status transition: Repeat same status APPLIED (no duplicate activity per Section 12)
    const repeatApplyRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'APPLIED',
    }, userA.token);
    assert(repeatApplyRes.status === 200, 'Repeat status update returns 200 OK');
    assert(repeatApplyRes.data.job.activities.length === 2, 'No duplicate activity logged when status did not change (Section 12)');

    // Move Stage to INTERVIEW
    const interviewRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'INTERVIEW',
      notes: 'Cleared screening call. Technical round scheduled.',
    }, userA.token);
    assert(interviewRes.status === 200, 'Moved job to INTERVIEW status');
    assert(interviewRes.data.job.status === 'INTERVIEW', 'Status updated to INTERVIEW');

    // Move Stage to OFFER with offerSalary
    const offerRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'OFFER',
      offerSalary: 1250000,
      offerCurrency: 'INR',
      notes: 'Official offer letter received.',
    }, userA.token);
    assert(offerRes.status === 200, 'Moved job to OFFER status');
    assert(offerRes.data.job.offerSalary === 1250000, 'Offer salary recorded');
    assert(offerRes.data.job.offerCurrency === 'INR', 'Offer currency recorded');

    // Move Stage to ACCEPTED
    const acceptRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'ACCEPTED',
    }, userA.token);
    assert(acceptRes.status === 200, 'Job accepted');
    assert(acceptRes.data.job.status === 'ACCEPTED', 'Status is ACCEPTED');
    assert(Boolean(acceptRes.data.job.acceptedAt), 'acceptedAt timestamp recorded');

    // Add manual activity note
    const noteRes = await request('POST', `/api/opportunities/jobs/${jobA.id}/activity`, {
      activityType: 'NOTE',
      title: 'Salary negotiation note',
      description: 'Negotiated joining bonus and remote stipend.',
    }, userA.token);
    assert(noteRes.status === 201, 'POST /jobs/:id/activity created custom activity (201 Created)');

    // -------------------------------------------------------------
    // 3. FREELANCE OPPORTUNITY LIFECYCLE & COMMERCIAL VALUES
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 3: FREELANCE OPPORTUNITY LIFECYCLE & COMMERCIAL TRACKING ---');

    const createFreelanceRes = await request('POST', '/api/opportunities/freelance', {
      clientName: 'Fintech Studio',
      projectName: 'Payment Gateway Migration',
      goalId: goalIdA,
      source: 'UPWORK',
      projectType: 'Backend Development',
      estimatedValue: '45000 INR',
      estimatedAmount: 45000,
      currency: 'INR',
      priority: 'HIGH',
      status: 'LEAD',
      nextAction: 'Send scope of work proposal',
      nextActionDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
    }, userA.token);

    assert(createFreelanceRes.status === 201, 'User A created Freelance Lead (201 Created)');
    const freelanceA = createFreelanceRes.data.freelance;
    assert(freelanceA.clientName === 'Fintech Studio', 'Client name saved');
    assert(freelanceA.status === 'LEAD', 'Status is LEAD');

    // Stage progression: CONTACTED -> PROPOSAL_SENT -> WON
    const contactRes = await request('PATCH', `/api/opportunities/freelance/${freelanceA.id}/status`, {
      status: 'CONTACTED',
    }, userA.token);
    assert(contactRes.status === 200, 'Freelance moved to CONTACTED');

    const proposalRes = await request('PATCH', `/api/opportunities/freelance/${freelanceA.id}/status`, {
      status: 'PROPOSAL_SENT',
      notes: 'Sent formal proposal document via email.',
    }, userA.token);
    assert(proposalRes.status === 200, 'Freelance moved to PROPOSAL_SENT');

    const wonRes = await request('PATCH', `/api/opportunities/freelance/${freelanceA.id}/status`, {
      status: 'WON',
      agreedValue: 50000,
      currency: 'INR',
      notes: 'Client agreed to 50k INR fixed price.',
    }, userA.token);
    assert(wonRes.status === 200, 'Freelance moved to WON');
    assert(wonRes.data.freelance.agreedValue === 50000, 'agreedValue recorded accurately');

    // Completed Freelance
    const completeFreelanceRes = await request('PATCH', `/api/opportunities/freelance/${freelanceA.id}/status`, {
      status: 'COMPLETED',
    }, userA.token);
    assert(completeFreelanceRes.status === 200, 'Freelance moved to COMPLETED');

    // Create second freelance lead and mark LOST
    const lostLeadRes = await request('POST', '/api/opportunities/freelance', {
      clientName: 'Stale Client',
      projectName: 'Legacy App Rewrite',
      currency: 'USD',
      status: 'LEAD',
    }, userA.token);
    const lostId = lostLeadRes.data.freelance.id;

    const lostRes = await request('PATCH', `/api/opportunities/freelance/${lostId}/status`, {
      status: 'LOST',
      lostReason: 'Client put the initiative on hold due to budget freeze.',
    }, userA.token);
    assert(lostRes.status === 200, 'Freelance marked LOST');
    assert(lostRes.data.freelance.lostReason.includes('budget freeze'), 'lostReason captured');

    // -------------------------------------------------------------
    // 4. INTERNSHIP OPPORTUNITY LIFECYCLE
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 4: INTERNSHIP OPPORTUNITY LIFECYCLE ---');

    const createInternshipRes = await request('POST', '/api/opportunities/internships', {
      company: 'DataCorp',
      role: 'ML Research Intern',
      source: 'COMPANY_WEBSITE',
      location: 'Bengaluru',
      workMode: 'HYBRID',
      stipendMin: 30000,
      stipendMax: 40000,
      stipendCurrency: 'INR',
      priority: 'MEDIUM',
      status: 'SAVED',
      nextAction: 'Submit research paper links',
    }, userA.token);

    assert(createInternshipRes.status === 201, 'Created Internship Opportunity (201 Created)');
    const internA = createInternshipRes.data.internship;

    // Apply -> Interview -> Offer -> Accepted
    const internApply = await request('PATCH', `/api/opportunities/internships/${internA.id}/status`, {
      status: 'APPLIED',
    }, userA.token);
    assert(internApply.status === 200, 'Internship moved to APPLIED');

    const internInterview = await request('PATCH', `/api/opportunities/internships/${internA.id}/status`, {
      status: 'INTERVIEW',
    }, userA.token);
    assert(internInterview.status === 200, 'Internship moved to INTERVIEW');

    const internOffer = await request('PATCH', `/api/opportunities/internships/${internA.id}/status`, {
      status: 'OFFER',
      offerStipend: 35000,
    }, userA.token);
    assert(internOffer.status === 200, 'Internship moved to OFFER');
    assert(internOffer.data.internship.offerStipend === 35000, 'offerStipend captured');

    const internAccepted = await request('PATCH', `/api/opportunities/internships/${internA.id}/status`, {
      status: 'ACCEPTED',
    }, userA.token);
    assert(internAccepted.status === 200, 'Internship moved to ACCEPTED');

    // -------------------------------------------------------------
    // 5. OPPORTUNITY → TASK CONNECTION (Sections 33, 34, 36)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 5: OPPORTUNITY → TASK CONNECTION ---');

    // Create fresh active job opportunity with nextAction
    const newJobRes = await request('POST', '/api/opportunities/jobs', {
      company: 'Nova Labs',
      role: 'Backend Architect',
      goalId: goalIdA,
      status: 'APPLIED',
      priority: 'CRITICAL',
      nextAction: 'Prepare system design presentation',
      nextActionDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    }, userA.token);
    const newJob = newJobRes.data.job;

    // Convert next action to Task
    const taskFromJobRes = await request('POST', `/api/opportunities/jobs/${newJob.id}/task`, {
      title: 'Prepare system design presentation for Nova Labs',
      priority: 'CRITICAL',
      taskType: 'JOB_SEARCH',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      estimatedMinutes: 90,
    }, userA.token);

    assert(taskFromJobRes.status === 201, 'POST /jobs/:id/task creates CareerOS Task (201 Created)');
    const createdTask = taskFromJobRes.data.task;
    assert(createdTask.jobOpportunityId === newJob.id, 'Task is linked to jobOpportunityId');
    assert(createdTask.goalId === goalIdA, 'Task inherited goalId from job opportunity');
    assert(createdTask.taskType === 'JOB_SEARCH', 'taskType is JOB_SEARCH');
    assert(createdTask.priority === 'CRITICAL', 'Task priority preserved');

    // Direct task creation linking opportunity
    const directTaskRes = await request('POST', '/api/tasks', {
      title: 'Send follow up email to Nova Labs',
      jobOpportunityId: newJob.id,
      taskType: 'JOB_SEARCH',
      priority: 'HIGH',
      estimatedMinutes: 30,
    }, userA.token);
    assert(directTaskRes.status === 201, 'Direct POST /api/tasks supports jobOpportunityId');

    // Mutual exclusivity check: Task linking both job and freelance opportunities simultaneously (Section 34)
    const multiLinkRes = await request('POST', '/api/tasks', {
      title: 'Conflicting task with multiple opportunity links',
      jobOpportunityId: newJob.id,
      freelanceOpportunityId: freelanceA.id,
      taskType: 'JOB_SEARCH',
    }, userA.token);
    assert(multiLinkRes.status === 400, 'Task with multiple opportunity types simultaneously rejected with 400 Bad Request (Section 34)');

    // -------------------------------------------------------------
    // 6. TIMEZONE FOLLOW-UP DUE & OVERDUE LOGIC (Sections 45 & 47)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 6: TIMEZONE DETERMINISTIC FOLLOW-UP DUE LOGIC ---');

    // Create Job with nextActionDate 2 days in past
    const pastDate = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
    const overdueJobRes = await request('POST', '/api/opportunities/jobs', {
      company: 'Overdue Tech',
      role: 'QA Automation Lead',
      status: 'APPLIED',
      nextAction: 'Follow up on recruiter feedback',
      nextActionDate: pastDate,
    }, userA.token);
    const overdueJob = overdueJobRes.data.job;

    assert(overdueJob.followUpDue === true, 'Overdue job has followUpDue: true');
    assert(overdueJob.daysOverdue >= 2, `daysOverdue computed deterministically (got ${overdueJob.daysOverdue})`);

    // Terminal status must clear followUpDue (Section 45 & 46)
    const rejectOverdueRes = await request('PATCH', `/api/opportunities/jobs/${overdueJob.id}/status`, {
      status: 'REJECTED',
      rejectionReason: 'Role cancelled internally',
    }, userA.token);
    assert(rejectOverdueRes.data.job.followUpDue === false, 'Terminal REJECTED job has followUpDue: false');

    // Filter by followUpDue=true
    const dueListRes = await request('GET', '/api/opportunities/jobs?followUpDue=true', null, userA.token);
    assert(dueListRes.status === 200, 'GET /jobs?followUpDue=true returns 200 OK');
    const allAreDue = dueListRes.data.jobs.every((j) => j.followUpDue);
    assert(allAreDue, 'All jobs returned by ?followUpDue=true have followUpDue: true');

    // -------------------------------------------------------------
    // 7. STALE OPPORTUNITY LOGIC (Section 15 & 66)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 7: STALE OPPORTUNITY DETERMINISTIC LOGIC ---');

    // Seed database directly with old occurredAt to test deterministic staleness
    const staleJob = await prisma.jobOpportunity.create({
      data: {
        userId: userA.id,
        company: 'Stale Global',
        role: 'Legacy Dev',
        status: 'APPLIED',
        appliedDate: new Date(Date.now() - 16 * 86400000),
        updatedAt: new Date(Date.now() - 16 * 86400000),
      },
    });

    await prisma.opportunityActivity.create({
      data: {
        userId: userA.id,
        opportunityType: 'JOB',
        opportunityId: staleJob.id,
        jobOpportunityId: staleJob.id,
        activityType: 'APPLICATION_SENT',
        occurredAt: new Date(Date.now() - 16 * 86400000),
        title: 'Application sent 16 days ago',
      },
    });

    const getStaleRes = await request('GET', `/api/opportunities/jobs/${staleJob.id}`, null, userA.token);
    assert(getStaleRes.data.job.isStale === true, 'Job inactive for >= 14 days is identified as isStale: true (Section 15)');
    assert(getStaleRes.data.job.daysSinceLastActivity >= 14, 'daysSinceLastActivity is >= 14');
    assert(Boolean(getStaleRes.data.job.staleReason), 'Factual staleReason provided');

    // Filter by stale=true
    const staleListRes = await request('GET', '/api/opportunities/jobs?stale=true', null, userA.token);
    assert(staleListRes.status === 200, 'GET /jobs?stale=true returns 200');
    assert(staleListRes.data.jobs.some((j) => j.id === staleJob.id), 'Stale job returned in stale filter');

    // -------------------------------------------------------------
    // 8. METRICS, CONVERSION RATES & ZERO DENOMINATOR SAFETY (Sections 41-44)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 8: METRICS, CONVERSION ENGINE & ZERO DENOMINATOR ---');

    const metricsRes = await request('GET', '/api/opportunities/metrics', null, userA.token);
    assert(metricsRes.status === 200, 'GET /api/opportunities/metrics returns 200 OK');
    const m = metricsRes.data.metrics;
    assert(typeof m.jobs.totalApplications === 'number', 'Job totalApplications is a factual number');
    assert(typeof m.jobs.totalInterviews === 'number', 'Job totalInterviews is a factual number');
    assert(typeof m.freelance.totalProposals === 'number', 'Freelance totalProposals is a factual number');
    assert(typeof m.freelance.totalWon === 'number', 'Freelance totalWon is a factual number');
    assert(Array.isArray(m.sources.jobs), 'Job sources is an array');
    assert(Array.isArray(m.sources.freelance), 'Freelance sources is an array');

    // User B with zero opportunities must return null conversion rates (Section 43)
    const metricsResB = await request('GET', '/api/opportunities/metrics', null, userB.token);
    assert(metricsResB.status === 200, 'User B metrics returns 200');
    assert(metricsResB.data.metrics.jobs.interviewRate === null, 'Interview rate returns null when denominator = 0 (Section 43)');
    assert(metricsResB.data.metrics.jobs.offerRate === null, 'Offer rate returns null when denominator = 0');
    assert(metricsResB.data.metrics.freelance.proposalWinRate === null, 'Proposal win rate returns null when proposals = 0');

    // -------------------------------------------------------------
    // 9. DASHBOARD & OVERVIEW INTEGRATION (Section 37 & 38)
    // -------------------------------------------------------------
    // Create active freelance lead for dashboard check
    await request('POST', '/api/opportunities/freelance', {
      clientName: 'Active Client Co',
      projectName: 'Full Stack Portal',
      status: 'PROPOSAL_SENT',
      priority: 'HIGH',
      nextAction: 'Follow up with Client Co',
      nextActionDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    }, userA.token);

    const dashRes = await request('GET', '/api/dashboard', null, userA.token);
    assert(dashRes.status === 200, 'GET /api/dashboard returns 200 OK');
    assert(dashRes.data.data.opportunities !== undefined, 'Dashboard response includes opportunities summary (Section 37)');
    assert(dashRes.data.data.opportunities.jobs.activeCount > 0, 'Factual active jobs count returned');
    assert(dashRes.data.data.opportunities.freelance.activeCount > 0, 'Factual active freelance count returned');
    assert(typeof dashRes.data.data.opportunities.followUpsDue === 'number', 'Factual followUpsDue count returned');
    assert(dashRes.data.data.careerCheck.jobSearch !== undefined, 'Career Check includes jobSearch (Section 38)');
    assert(dashRes.data.data.careerCheck.freelancing !== undefined, 'Career Check includes freelancing (Section 38)');

    // -------------------------------------------------------------
    // 10. PROGRESS & WEEKLY REVIEW INTEGRATION (Sections 39 & 40)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 10: PROGRESS & WEEKLY REVIEW INTEGRATION ---');

    const progressRes = await request('GET', '/api/progress?period=THIS_WEEK', null, userA.token);
    assert(progressRes.status === 200, 'GET /api/progress returns 200 OK');
    assert(progressRes.data.data.opportunityActivity !== undefined, 'Progress includes opportunityActivity (Section 39)');
    assert(typeof progressRes.data.data.opportunityActivity.applicationsSubmitted === 'number', 'applicationsSubmitted is factual count');
    assert(typeof progressRes.data.data.opportunityActivity.interviews === 'number', 'interviews is factual count');

    const weeklyRes = await request('GET', '/api/reviews/weekly/current', null, userA.token);
    assert(weeklyRes.status === 200, 'GET /api/reviews/weekly/current returns 200 OK');
    assert(weeklyRes.data.data.currentFacts.opportunityActivity !== undefined, 'Weekly Review currentFacts includes opportunityActivity (Section 40)');

    // -------------------------------------------------------------
    // 11. GET SIDE-EFFECT FREEDOM TEST (Section 71)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 11: GET SIDE-EFFECT FREEDOM TEST ---');

    const countActivitiesBefore = await prisma.opportunityActivity.count();
    const countJobsBefore = await prisma.jobOpportunity.count();
    const countTasksBefore = await prisma.task.count();

    await request('GET', '/api/opportunities/jobs', null, userA.token);
    await request('GET', `/api/opportunities/jobs/${jobA.id}`, null, userA.token);
    await request('GET', '/api/opportunities/freelance', null, userA.token);
    await request('GET', '/api/opportunities/internships', null, userA.token);
    await request('GET', '/api/opportunities/metrics', null, userA.token);
    await request('GET', '/api/dashboard', null, userA.token);
    await request('GET', '/api/progress', null, userA.token);
    await request('GET', '/api/reviews/weekly/current', null, userA.token);

    const countActivitiesAfter = await prisma.opportunityActivity.count();
    const countJobsAfter = await prisma.jobOpportunity.count();
    const countTasksAfter = await prisma.task.count();

    assert(countActivitiesBefore === countActivitiesAfter, 'Repeated GET requests created ZERO new activity rows (Section 71)');
    assert(countJobsBefore === countJobsAfter, 'Repeated GET requests created ZERO new opportunity rows');
    assert(countTasksBefore === countTasksAfter, 'Repeated GET requests created ZERO new task rows');

    // -------------------------------------------------------------
    // 12. ARCHIVING & RESTORING (Section 50)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 12: ARCHIVING & RESTORATION ---');

    const archiveRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/archive`, null, userA.token);
    assert(archiveRes.status === 200, 'Archive job returns 200 OK');
    assert(archiveRes.data.job.archivedAt !== null, 'job.archivedAt is populated');
    assert(archiveRes.data.job.status === 'ARCHIVED', 'job.status set to ARCHIVED');

    // Verify archived job is excluded from normal list
    const activeList = await request('GET', '/api/opportunities/jobs', null, userA.token);
    const inActiveList = activeList.data.jobs.some((j) => j.id === jobA.id);
    assert(!inActiveList, 'Archived job is excluded from active list');

    // Verify archived job is returned in ?archived=true
    const archivedList = await request('GET', '/api/opportunities/jobs?archived=true', null, userA.token);
    const inArchivedList = archivedList.data.jobs.some((j) => j.id === jobA.id);
    assert(inArchivedList, 'Archived job is retrievable via ?archived=true');

    // Restore job
    const restoreRes = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/archive`, null, userA.token);
    assert(restoreRes.status === 200, 'Restore job returns 200 OK');
    assert(restoreRes.data.job.archivedAt === null, 'job.archivedAt cleared');

    // -------------------------------------------------------------
    // 13. CROSS-USER ISOLATION & ATTACK SURFACE (Section 20, 21, 72)
    // -------------------------------------------------------------
    console.log('\n--- TEST GROUP 13: STRICT USER ISOLATION & SECURITY GATE ---');

    // User B attempting to read User A's Job -> 404
    const crossGetJob = await request('GET', `/api/opportunities/jobs/${jobA.id}`, null, userB.token);
    assert(crossGetJob.status === 404, 'User B GET User A job returns safe 404 Not Found (Section 20)');

    // User B attempting to update User A's Job -> 404
    const crossPutJob = await request('PUT', `/api/opportunities/jobs/${jobA.id}`, {
      company: 'Hacked Inc',
      role: 'Attacker',
    }, userB.token);
    assert(crossPutJob.status === 404, 'User B PUT User A job returns safe 404 Not Found');

    // User B attempting to change status of User A's Job -> 404
    const crossStatusJob = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/status`, {
      status: 'REJECTED',
    }, userB.token);
    assert(crossStatusJob.status === 404, 'User B PATCH User A job status returns safe 404 Not Found');

    // User B attempting to add activity on User A's Job -> 404
    const crossActJob = await request('POST', `/api/opportunities/jobs/${jobA.id}/activity`, {
      activityType: 'NOTE',
      title: 'Malicious note',
    }, userB.token);
    assert(crossActJob.status === 404, 'User B POST activity on User A job returns safe 404 Not Found (Section 21)');

    // User B attempting to create task from User A's Job -> 404
    const crossTaskJob = await request('POST', `/api/opportunities/jobs/${jobA.id}/task`, {
      title: 'Malicious task',
    }, userB.token);
    assert(crossTaskJob.status === 404, 'User B POST task on User A job returns safe 404 Not Found');

    // User B attempting to archive User A's Job -> 404
    const crossArchiveJob = await request('PATCH', `/api/opportunities/jobs/${jobA.id}/archive`, null, userB.token);
    assert(crossArchiveJob.status === 404, 'User B PATCH archive on User A job returns safe 404 Not Found');

    // User B attempting to DELETE User A's Job -> 404
    const crossDeleteJob = await request('DELETE', `/api/opportunities/jobs/${jobA.id}`, null, userB.token);
    assert(crossDeleteJob.status === 404, 'User B DELETE User A job returns safe 404 Not Found');

    // Cross-user Freelance isolation
    const crossGetFreelance = await request('GET', `/api/opportunities/freelance/${freelanceA.id}`, null, userB.token);
    assert(crossGetFreelance.status === 404, 'User B GET User A freelance returns safe 404 Not Found');

    const crossStatusFreelance = await request('PATCH', `/api/opportunities/freelance/${freelanceA.id}/status`, {
      status: 'LOST',
    }, userB.token);
    assert(crossStatusFreelance.status === 404, 'User B PATCH User A freelance status returns safe 404 Not Found');

    // Cross-user Internship isolation
    const crossGetIntern = await request('GET', `/api/opportunities/internships/${internA.id}`, null, userB.token);
    assert(crossGetIntern.status === 404, 'User B GET User A internship returns safe 404 Not Found');

    // Goal linking security: User A creating job linking User B's Goal -> 404
    const crossGoalJob = await request('POST', '/api/opportunities/jobs', {
      company: 'Goal Thief LLC',
      role: 'Dev',
      goalId: goalIdB, // User B's goal!
    }, userA.token);
    assert(crossGoalJob.status === 404, 'User A creating job linking User B Goal rejected with safe 404 Not Found (Section 20)');

    // Unauthenticated requests -> 401
    const unauthJobs = await request('GET', '/api/opportunities/jobs');
    assert(unauthJobs.status === 401, 'Unauthenticated GET /opportunities/jobs rejected with 401');

    console.log('\n=============================================================');
    console.log(`🎉 ALL PHASE 1F E2E TESTS COMPLETED: ${testsPassed} PASS, ${testsFailed} FAIL`);
    console.log('=============================================================\n');

  } finally {
    if (server) {
      server.close();
    }
  }
}

runPhase1FTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ E2E TEST RUNNER FAILED:', err);
    process.exit(1);
  });
