import prisma from "../../prismaClient.js";
import { paginate } from "../../utils.js";
// import { sendNotification } from "../services/notificationService.js";

export async function getOrders(req, res) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;
      
      const where = {
        status: filters.status ? { in: filters.status.split(',') } : undefined,
        totalPrice: {
          gte: filters.minAmount ? Number(filters.minAmount) : undefined,
          lte: filters.maxAmount ? Number(filters.maxAmount) : undefined
        },
        user: {
          type: filters.customerType
        },
        createdAt: {
          gte: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
          lte: filters.dateTo ? new Date(filters.dateTo) : undefined
        }
      };
  
      const result = await paginate({
        model: prisma.order,
        page: Number(page),
        limit: Number(limit),
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              type: true,
              profile: { select: { fullName: true } },
              businessProfile: { select: { businessName: true } }
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc'
        }
      });
  
      res.status(200).json({

        message: "Orders fetched successfully",
        success: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

export async function getOrderDetails(req, res) {
  const OrderId = req.params.id
  try {


    const order = await prisma.order.findUnique({
      where: { id: Number(OrderId) },
      include: {
        user: {
          include: {
            profile: true,
            businessProfile: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                manufacturer:true
              }
            }
          }
        },
        timeline: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        shipping: true,
        transactions: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function cancelOrder(req, res) {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: Number(req.params.id) },
        data: { status: 'CANCELLED' }
      });

      await tx.orderTimeline.create({
        data: {
          orderId: updatedOrder.id,
          action: 'STATUS_UPDATE',
          status: 'CANCELLED',
          details: { reason: req.body.reason }
        }
      });

      return updatedOrder;
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function shipOrder(req, res) {
  try {
    const order = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: Number(req.params.id) },
        data: { status: 'SHIPPED' }
      });

      await tx.shipping.update({
        where: { orderId: updatedOrder.id },
        data: { 
          trackingNumber: req.body.trackingNumber, 
          carrier: req.body.carrier 
        }
      });

      await tx.orderTimeline.create({
        data: {
          orderId: updatedOrder.id,
          action: 'SHIPPED',
          status: 'SHIPPED',
          details: { 
            trackingNumber: req.body.trackingNumber,
            carrier: req.body.carrier
          }
        }
      });

      return updatedOrder;
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function processRefund(req, res) {
  try {
    // Implement your refund logic with payment provider here
    const result = {
      success: true,
      message: 'Refund processed successfully',
      amount: req.body.amount,
      orderId: Number(req.params.id)
    };

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}


export async function getOrderSummary(req, res) {
  try {

      const counts = await prisma.order.groupBy({
          by: ['status'],
          _count: {
                status: true
              }
    });
            
    
    
    const revenue = await prisma.order.aggregate({
      _sum: {
        totalPrice: true
      },
      where: {
        paymentStatus: 'PAID'
      }
    });
    
  

    const summary = counts.reduce((acc, { status, _count }) => {
      acc[status.toLowerCase()] = _count.status;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        totalRevenue: revenue._sum.totalPrice || 0
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

export async function getSalesData(req, res) {
  try {
    // Validate year parameter
    let year = req.query.year || new Date().getFullYear();
    year = parseInt(year);
    
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear() + 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year parameter'
      });
    }

    // Execute the raw query with error handling
    const monthlySales = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
        EXTRACT(MONTH FROM "createdAt") AS month_num,
        COALESCE(SUM("totalPrice"), 0) AS amount,
        COUNT(*)::integer AS orders
      FROM "Order"
      WHERE EXTRACT(YEAR FROM "createdAt") = ${year}
        AND "paymentStatus" = 'PAID'
      GROUP BY DATE_TRUNC('month', "createdAt"), month_num
      ORDER BY month_num
    `;

    // Ensure all months are represented (fill in missing months with 0 values)
    const allMonths = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(year, i, 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        month_num: i + 1,
        amount: 0,
        orders: 0
      };
    });

    const completeData = allMonths.map(month => {
      const found = monthlySales.find(s => s.month_num === month.month_num);
      return found || month;
    });

    res.status(200).json({
      success: true,
      data: completeData,
      year: year
    });
  } catch (error) {
    console.error('Error in getSalesData:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}