-- CreateEnum
CREATE TYPE "TrackingMethod" AS ENUM ('MILESTONES', 'TASKS', 'NUMBER_TARGET', 'ROUTINE', 'MANUAL');

-- CreateEnum
CREATE TYPE "GoalConfidence" AS ENUM ('ON_TRACK', 'NEEDS_ATTENTION', 'AT_RISK');

-- AlterEnum
ALTER TYPE "ItemStatus" ADD VALUE IF NOT EXISTS 'PLANNED';
ALTER TYPE "ItemStatus" ADD VALUE IF NOT EXISTS 'ABANDONED';

-- AlterTable
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "desiredOutcome" TEXT,
ADD COLUMN IF NOT EXISTS "trackingMethod" "TrackingMethod" NOT NULL DEFAULT 'MILESTONES',
ADD COLUMN IF NOT EXISTS "area" TEXT DEFAULT 'CAREER',
ADD COLUMN IF NOT EXISTS "customArea" TEXT,
ADD COLUMN IF NOT EXISTS "startValue" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "currentValue" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN IF NOT EXISTS "targetValue" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "unit" TEXT,
ADD COLUMN IF NOT EXISTS "routineFrequency" INTEGER,
ADD COLUMN IF NOT EXISTS "routinePeriod" TEXT,
ADD COLUMN IF NOT EXISTS "manualProgress" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "pauseReason" TEXT,
ADD COLUMN IF NOT EXISTS "resumeDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "abandonReason" TEXT,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "reflection" TEXT,
ADD COLUMN IF NOT EXISTS "learnings" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "goal_success_criteria" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_success_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "goal_check_ins" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "confidence" "GoalConfidence" NOT NULL DEFAULT 'ON_TRACK',
    "progress" INTEGER,
    "whatIsGoingWell" TEXT,
    "whatIsGettingInWay" TEXT,
    "planAdjustments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goal_check_ins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "goal_success_criteria_goalId_idx" ON "goal_success_criteria"("goalId");
CREATE INDEX IF NOT EXISTS "goal_success_criteria_userId_idx" ON "goal_success_criteria"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "goal_check_ins_goalId_idx" ON "goal_check_ins"("goalId");
CREATE INDEX IF NOT EXISTS "goal_check_ins_userId_idx" ON "goal_check_ins"("userId");

-- AddForeignKey
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goal_success_criteria_goalId_fkey') THEN
    ALTER TABLE "goal_success_criteria" ADD CONSTRAINT "goal_success_criteria_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goal_success_criteria_userId_fkey') THEN
    ALTER TABLE "goal_success_criteria" ADD CONSTRAINT "goal_success_criteria_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goal_check_ins_goalId_fkey') THEN
    ALTER TABLE "goal_check_ins" ADD CONSTRAINT "goal_check_ins_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'goal_check_ins_userId_fkey') THEN
    ALTER TABLE "goal_check_ins" ADD CONSTRAINT "goal_check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
