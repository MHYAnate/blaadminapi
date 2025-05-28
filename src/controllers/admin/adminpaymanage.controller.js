import paystack from "paystack";
import prisma from "../../prismaClient.js";

const paystackClient = paystack(process.env.PAYSTACK_SECRET_TEST_KEY);

// Admin Payment Monitoring Functions

/**
 * Get all transactions with filters
 */
// const getAllTransactions = async (req, res) => {
//   const { status, startDate, endDate, userId, orderId } = req.query;

//   try {
//     const transactions = await prisma.transaction.findMany({
//       where: {
//         ...(status && { status }),
//         ...(startDate && endDate && {
//           createdAt: {
//             gte: new Date(startDate),
//             lte: new Date(endDate)
//           }
//         }),
//         ...(userId && { order: { userId } }),
//         ...(orderId && { orderId })
//       },
//       include: {
//         order: {
//           include: {
//             user: {
//               select: {
//                 id: true,
//                 email: true,
//                 type: true,
//                 profile: { select: { fullName: true } },
//                 businessProfile: { select: { businessName: true } }
//               }
//             }
//           }
//         }
//       },
//       orderBy: { createdAt: 'desc' }
//     });

//     res.status(200).json({
//       success: true,
//       data: transactions.map(tx => ({
//         id: tx.id,
//         reference: tx.reference,
//         amount: tx.amount,
//         status: tx.status,
//         createdAt: tx.createdAt,
//         orderId: tx.orderId,
//         user: {
//           id: tx.order.user.id,
//           email: tx.order.user.email,
//           name: tx.order.user.type === 'individual' 
//             ? tx.order.user.profile?.fullName 
//             : tx.order.user.businessProfile?.businessName
//         }
//       }))
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch transactions",
//       error: error.message
//     });
//   }
// };

// const getAllTransactions = async (req, res) => {
//   try {
//     // Add BigInt serialization support
//     BigInt.prototype.toJSON = function () {
//       return this.toString();
//     };

//     // Helper function to safely convert values
//     const safeNumber = (value) => {
//       if (value === null || value === undefined) return 0;
//       if (typeof value === "bigint") return Number(value);
//       return Number(value) || 0;
//     };

//     // Date calculations for metrics
//     const currentDate = new Date();
//     const currentMonthStart = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth(),
//       1
//     );
//     const nextMonthStart = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth() + 1,
//       1
//     );
//     const previousMonthStart = new Date(
//       currentDate.getFullYear(),
//       currentDate.getMonth() - 1,
//       1
//     );

//     // Query parameters
//     const { status, startDate, endDate, userId, orderId } = req.query;

//     // Base where clause for list
//     const listWhere = {
//       ...(status && { status }),
//       ...(startDate && endDate && {
//         createdAt: { gte: new Date(startDate), lte: new Date(endDate) }
//       }),
//       ...(userId && { order: { userId } }),
//       ...(orderId && { orderId })
//     };

//     // Parallel queries
//     const [
//       transactions,
//       currentMonthResult,
//       previousMonthResult,
//       totalResult,
//       statusSummary,
//       sixMonthsTrend
//     ] = await Promise.all([
//       prisma.transaction.findMany({
//         where: listWhere,
//         include: {
//           order: {
//             include: {
//               user: {
//                 select: {
//                   id: true,
//                   email: true,
//                   type: true,
//                   profile: { select: { fullName: true } },
//                   businessProfile: { select: { businessName: true } }
//                 }
//               }
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       }),
//       prisma.transaction.aggregate({
//         _count: { id: true },
//         _sum: { amount: true },
//         where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } }
//       }),
//       prisma.transaction.aggregate({
//         _count: { id: true },
//         _sum: { amount: true },
//         where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } }
//       }),
//       prisma.transaction.aggregate({
//         _count: { id: true },
//         _sum: { amount: true }
//       }),
//       prisma.transaction.groupBy({
//         by: ['status'],
//         _count: { id: true },
//         _sum: { amount: true }
//       }),
//       prisma.$queryRaw`
//         SELECT
//           TO_CHAR("createdAt", 'YYYY-MM') AS month,
//           COUNT(*) AS transaction_count,
//           SUM(amount) AS total_amount
//         FROM "Transaction"
//         WHERE "createdAt" >= ${new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)}
//         GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
//         ORDER BY month ASC
//       `
//     ]);

//     // Calculate metrics
//     const calculatePercentageChange = (current, previous) =>
//       previous === 0 ? 0 : ((current - previous) / previous) * 100;

