-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'IMMEDIATE';
