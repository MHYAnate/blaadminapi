-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('PLATFORM', 'BUSINESS');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "businessProductId" INTEGER,
ADD COLUMN     "businessProductOptionId" INTEGER,
ADD COLUMN     "originalProductOptionId" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "businessOwnerId" INTEGER,
ADD COLUMN     "platformProductId" INTEGER;

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "platformProductOptionId" INTEGER;
