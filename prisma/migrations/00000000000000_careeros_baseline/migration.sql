-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CareerStage" AS ENUM ('STUDENT', 'FRESHER', 'WORKING_PROFESSIONAL', 'FREELANCER', 'CAREER_BREAK', 'CAREER_SWITCHER', 'ENTREPRENEUR', 'OTHER');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'MANAGER', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('FIRST_JOB', 'JOB_SWITCH', 'SALARY_GROWTH', 'PROMOTION', 'FREELANCING', 'CAREER_CHANGE', 'SKILL_MASTERY', 'CERTIFICATION', 'PORTFOLIO', 'BUSINESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('SELF_ASSESSMENT', 'PROJECT_EVIDENCE', 'CERTIFICATION', 'INTERVIEW_FEEDBACK', 'QUIZ', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKDAYS', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('LEARNING', 'PROJECT', 'JOB_SEARCH', 'FREELANCE', 'INTERVIEW', 'PORTFOLIO', 'NETWORKING', 'CERTIFICATION', 'CAREER_ADMIN', 'OTHER', 'CAREER_GOAL', 'ROADMAP_ACTION', 'SKILL_PRACTICE', 'APPLICATION', 'PROJECT_WORK', 'ROUTINE', 'GENERAL');

-- CreateEnum
CREATE TYPE "SkillCategory" AS ENUM ('TECHNICAL', 'PROFESSIONAL', 'COMMUNICATION', 'DOMAIN', 'TOOLS', 'OTHER');

