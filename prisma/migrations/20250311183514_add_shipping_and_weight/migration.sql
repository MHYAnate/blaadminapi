-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Shipping" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "totalWeight" DOUBLE PRECISION NOT NULL,
    "distanceFee" DOUBLE PRECISION NOT NULL,
    "weightFee" DOUBLE PRECISION NOT NULL,
    "totalShippingFee" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shipping_orderId_key" ON "Shipping"("orderId");

-- AddForeignKey
ALTER TABLE "Shipping" ADD CONSTRAINT "Shipping_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
