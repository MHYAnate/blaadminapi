-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT', 'BOGO');

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "inventory" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "markupType" "MarkupType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "markupValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stockPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Deal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DealType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToDeal" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_CategoryToDeal_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_DealToProduct" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_DealToProduct_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToDeal_B_index" ON "_CategoryToDeal"("B");

-- CreateIndex
CREATE INDEX "_DealToProduct_B_index" ON "_DealToProduct"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToDeal" ADD CONSTRAINT "_CategoryToDeal_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToDeal" ADD CONSTRAINT "_CategoryToDeal_B_fkey" FOREIGN KEY ("B") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DealToProduct" ADD CONSTRAINT "_DealToProduct_A_fkey" FOREIGN KEY ("A") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DealToProduct" ADD CONSTRAINT "_DealToProduct_B_fkey" FOREIGN KEY ("B") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