-- CreateEnum
CREATE TYPE "ScheduleCategory" AS ENUM ('WORK', 'STUDY', 'PERSONAL', 'CAREEROS', 'LEARNING', 'PROJECT', 'FREELANCE', 'INTERVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStage" AS ENUM ('SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "FreelanceStage" AS ENUM ('LEAD', 'CONTACTED', 'PROPOSAL_SENT', 'MEETING', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "InternshipStage" AS ENUM ('SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('IDEA', 'PLANNING', 'BUILDING', 'TESTING', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('DAILY_CAREEROS_REVIEW', 'DAILY_SHUTDOWN', 'WEEKLY_CAREER_REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "DailyPlanStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED');

-- CreateEnum
CREATE TYPE "FocusSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnergyLevel" AS ENUM ('VERY_LOW', 'LOW', 'OKAY', 'GOOD', 'HIGH');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "displayName" TEXT,
    "avatarUrl" TEXT,
    "currentSituation" "CareerStage" DEFAULT 'STUDENT',
    "currentRole" TEXT,
    "targetRole" TEXT,
    "targetSalary" TEXT,
    "experienceLevel" "ExperienceLevel" DEFAULT 'MID_LEVEL',
    "timezone" TEXT DEFAULT 'UTC',
    "country" TEXT,
    "wakeTime" TEXT,
    "workStartTime" TEXT,
    "workEndTime" TEXT,
    "personalStartTime" TEXT,
    "personalEndTime" TEXT,
    "sleepTime" TEXT,
    "availableCareerMinutes" INTEGER DEFAULT 120,
    "onboardingStep" INTEGER NOT NULL DEFAULT 1,
    "onboardingDraft" JSONB,
    "careerMission" TEXT,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "GoalType" NOT NULL DEFAULT 'JOB_SWITCH',
    "priority" "Priority" NOT NULL DEFAULT 'HIGH',
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "targetDate" TIMESTAMP(3),
    "targetRole" TEXT,
    "targetSalary" TEXT,
    "salaryCurrency" TEXT DEFAULT 'USD',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmaps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_milestones" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dependencyMilestoneId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "category" "SkillCategory" NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "targetLevel" INTEGER NOT NULL DEFAULT 4,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'SELF_ASSESSMENT',
    "evidence" TEXT,
    "notes" TEXT,
    "lastPracticed" TIMESTAMP(3),
    "lastPracticedAt" TIMESTAMP(3),
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "taskType" "TaskType" NOT NULL DEFAULT 'GENERAL',
    "dueDate" TIMESTAMP(3),
    "estimatedMinutes" INTEGER DEFAULT 30,
    "actualMinutes" INTEGER DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "isMainDailyFocus" BOOLEAN NOT NULL DEFAULT false,
    "goalId" TEXT,
    "milestoneId" TEXT,
    "skillId" TEXT,
    "userSkillId" TEXT,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_blocks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "category" "ScheduleCategory" NOT NULL DEFAULT 'CAREEROS',
    "recurrence" TEXT DEFAULT 'NONE',
    "notes" TEXT,
    "taskId" TEXT,
    "goalId" TEXT,
    "linkedTaskId" TEXT,
    "linkedGoalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "jobUrl" TEXT,
    "location" TEXT,
    "salaryRange" TEXT,
    "appliedDate" TIMESTAMP(3),
    "status" "JobStage" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelance_opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "source" TEXT,
    "estimatedValue" TEXT,
    "status" "FreelanceStage" NOT NULL DEFAULT 'LEAD',
    "nextFollowUp" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freelance_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "internship_opportunities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "jobUrl" TEXT,
    "location" TEXT,
    "stipend" TEXT,
    "appliedDate" TIMESTAMP(3),
    "status" "InternshipStage" NOT NULL DEFAULT 'SAVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internship_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'IDEA',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "githubUrl" TEXT,
    "liveUrl" TEXT,
    "portfolioReady" BOOLEAN NOT NULL DEFAULT false,
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_paths" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "provider" TEXT,
    "category" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" DOUBLE PRECISION DEFAULT 10.0,
    "completedHours" DOUBLE PRECISION DEFAULT 0.0,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "userSkillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_modules" (
    "id" TEXT NOT NULL,
    "learningPathId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "mainTaskId" TEXT,
    "status" "DailyPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "recommendationReason" TEXT,
    "plannedMinutes" INTEGER,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_plan_secondary_tasks" (
    "id" TEXT NOT NULL,
    "dailyPlanId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_plan_secondary_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "energyLevel" "EnergyLevel",
    "mood" TEXT,
    "completedSummary" TEXT,
    "learnedSummary" TEXT,
    "learnings" TEXT,
    "blockerSummary" TEXT,
    "blockers" TEXT,
    "tomorrowMainTaskId" TEXT,
    "tomorrowMainTask" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "deepWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "tasksCompletedCount" INTEGER NOT NULL DEFAULT 0,
    "learningHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "applicationsSentCount" INTEGER NOT NULL DEFAULT 0,
    "freelanceOutreachCount" INTEGER NOT NULL DEFAULT 0,
    "goalsProgressSummary" TEXT,
    "whatWentWell" TEXT,
    "whatBlocked" TEXT,
    "changesNextWeek" TEXT,
    "nextWeekMainGoal" TEXT,
    "nextWeekPrimaryOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReminderType" NOT NULL DEFAULT 'DAILY_CAREEROS_REVIEW',
    "time" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notificationChannel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "focus_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT,
    "dailyPlanId" TEXT,
    "status" "FocusSessionStatus" NOT NULL DEFAULT 'COMPLETED',
    "plannedMinutes" INTEGER NOT NULL DEFAULT 25,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "durationMinutes" INTEGER NOT NULL DEFAULT 25,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "totalPausedSeconds" INTEGER NOT NULL DEFAULT 0,
    "interruptionCount" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "focus_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");

-- CreateIndex
CREATE INDEX "goals_userId_idx" ON "goals"("userId");

-- CreateIndex
CREATE INDEX "roadmaps_userId_idx" ON "roadmaps"("userId");

-- CreateIndex
CREATE INDEX "roadmaps_goalId_idx" ON "roadmaps"("goalId");

-- CreateIndex
CREATE INDEX "roadmap_milestones_roadmapId_idx" ON "roadmap_milestones"("roadmapId");

-- CreateIndex
CREATE INDEX "roadmap_milestones_userId_idx" ON "roadmap_milestones"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalizedName_key" ON "skills"("normalizedName");

-- CreateIndex
CREATE INDEX "user_skills_userId_idx" ON "user_skills"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "tasks_dueDate_idx" ON "tasks"("dueDate");

-- CreateIndex
CREATE INDEX "schedule_blocks_userId_date_idx" ON "schedule_blocks"("userId", "date");

-- CreateIndex
CREATE INDEX "job_opportunities_userId_idx" ON "job_opportunities"("userId");

-- CreateIndex
CREATE INDEX "freelance_opportunities_userId_idx" ON "freelance_opportunities"("userId");

-- CreateIndex
CREATE INDEX "internship_opportunities_userId_idx" ON "internship_opportunities"("userId");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_skills_projectId_skillId_key" ON "project_skills"("projectId", "skillId");

-- CreateIndex
CREATE INDEX "learning_paths_userId_idx" ON "learning_paths"("userId");

-- CreateIndex
CREATE INDEX "learning_modules_learningPathId_idx" ON "learning_modules"("learningPathId");

-- CreateIndex
CREATE INDEX "daily_plans_userId_idx" ON "daily_plans"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_plans_userId_date_key" ON "daily_plans"("userId", "date");

-- CreateIndex
CREATE INDEX "daily_plan_secondary_tasks_dailyPlanId_idx" ON "daily_plan_secondary_tasks"("dailyPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_plan_secondary_tasks_dailyPlanId_taskId_key" ON "daily_plan_secondary_tasks"("dailyPlanId", "taskId");

-- CreateIndex
CREATE INDEX "daily_reviews_userId_idx" ON "daily_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reviews_userId_date_key" ON "daily_reviews"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_reviews_userId_weekStartDate_key" ON "weekly_reviews"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "reminders_userId_idx" ON "reminders"("userId");

-- CreateIndex
CREATE INDEX "focus_sessions_userId_idx" ON "focus_sessions"("userId");

-- CreateIndex
CREATE INDEX "focus_sessions_userId_status_idx" ON "focus_sessions"("userId", "status");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "roadmap_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "user_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_opportunities" ADD CONSTRAINT "freelance_opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_opportunities" ADD CONSTRAINT "internship_opportunities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "user_skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "learning_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_mainTaskId_fkey" FOREIGN KEY ("mainTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plan_secondary_tasks" ADD CONSTRAINT "daily_plan_secondary_tasks_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "daily_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_plan_secondary_tasks" ADD CONSTRAINT "daily_plan_secondary_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reviews" ADD CONSTRAINT "daily_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reviews" ADD CONSTRAINT "daily_reviews_tomorrowMainTaskId_fkey" FOREIGN KEY ("tomorrowMainTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_reviews" ADD CONSTRAINT "weekly_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "focus_sessions" ADD CONSTRAINT "focus_sessions_dailyPlanId_fkey" FOREIGN KEY ("dailyPlanId") REFERENCES "daily_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

