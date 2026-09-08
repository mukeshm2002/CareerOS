-- CreateTable
CREATE TABLE "daily_work_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "logDate" DATE NOT NULL,
    "workedOn" TEXT,
    "learned" TEXT,
    "blockers" TEXT,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_work_logs_userId_idx" ON "daily_work_logs"("userId");

-- CreateIndex
CREATE INDEX "daily_work_logs_userId_logDate_idx" ON "daily_work_logs"("userId", "logDate");

-- CreateIndex
CREATE UNIQUE INDEX "daily_work_logs_userId_logDate_key" ON "daily_work_logs"("userId", "logDate");

-- AddForeignKey
ALTER TABLE "daily_work_logs" ADD CONSTRAINT "daily_work_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
