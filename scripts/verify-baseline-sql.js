const fs = require('fs');
const sql = fs.readFileSync('prisma/migrations/00000000000000_careeros_baseline/migration.sql', 'utf8');

const checks = [
  // Tables
  'CREATE TABLE "users"',
  'CREATE TABLE "user_profiles"',
  'CREATE TABLE "refresh_tokens"',
  'CREATE TABLE "goals"',
  'CREATE TABLE "roadmaps"',
  'CREATE TABLE "roadmap_milestones"',
  'CREATE TABLE "skills"',
  'CREATE TABLE "user_skills"',
  'CREATE TABLE "tasks"',
  'CREATE TABLE "schedule_blocks"',
  'CREATE TABLE "daily_plans"',
  'CREATE TABLE "daily_plan_secondary_tasks"',
  'CREATE TABLE "focus_sessions"',
  'CREATE TABLE "daily_reviews"',

  // Columns especially checked
  '"normalizedName" TEXT NOT NULL',
  '"taskId" TEXT',
  '"goalId" TEXT',
  '"onboardingStep" INTEGER NOT NULL',
  '"onboardingDraft" JSONB',
  '"onboardingCompleted" BOOLEAN NOT NULL',
  '"interruptionCount" INTEGER NOT NULL',
  '"totalPausedSeconds" INTEGER NOT NULL',
  '"tomorrowMainTaskId" TEXT',
  '"blockerSummary" TEXT',

  // Enums
  'CREATE TYPE "DailyPlanStatus"',
  'CREATE TYPE "FocusSessionStatus"',
  'CREATE TYPE "EnergyLevel"',
  'CREATE TYPE "MilestoneStatus"',
  'CREATE TYPE "AssessmentType"',

  // Foreign keys
  'ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_roadmapId_fkey"',
  'ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_taskId_fkey"',
  'ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_goalId_fkey"',
  'ALTER TABLE "daily_plans" ADD CONSTRAINT "daily_plans_userId_fkey"',
  'ALTER TABLE "daily_plan_secondary_tasks" ADD CONSTRAINT "daily_plan_secondary_tasks_dailyPlanId_fkey"'
];

let allPassed = true;
checks.forEach(c => {
  const found = sql.includes(c);
  if (!found) allPassed = false;
  console.log((found ? '✓ PASS: ' : '✗ FAIL: ') + c);
});

console.log(allPassed ? '\n🎉 ALL BASELINE SQL CHECKS PASSED!' : '\n⚠️ SOME CHECKS FAILED');
