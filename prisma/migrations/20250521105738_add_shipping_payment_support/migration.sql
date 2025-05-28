/*
  Warnings:

  - The primary key for the `_CategoryToDeal` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_DealToProduct` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `_PermissionToRole` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_CategoryToDeal` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_DealToProduct` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[A,B]` on the table `_PermissionToRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `amountDue` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShippingPaymentType" AS ENUM ('PAY_NOW', 'PAY_ON_DELIVERY');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIALLY_PAID';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "amountDue" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "shippingPaymentType" "ShippingPaymentType" NOT NULL DEFAULT 'PAY_NOW';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Shipping" ADD COLUMN     "paymentType" "ShippingPaymentType" NOT NULL DEFAULT 'PAY_NOW';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasFreeShipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referralCode" TEXT,
ADD COLUMN     "referredBy" TEXT;

-- AlterTable
ALTER TABLE "_CategoryToDeal" DROP CONSTRAINT "_CategoryToDeal_AB_pkey";

-- AlterTable
ALTER TABLE "_DealToProduct" DROP CONSTRAINT "_DealToProduct_AB_pkey";

-- AlterTable
ALTER TABLE "_PermissionToRole" DROP CONSTRAINT "_PermissionToRole_AB_pkey";

-- CreateTable
CREATE TABLE "ReferralBonus" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "bonusType" TEXT NOT NULL DEFAULT 'FREE_SHIPPING',
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "referralId" INTEGER,

    CONSTRAINT "ReferralBonus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" SERIAL NOT NULL,
    "referrerId" INTEGER NOT NULL,
    "refereeId" INTEGER NOT NULL,
    "refereeEmail" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Referral_referralCode_idx" ON "Referral"("referralCode");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_refereeId_key" ON "Referral"("referrerId", "refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "_CategoryToDeal_AB_unique" ON "_CategoryToDeal"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_DealToProduct_AB_unique" ON "_DealToProduct"("A", "B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole"("A", "B");

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralBonus" ADD CONSTRAINT "ReferralBonus_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
