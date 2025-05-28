/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Manufacturer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Manufacturer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Manufacturer" ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "logo" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_email_key" ON "Manufacturer"("email");

-- CreateIndex
CREATE INDEX "Manufacturer_name_idx" ON "Manufacturer"("name");

-- CreateIndex
CREATE INDEX "Manufacturer_email_idx" ON "Manufacturer"("email");

-- CreateIndex
CREATE INDEX "Manufacturer_status_idx" ON "Manufacturer"("status");
