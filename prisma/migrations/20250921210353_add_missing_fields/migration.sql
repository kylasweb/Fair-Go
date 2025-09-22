-- AlterTable
ALTER TABLE "drivers" ADD COLUMN "approvedAt" DATETIME;
ALTER TABLE "drivers" ADD COLUMN "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN "data" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN "suspensionReason" TEXT;
