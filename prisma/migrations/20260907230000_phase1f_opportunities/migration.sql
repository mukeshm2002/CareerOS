-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('JOB', 'FREELANCE', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "OpportunityActivityType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'APPLICATION_SENT', 'FOLLOW_UP', 'CALL', 'EMAIL', 'ASSESSMENT', 'INTERVIEW', 'PROPOSAL_SENT', 'MEETING', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'REJECTED', 'WON', 'LOST', 'NOTE', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FreelanceStage" ADD VALUE 'RESEARCHING';
ALTER TYPE "FreelanceStage" ADD VALUE 'DISCOVERY';
ALTER TYPE "FreelanceStage" ADD VALUE 'PROPOSAL_PREPARATION';
ALTER TYPE "FreelanceStage" ADD VALUE 'FOLLOW_UP';
ALTER TYPE "FreelanceStage" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "FreelanceStage" ADD VALUE 'COMPLETED';
ALTER TYPE "FreelanceStage" ADD VALUE 'ARCHIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InternshipStage" ADD VALUE 'PREPARING';
ALTER TYPE "InternshipStage" ADD VALUE 'ASSESSMENT';
ALTER TYPE "InternshipStage" ADD VALUE 'ACCEPTED';
ALTER TYPE "InternshipStage" ADD VALUE 'ARCHIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JobStage" ADD VALUE 'PREPARING';
ALTER TYPE "JobStage" ADD VALUE 'ASSESSMENT';
ALTER TYPE "JobStage" ADD VALUE 'FINAL_INTERVIEW';
ALTER TYPE "JobStage" ADD VALUE 'ACCEPTED';
ALTER TYPE "JobStage" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "freelance_opportunities" ADD COLUMN     "actualEndDate" TIMESTAMP(3),
ADD COLUMN     "actualStartDate" TIMESTAMP(3),
ADD COLUMN     "agreedValue" DOUBLE PRECISION,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "currency" TEXT DEFAULT 'USD',
ADD COLUMN     "estimatedAmount" DOUBLE PRECISION,
ADD COLUMN     "expectedStartDate" TIMESTAMP(3),
ADD COLUMN     "firstContactDate" TIMESTAMP(3),
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "lostReason" TEXT,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDate" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "proposalDate" TIMESTAMP(3),
ADD COLUMN     "sourceLabel" TEXT;

-- AlterTable
ALTER TABLE "internship_opportunities" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "internshipUrl" TEXT,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDate" TIMESTAMP(3),
ADD COLUMN     "offerStipend" INTEGER,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceLabel" TEXT,
ADD COLUMN     "stipendCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "stipendMax" INTEGER,
ADD COLUMN     "stipendMin" INTEGER,
ADD COLUMN     "workMode" "WorkMode" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "job_opportunities" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDate" TIMESTAMP(3),
ADD COLUMN     "offerCurrency" TEXT,
ADD COLUMN     "offerNotes" TEXT,
ADD COLUMN     "offerSalary" INTEGER,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "salaryCurrency" TEXT DEFAULT 'USD',
ADD COLUMN     "salaryMax" INTEGER,
ADD COLUMN     "salaryMin" INTEGER,
ADD COLUMN     "savedDate" TIMESTAMP(3),
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sourceLabel" TEXT,
ADD COLUMN     "workMode" "WorkMode" NOT NULL DEFAULT 'UNKNOWN';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "freelanceOpportunityId" TEXT,
ADD COLUMN     "internshipOpportunityId" TEXT,
ADD COLUMN     "jobOpportunityId" TEXT;

-- CreateTable
CREATE TABLE "opportunity_activities" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityType" "OpportunityType" NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "activityType" "OpportunityActivityType" NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "jobOpportunityId" TEXT,
    "freelanceOpportunityId" TEXT,
    "internshipOpportunityId" TEXT,

    CONSTRAINT "opportunity_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_activities_userId_idx" ON "opportunity_activities"("userId");

-- CreateIndex
CREATE INDEX "opportunity_activities_opportunityType_opportunityId_idx" ON "opportunity_activities"("opportunityType", "opportunityId");

-- CreateIndex
CREATE INDEX "opportunity_activities_userId_occurredAt_idx" ON "opportunity_activities"("userId", "occurredAt");

-- CreateIndex
CREATE INDEX "freelance_opportunities_userId_status_idx" ON "freelance_opportunities"("userId", "status");

-- CreateIndex
CREATE INDEX "freelance_opportunities_userId_nextActionDate_idx" ON "freelance_opportunities"("userId", "nextActionDate");

-- CreateIndex
CREATE INDEX "internship_opportunities_userId_status_idx" ON "internship_opportunities"("userId", "status");

-- CreateIndex
CREATE INDEX "internship_opportunities_userId_nextActionDate_idx" ON "internship_opportunities"("userId", "nextActionDate");

-- CreateIndex
CREATE INDEX "job_opportunities_userId_status_idx" ON "job_opportunities"("userId", "status");

-- CreateIndex
CREATE INDEX "job_opportunities_userId_nextActionDate_idx" ON "job_opportunities"("userId", "nextActionDate");

-- CreateIndex
CREATE INDEX "tasks_jobOpportunityId_idx" ON "tasks"("jobOpportunityId");

-- CreateIndex
CREATE INDEX "tasks_freelanceOpportunityId_idx" ON "tasks"("freelanceOpportunityId");

-- CreateIndex
CREATE INDEX "tasks_internshipOpportunityId_idx" ON "tasks"("internshipOpportunityId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_jobOpportunityId_fkey" FOREIGN KEY ("jobOpportunityId") REFERENCES "job_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_freelanceOpportunityId_fkey" FOREIGN KEY ("freelanceOpportunityId") REFERENCES "freelance_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_internshipOpportunityId_fkey" FOREIGN KEY ("internshipOpportunityId") REFERENCES "internship_opportunities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freelance_opportunities" ADD CONSTRAINT "freelance_opportunities_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internship_opportunities" ADD CONSTRAINT "internship_opportunities_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_jobOpportunityId_fkey" FOREIGN KEY ("jobOpportunityId") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_freelanceOpportunityId_fkey" FOREIGN KEY ("freelanceOpportunityId") REFERENCES "freelance_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_activities" ADD CONSTRAINT "opportunity_activities_internshipOpportunityId_fkey" FOREIGN KEY ("internshipOpportunityId") REFERENCES "internship_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