//     const currentCount = safeNumber(currentMonthResult._count.id);
//     const currentAmount = safeNumber(currentMonthResult._sum.amount);
//     const previousCount = safeNumber(previousMonthResult._count.id);
//     const previousAmount = safeNumber(previousMonthResult._sum.amount);

//     const metrics = {
//       total: {
//         transactions: safeNumber(totalResult._count.id),
//         amount: safeNumber(totalResult._sum.amount)
//       },
//       currentMonth: {
//         transactions: currentCount,
//         amount: currentAmount,
//         transactionChange: calculatePercentageChange(currentCount, previousCount),
//         amountChange: calculatePercentageChange(currentAmount, previousAmount),
//         trend: currentCount >= previousCount ? 'up' : 'down'
//       }
//     };

//     // Process status summary
//     const statusDistribution = statusSummary.map(item => ({
//       status: item.status,
//       count: safeNumber(item._count.id),
//       amount: safeNumber(item._sum.amount)
//     }));

//     // Process trend data
//     const paymentTrends = sixMonthsTrend.map(item => ({
//       month: item.month,
//       transactionCount: safeNumber(item.transaction_count),
//       totalAmount: safeNumber(item.total_amount)
//     }));

//     // Process transaction list
//     const processedTransactions = transactions.map(tx => ({
//       id: tx.id,
//       reference: tx.reference,
//       amount: safeNumber(tx.amount),
//       status: tx.status,
//       createdAt: tx.createdAt,
//       orderId: tx.orderId,
//       user: {
//         id: tx.order.user.id,
//         email: tx.order.user.email,
//         name: tx.order.user.type === 'individual'
//           ? tx.order.user.profile?.fullName
//           : tx.order.user.businessProfile?.businessName
//       }
//     }));

//     // Final response
//     const response = {
//       success: true,
//       metrics,
//       charts: {
//         statusDistribution,
//         paymentTrends
//       },
//       transactions: processedTransactions,
//       period: {
//         current: currentMonthStart.toISOString(),
//         comparison: previousMonthStart.toISOString(),
//         range: "monthly"
//       },
//       lastUpdated: new Date().toISOString()
//     };

//     return res.status(200).json(response);
//   } catch (error) {
//     console.error("Error fetching transactions:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch transactions",
//       ...(process.env.NODE_ENV === "development" && {
//         details: {
//           message: error.message,
//           stack: error.stack
//         }
//       })
//     });
//   }
// };

// export { getAllTransactions };



/**
 * Get single transaction details
 */
// const getTransactionDetails = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const transaction = await prisma.transaction.findUnique({
//       where: { id },
//       include: {
//         order: {
//           include: {
//             user: true,
//             items: true,
//             timelines: {
//               where: { action: { in: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED'] } },
//               orderBy: { createdAt: 'desc' },
//               take: 5
//             }
//           }
//         }
//       }
//     });

//     if (!transaction) {
//       return res.status(404).json({ success: false, message: "Transaction not found" });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         ...transaction,
//         order: {
//           id: transaction.order.id,
//           status: transaction.order.status,
//           user: {
//             id: transaction.order.user.id,
//             email: transaction.order.user.email,
//             name: transaction.order.user.type === 'individual' 
//               ? transaction.order.user.profile?.fullName 
//               : transaction.order.user.businessProfile?.businessName
//           },
//           items: transaction.order.items,
//           timelines: transaction.order.timelines
//         }
//       }
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch transaction details",
//       error: error.message
//     });
//   }
// };

export const getAllTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                type: true,
                profile: { select: { fullName: true } },
                businessProfile: { select: { businessName: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: transactions.map(tx => ({
        id: tx.id,
        reference: tx.reference,
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt,
        orderId: tx.orderId,
        user: {
          id: tx.order.user.id,
          email: tx.order.user.email,
          name: tx.order.user.type === 'individual'
            ? tx.order.user.profile?.fullName
            : tx.order.user.businessProfile?.businessName
        }
      }))
    });
  } catch (error) {
    console.error("Failed to fetch all transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message
    });
  }
};


