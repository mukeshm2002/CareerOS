-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReminderType" ADD VALUE 'DAILY_CAREER_REVIEW';
ALTER TYPE "ReminderType" ADD VALUE 'WEEKLY_REVIEW';
ALTER TYPE "ReminderType" ADD VALUE 'TASK_DUE';
ALTER TYPE "ReminderType" ADD VALUE 'OPPORTUNITY_FOLLOW_UP';
ALTER TYPE "ReminderType" ADD VALUE 'INTERVIEW';
ALTER TYPE "ReminderType" ADD VALUE 'FREELANCE_FOLLOW_UP';

-- AlterTable
ALTER TABLE "reminders" ADD COLUMN     "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
ADD COLUMN     "lastTriggeredAt" TIMESTAMP(3),
ADD COLUMN     "linkedFreelanceOpportunityId" TEXT,
ADD COLUMN     "linkedGoalId" TEXT,
ADD COLUMN     "linkedInternshipOpportunityId" TEXT,
ADD COLUMN     "linkedJobOpportunityId" TEXT,
ADD COLUMN     "linkedTaskId" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "nextTriggerAt" TIMESTAMP(3),
ADD COLUMN     "recurrence" TEXT DEFAULT 'DAILY',
ADD COLUMN     "scheduledFor" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "defaultFocusMinutes" INTEGER NOT NULL DEFAULT 25,
    "weeklyCareerMinutesTarget" INTEGER NOT NULL DEFAULT 600,
    "preferredDays" TEXT DEFAULT 'MON,TUE,WED,THU,FRI',
    "preferredStartTime" TEXT DEFAULT '09:00',
    "preferredEndTime" TEXT DEFAULT '18:00',
    "defaultCurrency" TEXT DEFAULT 'USD',
    "defaultOpportunityPriority" TEXT DEFAULT 'MEDIUM',
    "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyReviewReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dailyReviewReminderTime" TEXT DEFAULT '20:00',
    "careerReviewReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "careerReviewReminderTime" TEXT DEFAULT '08:00',
    "weeklyReviewReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReviewDay" INTEGER DEFAULT 0,
    "weeklyReviewTime" TEXT DEFAULT '20:00',
    "opportunityFollowUpReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "taskDueReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "theme" TEXT DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "entityType" TEXT,
    "entityId" TEXT,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "deliveryStatus" TEXT DEFAULT 'SENT',
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key" ON "user_preferences"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "reminders_userId_enabled_nextTriggerAt_idx" ON "reminders"("userId", "enabled", "nextTriggerAt");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_linkedTaskId_fkey" FOREIGN KEY ("linkedTaskId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_linkedGoalId_fkey" FOREIGN KEY ("linkedGoalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_linkedJobOpportunityId_fkey" FOREIGN KEY ("linkedJobOpportunityId") REFERENCES "job_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_linkedFreelanceOpportunityId_fkey" FOREIGN KEY ("linkedFreelanceOpportunityId") REFERENCES "freelance_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_linkedInternshipOpportunityId_fkey" FOREIGN KEY ("linkedInternshipOpportunityId") REFERENCES "internship_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
