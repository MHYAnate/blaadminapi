/*
  Warnings:

  - Added the required column `fullName` to the `BusinessProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "fullName" TEXT NOT NULL;
