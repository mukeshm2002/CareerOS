-- CreateEnum
CREATE TYPE "WeeklyReviewStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- AlterTable
ALTER TABLE "weekly_reviews" ADD COLUMN "challenges" TEXT,
ADD COLUMN "continueDoing" TEXT,
ADD COLUMN "learnings" TEXT,
ADD COLUMN "metricsSnapshot" JSONB,
ADD COLUMN "nextWeekMainGoalId" TEXT,
ADD COLUMN "nextWeekMainTaskId" TEXT,
ADD COLUMN "notes" TEXT,
ADD COLUMN "plannedCareerMinutes" INTEGER,
ADD COLUMN "startDoing" TEXT,
ADD COLUMN "status" "WeeklyReviewStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN "stopDoing" TEXT,
ADD COLUMN "wins" TEXT;

-- CreateTable
CREATE TABLE "user_skill_assessment_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userSkillId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "previousLevel" INTEGER NOT NULL,
    "newLevel" INTEGER NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "assessmentType" "AssessmentType" NOT NULL DEFAULT 'SELF_ASSESSMENT',
    "evidence" TEXT,
    "notes" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skill_assessment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_skill_assessment_history_userId_idx" ON "user_skill_assessment_history"("userId");

-- CreateIndex
CREATE INDEX "user_skill_assessment_history_userSkillId_idx" ON "user_skill_assessment_history"("userSkillId");

-- CreateIndex
CREATE INDEX "user_skill_assessment_history_skillId_idx" ON "user_skill_assessment_history"("skillId");

-- CreateIndex
CREATE INDEX "weekly_reviews_userId_idx" ON "weekly_reviews"("userId");

-- AddForeignKey
ALTER TABLE "user_skill_assessment_history" ADD CONSTRAINT "user_skill_assessment_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_assessment_history" ADD CONSTRAINT "user_skill_assessment_history_userSkillId_fkey" FOREIGN KEY ("userSkillId") REFERENCES "user_skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_assessment_history" ADD CONSTRAINT "user_skill_assessment_history_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
