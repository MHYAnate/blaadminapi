/*
  Warnings:

  - Added the required column `cacNumber` to the `BusinessProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "cacNumber" TEXT NOT NULL,
ADD COLUMN     "howDidYouHear" TEXT;
