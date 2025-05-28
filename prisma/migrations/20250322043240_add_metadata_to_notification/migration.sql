-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER', 'NEWS', 'SYSTEM', 'PROMOTION', 'ALERT', 'UPDATE');

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "NotificationType";
