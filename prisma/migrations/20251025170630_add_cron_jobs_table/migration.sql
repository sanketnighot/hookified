-- CreateTable
CREATE TABLE "cron_jobs" (
    "id" TEXT NOT NULL,
    "hookId" TEXT NOT NULL,
    "cronExpression" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cron_jobs_hookId_key" ON "cron_jobs"("hookId");
