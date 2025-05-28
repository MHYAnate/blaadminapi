const { PrismaClient } = require('@prisma/client');
const { paginate } = require('../utils/pagination');

const prisma = new PrismaClient();

class OrderService {
//   async getPaginatedOrders({ page, limit, filters }) {
//     const where = {
//       status: filters.status ? { in: filters.status.split(',')) } : undefined,
//       totalPrice: {
//         gte: filters.minAmount ? Number(filters.minAmount)) : undefined,
//         lte: filters.maxAmount ? Number(filters.maxAmount)) : undefined
//       },
//       user: {
//         type: filters.customerType
//       },
//       createdAt: {
//         gte: filters.dateFrom ? new Date(filters.dateFrom)) : undefined,
//         lte: filters.dateTo ? new Date(filters.dateTo)) : undefined
//       }
//     };

//     return await paginate({
//       model: prisma.order,
//       page,
//       limit,
//       where,
//       include: {
//         user: {
//           select: {
//             id: true,
//             email: true,
//             type: true,
//             profile: { select: { fullName: true } },
//             businessProfile: { select: { businessName: true } }
//           }
//         },
//         items: {
//           include: {
//             product: {
//               select: {
//                 name: true
//               }
//             }
//           }
//         }
//       },
//       orderBy: {
//         [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc'
//       }
//     });
//   }

//   async getOrderDetails(id) {
//     return await prisma.order.findUnique({
//       where: { id },
//       include: {
//         user: {
//           include: {
//             profile: true,
//             businessProfile: true
//           }
//         },
//         items: {
//           include: {
//             product: {
//               include: {
//                 category: true
//               }
//             }
//           }
//         },
//         timeline: {
//           orderBy: {
//             createdAt: 'desc'
//           }
//         },
//         shipping: true,
//         transactions: true
//       }
//     });
//   }

  async cancelOrder(id, reason) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: 'CANCELLED' }
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: 'STATUS_UPDATE',
          status: 'CANCELLED',
          details: { reason }
        }
      });

      return order;
    });
  }

  async shipOrder(id, trackingNumber, carrier) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({
        where: { id },
        data: { status: 'SHIPPED' }
      });

      await tx.shipping.update({
        where: { orderId: id },
        data: { trackingNumber, carrier }
      });

      await tx.orderTimeline.create({
        data: {
          orderId: id,
          action: 'SHIPPED',
          status: 'SHIPPED',
          details: { trackingNumber, carrier }
        }
      });

      return order;
    });
  }

  async processRefund(id, amount, reason) {
    // Implement refund logic with payment provider
    return { success: true, message: 'Refund processed' };
  }
}

module.exports = { OrderService };