export const getFinancialReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerType,
      minAOV,
      maxAOV,
      page = 1, // Default to page 1
      pageSize = 10, // Default to 10 items per page
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    // Build 'where' clause for filtering orders
    const where = {
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(customerType ? { user: { type: customerType.toUpperCase() } } : {}), // Ensure consistent casing with Prisma enum
    };

    // Fetch grouped reports
    const reports = await prisma.order.groupBy({
      by: ['userId'],
      where,
      _sum: { totalPrice: true },
      _count: { id: true },
      orderBy: {
        _sum: { totalPrice: 'desc' }, // Order by total sales by default
      },
      skip,
      take,
    });

    // Calculate total count for pagination meta
    const totalReportsCount = await prisma.order.groupBy({
      by: ['userId'],
      where,
    });

    // Calculate AOV and filter based on minAOV and maxAOV
    let filteredReports = reports
      .map((report) => {
        const totalSales = safeNumber(report._sum.totalPrice);
        const orderCount = report._count.id;
        const aov = orderCount > 0 ? totalSales / orderCount : 0;
        return { ...report, totalSales, orderCount, aov };
      })
      .filter((report) => {
        if (minAOV && report.aov < parseFloat(minAOV)) return false;
        if (maxAOV && report.aov > parseFloat(maxAOV)) return false;
        return true;
      });

    // Fetch customer data for all filtered reports
    const reportsWithCustomerData = await Promise.all(
      filteredReports.map(async (report) => {
        const user = await prisma.user.findUnique({
          where: { id: report.userId },
          select: {
            email: true,
            type: true,
            profile: { select: { fullName: true } },
            businessProfile: { select: { businessName: true } },
          },
        });

        return {
          customerId: report.userId,
          name:
            user?.type === 'INDIVIDUAL' // Use uppercase for enum comparison
              ? user?.profile?.fullName
              : user?.businessProfile?.businessName,
          email: user?.email,
          type: user?.type,
          totalSales: report.totalSales,
          orderCount: report.orderCount,
          aov: report.aov,
        };
      })
    );

    // Calculate overall meta data based on the full filteredReports array (not just the paginated subset)
    const overallTotalSales = totalReportsCount.reduce(
      (sum, r) => sum + safeNumber(r._sum?.totalPrice),
      0
    );
    const overallAverageAOV =
      totalReportsCount.length > 0
        ? totalReportsCount.reduce((sum, r) => {
            const ts = safeNumber(r._sum?.totalPrice);
            const oc = r._count?.id || 0;
            return sum + (oc > 0 ? ts / oc : 0);
          }, 0) / totalReportsCount.length
        : 0;

    const totalPages = Math.ceil(totalReportsCount.length / take);

    return res.status(200).json({
      success: true,
      data: reportsWithCustomerData,
      meta: {
        totalCustomers: totalReportsCount.length,
        totalSales: overallTotalSales,
        averageAOV: overallAverageAOV,
        pagination: {
          currentPage: parseInt(page),
          pageSize: parseInt(pageSize),
          totalItems: totalReportsCount.length,
          totalPages: totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch financial reports',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
      }),
    });
  }
};

