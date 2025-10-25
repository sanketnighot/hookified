-- AlterTable
ALTER TABLE "hooks" ADD COLUMN     "alchemyWebhookId" TEXT,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "lastProcessedBlock" BIGINT;
