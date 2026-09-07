/*
  Warnings:

  - The `status` column on the `learning_paths` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `userId` to the `learning_modules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `project_skills` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PERSONAL', 'LEARNING', 'PORTFOLIO', 'FREELANCE', 'INTERNSHIP', 'WORK', 'OPEN_SOURCE', 'ACADEMIC', 'CASE_STUDY', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectMilestoneStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('GITHUB_REPOSITORY', 'LIVE_DEMO', 'SCREENSHOT', 'DESIGN_FILE', 'CAD_FILE', 'DOCUMENT', 'CERTIFICATE', 'ARTICLE', 'PRESENTATION', 'VIDEO', 'ASSESSMENT', 'CUSTOMER_FEEDBACK', 'WORK_SAMPLE', 'OTHER');

-- CreateEnum
CREATE TYPE "LearningModuleType" AS ENUM ('READ', 'WATCH', 'PRACTICE', 'BUILD', 'ASSESSMENT', 'PROJECT', 'OTHER');

-- CreateEnum
CREATE TYPE "LearningModuleStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "LearningPathStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'PLANNED';
ALTER TYPE "ProjectStatus" ADD VALUE 'IN_PROGRESS';
ALTER TYPE "ProjectStatus" ADD VALUE 'BLOCKED';

-- AlterTable
ALTER TABLE "learning_modules" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimatedMinutes" INTEGER DEFAULT 30,
ADD COLUMN     "moduleType" "LearningModuleType" NOT NULL DEFAULT 'READ',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "resourceUrl" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "status" "LearningModuleStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "learning_paths" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "skillId" TEXT,
ADD COLUMN     "startedAt" TIMESTAMP(3),
ADD COLUMN     "targetDate" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "LearningPathStatus" NOT NULL DEFAULT 'NOT_STARTED';

-- AlterTable
ALTER TABLE "project_skills" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usageLevel" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "caseStudyUrl" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "demoUrl" TEXT,
ADD COLUMN     "goalId" TEXT,
ADD COLUMN     "isPortfolioVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "objective" TEXT,
ADD COLUMN     "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "problemStatement" TEXT,
ADD COLUMN     "projectType" "ProjectType" NOT NULL DEFAULT 'PERSONAL',
ADD COLUMN     "repositoryUrl" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "learningModuleId" TEXT,
ADD COLUMN     "projectMilestoneId" TEXT;

-- CreateTable
CREATE TABLE "project_milestones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectMilestoneStatus" NOT NULL DEFAULT 'TODO',
    "targetDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "evidenceType" "EvidenceType" NOT NULL DEFAULT 'OTHER',
    "url" TEXT,
    "fileName" TEXT,
    "externalReference" TEXT,
    "projectId" TEXT,
    "projectMilestoneId" TEXT,
    "learningModuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_skills" (
    "id" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_milestones_userId_idx" ON "project_milestones"("userId");

-- CreateIndex
CREATE INDEX "project_milestones_projectId_idx" ON "project_milestones"("projectId");

-- CreateIndex
CREATE INDEX "evidence_userId_idx" ON "evidence"("userId");

-- CreateIndex
CREATE INDEX "evidence_projectId_idx" ON "evidence"("projectId");

-- CreateIndex
CREATE INDEX "evidence_projectMilestoneId_idx" ON "evidence"("projectMilestoneId");

-- CreateIndex
CREATE INDEX "evidence_learningModuleId_idx" ON "evidence"("learningModuleId");

-- CreateIndex
CREATE INDEX "evidence_skills_userId_idx" ON "evidence_skills"("userId");

-- CreateIndex
CREATE INDEX "evidence_skills_evidenceId_idx" ON "evidence_skills"("evidenceId");

-- CreateIndex
CREATE INDEX "evidence_skills_skillId_idx" ON "evidence_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_skills_evidenceId_skillId_key" ON "evidence_skills"("evidenceId", "skillId");

-- CreateIndex
CREATE INDEX "learning_modules_userId_idx" ON "learning_modules"("userId");

-- CreateIndex
CREATE INDEX "learning_paths_goalId_idx" ON "learning_paths"("goalId");

-- CreateIndex
CREATE INDEX "learning_paths_skillId_idx" ON "learning_paths"("skillId");

-- CreateIndex
CREATE INDEX "project_skills_projectId_idx" ON "project_skills"("projectId");

-- CreateIndex
CREATE INDEX "project_skills_skillId_idx" ON "project_skills"("skillId");

-- CreateIndex
CREATE INDEX "projects_goalId_idx" ON "projects"("goalId");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "tasks_projectMilestoneId_idx" ON "tasks"("projectMilestoneId");

-- CreateIndex
CREATE INDEX "tasks_learningModuleId_idx" ON "tasks"("learningModuleId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectMilestoneId_fkey" FOREIGN KEY ("projectMilestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_learningModuleId_fkey" FOREIGN KEY ("learningModuleId") REFERENCES "learning_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_projectMilestoneId_fkey" FOREIGN KEY ("projectMilestoneId") REFERENCES "project_milestones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_learningModuleId_fkey" FOREIGN KEY ("learningModuleId") REFERENCES "learning_modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "evidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_skills" ADD CONSTRAINT "evidence_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_paths" ADD CONSTRAINT "learning_paths_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
