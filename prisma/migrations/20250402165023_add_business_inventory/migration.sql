-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'OVERSTOCKED', 'ON_ORDER', 'DISCONTINUED', 'BACKORDER');

-- CreateTable
CREATE TABLE "BusinessInventory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "productOptionId" INTEGER,
    "userId" INTEGER NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minStockLevel" INTEGER NOT NULL DEFAULT 10,
    "maxStockLevel" INTEGER,
    "reorderPoint" INTEGER NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'IN_STOCK',
    "lastStockUpdate" TIMESTAMP(3),
    "lastAudit" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessInventory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessInventory_status_idx" ON "BusinessInventory"("status");

-- CreateIndex
CREATE INDEX "BusinessInventory_currentStock_idx" ON "BusinessInventory"("currentStock");

-- CreateIndex
CREATE INDEX "BusinessInventory_userId_idx" ON "BusinessInventory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessInventory_productId_productOptionId_userId_key" ON "BusinessInventory"("productId", "productOptionId", "userId");

-- AddForeignKey
ALTER TABLE "BusinessInventory" ADD CONSTRAINT "BusinessInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInventory" ADD CONSTRAINT "BusinessInventory_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "ProductOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessInventory" ADD CONSTRAINT "BusinessInventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
