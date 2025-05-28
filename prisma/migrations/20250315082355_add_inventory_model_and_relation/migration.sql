-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'platform';

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "businessUserId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_businessUserId_source_key" ON "Inventory"("productId", "businessUserId", "source");

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_businessUserId_fkey" FOREIGN KEY ("businessUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