const getTransactionDetails = async (req, res) => {
  try {
    // Add BigInt serialization support
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };

    // Helper function to safely convert values
    const safeNumber = (value) => {
      if (value === null || value === undefined) return 0;
      if (typeof value === "bigint") return Number(value);
      return Number(value) || 0;
    };

    const { id } = req.params;

    // Parallel queries for main data and related information
    const [transaction, relatedTransactions] = await Promise.all([
      prisma.transaction.findUnique({
        where: { id },
        include: {
          order: {
            include: {
              user: {
                include: {
                  profile: { select: { fullName: true } },
                  businessProfile: { select: { businessName: true } },
                }
              },
              items: true,
              timelines: {
                where: { action: { in: ['PAYMENT_RECEIVED', 'PAYMENT_FAILED'] } },
                orderBy: { createdAt: 'desc' },
                take: 5
              },
              shipping: true
            }
          }
        }
      }),
      prisma.transaction.findMany({
        where: { order: { userId: { not: null } } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          order: { select: { user: { select: { email: true } } }
        }
      }
      })
    ]);

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: "Transaction not found",
        ...(process.env.NODE_ENV === "development" && {
          details: { requestedId: id }
        })
      });
    }

    // Process transaction data
    const processedTransaction = {
      ...transaction,
      amount: safeNumber(transaction.amount),
      order: {
        ...transaction.order,
        totalPrice: safeNumber(transaction.order.totalPrice),
        amountPaid: safeNumber(transaction.order.amountPaid),
        amountDue: safeNumber(transaction.order.amountDue),
        user: {
          id: transaction.order.user.id,
          email: transaction.order.user.email,
          type: transaction.order.user.type,
          name: transaction.order.user.type === 'individual'
            ? transaction.order.user.profile?.fullName
            : transaction.order.user.businessProfile?.businessName,
          status: transaction.order.user.status || 'inactive'
        },
        items: transaction.order.items.map(item => ({
          ...item,
          price: safeNumber(item.price),
          quantity: safeNumber(item.quantity)
        })),
        shipping: transaction.order.shipping ? {
          ...transaction.order.shipping,
          distance: safeNumber(transaction.order.shipping.distance),
          totalWeight: safeNumber(transaction.order.shipping.totalWeight),
          distanceFee: safeNumber(transaction.order.shipping.distanceFee),
          weightFee: safeNumber(transaction.order.shipping.weightFee),
          totalShippingFee: safeNumber(transaction.order.shipping.totalShippingFee)
        } : null,
        timelines: transaction.order.timelines.map(timeline => ({
          ...timeline,
          details: timeline.details ? JSON.parse(timeline.details) : null
        }))
      }
    };

    // Process related transactions
    const processedRelated = relatedTransactions.map(tx => ({
      id: tx.id,
      amount: safeNumber(tx.amount),
      status: tx.status,
      createdAt: tx.createdAt,
      userEmail: tx.order?.user?.email
    }));

    // Final response
    const response = {
      success: true,
      data: processedTransaction,
      related: {
        recentTransactions: processedRelated
      },
      meta: {
        currency: "NGN",
        lastUpdated: new Date().toISOString()
      }
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch transaction details",
      ...(process.env.NODE_ENV === "development" && {
        details: {
          message: error.message,
          stack: error.stack
        }
      })
    });
  }
};

export { getTransactionDetails };

/**
 * Retry failed payment (Admin-assisted payment retry)
 */
const retryFailedPayment = async (req, res) => {
  const { transactionId } = req.params;
  const { adminNotes } = req.body;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { order: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status !== 'failed') {
      return res.status(400).json({ 
        success: false, 
        message: "Can only retry failed transactions" 
      });
    }

    // Create new transaction record
    const newReference = `retry_${transaction.reference}_${Date.now()}`;
    const amountInKobo = Math.round(transaction.amount * 100);

    const paystackResponse = await paystackClient.transaction.initialize({
      email: transaction.order.user.email,
      amount: amountInKobo,
      reference: newReference,
      metadata: {
        originalTransactionId: transaction.id,
        adminRetry: true,
        adminNotes
      }
    });

    const newTransaction = await prisma.transaction.create({
      data: {
        orderId: transaction.orderId,
        amount: transaction.amount,
        reference: newReference,
        status: "pending",
        adminNotes,
        previousTransactionId: transaction.id
      }
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: transaction.orderId,
        action: "ADMIN_PAYMENT_RETRY",
        status: "PENDING",
        details: {
          adminId: req.user.id,
          originalTransaction: transaction.reference,
          newTransaction: newReference,
          notes: adminNotes
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Payment retry initiated",
      data: {
        newTransactionId: newTransaction.id,
        authorizationUrl: paystackResponse.data.authorization_url
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retry payment",
      error: error.message
    });
  }
};

/**
 * Process refund for a transaction
 */
const processRefund = async (req, res) => {
  const { transactionId } = req.params;
  const { reason } = req.body;

  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { order: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: "Can only refund successful transactions"
      });
    }

    // Process refund with Paystack
    const refundResponse = await paystackClient.refund.create({
      transaction: transaction.reference,
      reason
    });

    // Update transaction status
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { 
        status: "refunded",
        refundData: {
          reference: refundResponse.data.reference,
          amount: refundResponse.data.amount / 100,
          reason,
          processedBy: req.user.id,
          processedAt: new Date()
        }
      }
    });

    // Update order status
    await prisma.order.update({
      where: { id: transaction.orderId },
      data: { 
        paymentStatus: "REFUNDED",
        amountDue: transaction.amount,
        amountPaid: 0
      }
    });

    // Add timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: transaction.orderId,
        action: "PAYMENT_REFUND",
        status: "REFUNDED",
        details: {
          adminId: req.user.id,
          transactionReference: transaction.reference,
          refundReference: refundResponse.data.reference,
          amount: refundResponse.data.amount / 100,
          reason
        }
      }
    });

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      data: updatedTransaction
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Refund processing failed",
      error: error.message
    });
  }
};

export { 
  retryFailedPayment,
  processRefund
};