/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `VerificationCode` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "VerificationCode_userId_key" ON "VerificationCode"("userId");
