-- CreateEnum
CREATE TYPE "GrowthArea" AS ENUM ('CAREER', 'COMMUNICATION', 'HEALTH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_SPOKEN_ENGLISH';
ALTER TYPE "GoalType" ADD VALUE 'SPEAK_MORE_CONFIDENTLY';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_PROFESSIONAL_COMMUNICATION';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_WRITING';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_PRESENTATION_SKILLS';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_INTERVIEW_COMMUNICATION';
ALTER TYPE "GoalType" ADD VALUE 'LEARN_A_LANGUAGE';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_FITNESS';
ALTER TYPE "GoalType" ADD VALUE 'BUILD_EXERCISE_HABIT';
ALTER TYPE "GoalType" ADD VALUE 'IMPROVE_SLEEP';
ALTER TYPE "GoalType" ADD VALUE 'EAT_BETTER';
ALTER TYPE "GoalType" ADD VALUE 'WALKING_STEPS';
ALTER TYPE "GoalType" ADD VALUE 'DRINK_ENOUGH_WATER';
ALTER TYPE "GoalType" ADD VALUE 'MAINTAIN_HEALTHY_WEIGHT';
ALTER TYPE "GoalType" ADD VALUE 'GAIN_HEALTHY_WEIGHT';
ALTER TYPE "GoalType" ADD VALUE 'RELAXATION_STRESS_ROUTINE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ScheduleCategory" ADD VALUE 'COMMUNICATION';
ALTER TYPE "ScheduleCategory" ADD VALUE 'HEALTH';

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "growthArea" "GrowthArea" NOT NULL DEFAULT 'CAREER',
ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "growthArea" "GrowthArea" DEFAULT 'CAREER';

-- CreateIndex
CREATE INDEX "goals_userId_growthArea_idx" ON "goals"("userId", "growthArea");

-- CreateIndex
CREATE INDEX "tasks_userId_growthArea_idx" ON "tasks"("userId", "growthArea");
