-- AlterTable
ALTER TABLE "goals" ADD COLUMN IF NOT EXISTS "why" TEXT;

-- AlterTable
ALTER TABLE "goal_check_ins" ADD COLUMN IF NOT EXISTS "adjustmentsNeeded" TEXT;
