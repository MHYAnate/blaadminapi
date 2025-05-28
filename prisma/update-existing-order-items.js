// update-existing-order-items.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateOrderItems() {
  try {
    console.log('Starting to update OrderItem records...');
    
    // const result = await prisma.$executeRaw`
    //   UPDATE "OrderItem" 
    //   SET "originalProductOptionId" = "productOptionId"
    //   WHERE "originalProductOptionId" IS NULL
    // `;

    const result = await prisma.$executeRaw`
      UPDATE "OrderItem" 
      SET "originalProductOptionId" = "productOptionId"
      WHERE "originalProductOptionId" IS NULL
    `;
    
    console.log(`Successfully updated ${result} records`);
  } catch (error) {
    console.error('Error updating OrderItems:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrderItems();