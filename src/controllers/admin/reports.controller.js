// import { DateTime } from "luxon";
// import prisma from "../../prismaClient.js";

// // Helper to safely convert BigInt
// BigInt.prototype.toJSON = function() { return this.toString(); };

// const safeNumber = (value) => {
//   if (value === null || value === undefined) return 0;
//   if (typeof value === 'bigint') return Number(value);
//   return Number(value) || 0;
// };

// // Month names mapping
// const monthNames = {
//     '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', 
//     '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
//     '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
//   };

// const getDashboardReports = async (req, res) => {
//   try {
//     const now = DateTime.now();
//     const todayStart = now.startOf('day').toJSDate();
//     const yesterdayStart = now.minus({ days: 1 }).startOf('day').toJSDate();
//     const lastWeekStart = now.minus({ weeks: 1 }).startOf('day').toJSDate();
//     const sixMonthsAgo = now.minus({ months: 6 }).startOf('month');

//     // Generate complete month range for the last 6 months
//     const allMonths = Array.from({ length: 6 }, (_, i) => {
//         const monthDate = sixMonthsAgo.plus({ months: i });
//         return {
//           yearMonth: monthDate.toFormat('yyyy-MM'),
//           monthName: monthNames[monthDate.toFormat('MM')],
//           year: monthDate.toFormat('yyyy')
//         };
//       });

//     // Days of week for complete weekly data
//     const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

//     // Execute all queries in parallel
//     const [
//       totalRevenue,
//       yesterdayRevenue,
//       totalOrders,
//       yesterdayOrders,
//       weeklyOrderDataRaw
//     ] = await Promise.all([
//       prisma.order.aggregate({
//         _sum: { totalPrice: true },
//         where: { createdAt: { gte: todayStart } }
//       }),
//       prisma.order.aggregate({
//         _sum: { totalPrice: true },
//         where: { 
//           createdAt: { 
//             gte: yesterdayStart,
//             lt: todayStart
//           } 
//         }
//       }),
//       prisma.order.count({
//         where: { createdAt: { gte: todayStart } }
//       }),
//       prisma.order.count({
//         where: { 
//           createdAt: { 
//             gte: yesterdayStart,
//             lt: todayStart
//           } 
//         }
//       }),

//       prisma.$queryRaw`
//         SELECT
//           TO_CHAR("createdAt", 'Dy') AS day,
//           COUNT(*) AS order_count
//         FROM "Order"
//         WHERE "createdAt" >= ${lastWeekStart}
//         GROUP BY TO_CHAR("createdAt", 'Dy'), TO_CHAR("createdAt", 'D')
//         ORDER BY TO_CHAR("createdAt", 'D') ASC
//       `
//     ]);

//     // Calculate profits (25% margin)
//     const totalProfit = safeNumber(totalRevenue._sum.totalPrice) * 0.25;
//     const yesterdayProfit = safeNumber(yesterdayRevenue._sum.totalPrice) * 0.25;

//     // Create complete monthly data with all months
//     // Get raw revenue data
//     const monthlyRevenueDataRaw = await prisma.$queryRaw`
//       SELECT 
//         TO_CHAR("createdAt", 'YYYY-MM') AS year_month,
//         SUM("totalPrice") AS revenue
//       FROM "Order"
//       WHERE "createdAt" >= ${sixMonthsAgo.toJSDate()}
//       GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
//       ORDER BY year_month ASC
//     `;

//     // Create complete monthly data with all months (including zeros)
//     const monthlyRevenueData = allMonths.map(month => {
//         const foundMonth = monthlyRevenueDataRaw.find(m => m.year_month === month.yearMonth);
//         return {
//           month: `${month.monthName} ${month.year}`,
//           shortMonth: month.monthName,
//           year: month.year,
//           value: foundMonth ? safeNumber(foundMonth.revenue) : 0
//         };
//     });

//     // Process weekly data to ensure all days are present
//     const weeklyOrderData = daysOfWeek.map(day => {
//       const foundDay = weeklyOrderDataRaw.find(d => d.day === day);
//       return {
//         day,
//         value: foundDay ? safeNumber(foundDay.order_count) : 0
//       };
//     });

//     // Calculate percentage changes
//     const calculateChange = (current, previous) => {
//       if (previous === 0) return current === 0 ? 0 : 100;
//       return ((current - previous) / previous) * 100;
//     };

//     // Prepare response
//     const response = {
//       success: true,
//       metrics: {
//         revenue: {
//           value: safeNumber(totalRevenue._sum.totalPrice),
//           dailyChange: calculateChange(
//             safeNumber(totalRevenue._sum.totalPrice),
//             safeNumber(yesterdayRevenue._sum.totalPrice)
//           ),
//           trend: safeNumber(totalRevenue._sum.totalPrice) >= safeNumber(yesterdayRevenue._sum.totalPrice) 
//             ? 'up' : 'down'
//         },
//         sales: {
//           value: totalOrders,
//           dailyChange: calculateChange(totalOrders, yesterdayOrders),
//           trend: totalOrders >= yesterdayOrders ? 'up' : 'down'
//         },
//         profit: {
//           value: totalProfit,
//           dailyChange: calculateChange(totalProfit, yesterdayProfit),
//           trend: totalProfit >= yesterdayProfit ? 'up' : 'down'
//         }
//       },
//       charts: {
//         revenueTrend: monthlyRevenueData,
//         orderTrend: weeklyOrderData
//       },
//       lastUpdated: now.toISO()
//     };

//     return res.status(200).json(response);

//   } catch (error) {
//     console.error("Error fetching dashboard reports:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch dashboard reports",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.message
//       })
//     });
//   }
// };




// const getFinancialReports = async (req, res) => {
//   try {
//     const { 
//       startDate, 
//       endDate, 
//       customerType, 
//       minAOV, 
//       maxAOV,
//       page = 1,
//       pageSize = 10
//     } = req.query;

//     // Convert pagination params to numbers
//     const pageNum = parseInt(page);
//     const pageSizeNum = Math.min(parseInt(pageSize), 100); // Limit page size to 100
//     const skip = (pageNum - 1) * pageSizeNum;

//     // Build where clause
//     const where = {
//       createdAt: {
//         gte: startDate ? new Date(startDate) : undefined,
//         lte: endDate ? new Date(endDate) : undefined
//       },
//       user: customerType ? { type: customerType } : undefined
//     };

//     // First get the grouped reports (without customer data)
//     const reports = await prisma.order.groupBy({
//       by: ['userId'],
//       where,
//       _sum: { totalPrice: true },
//       _count: { id: true },
//       orderBy: { _sum: { totalPrice: 'desc' } },
//       skip,
//       take: pageSizeNum
//     });

//     // Calculate AOV for each report and filter if AOV params exist
//     const reportsWithAOV = reports.map(report => ({
//       ...report,
//       aov: report._count.id > 0 
//         ? safeNumber(report._sum.totalPrice) / report._count.id 
//         : 0
//     })).filter(report => {
//       if (minAOV && report.aov < parseFloat(minAOV)) return false;
//       if (maxAOV && report.aov > parseFloat(maxAOV)) return false;
//       return true;
//     });

//     // Get total count for pagination (before AOV filtering)
//     const totalCount = await prisma.order.groupBy({
//       by: ['userId'],
//       where,
//       _count: { _all: true }
//     }).then(results => results.length);

//     // Fetch customer data for the filtered reports
//     const reportsWithCustomerData = await Promise.all(
//       reportsWithAOV.map(async report => {
//         const user = await prisma.user.findUnique({
//           where: { id: report.userId },
//           select: {
//             email: true,
//             type: true,
//             profile: { select: { fullName: true } },
//             businessProfile: { select: { businessName: true } }
//           }
//         });

//         return {
//           customerId: report.userId,
//           name: user?.type === 'individual' 
//             ? user?.profile?.fullName 
//             : user?.businessProfile?.businessName,
//           email: user?.email,
//           type: user?.type,
//           totalSales: safeNumber(report._sum.totalPrice),
//           orderCount: report._count.id,
//           aov: report.aov
//         };
//       })
//     );

//     // Calculate meta data
//     const totalSales = reportsWithCustomerData.reduce((sum, r) => sum + r.totalSales, 0);
//     const averageAOV = reportsWithCustomerData.length > 0
//       ? reportsWithCustomerData.reduce((sum, r) => sum + r.aov, 0) / reportsWithCustomerData.length
//       : 0;

//     return res.status(200).json({
//       success: true,
//       data: reportsWithCustomerData,
//       meta: {
//         totalCustomers: totalCount,
//         totalSales,
//         averageAOV,
//         pagination: {
//           currentPage: pageNum,
//           pageSize: pageSizeNum,
//           totalPages: Math.ceil(totalCount / pageSizeNum),
//           hasNextPage: (pageNum * pageSizeNum) < totalCount,
//           hasPreviousPage: pageNum > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error("Error fetching financial reports:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch financial reports",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.message
//       })
//     });
//   }
// };

// const getFinancialReport = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     const report = await prisma.order.groupBy({
//       by: ['userId'],
//       where: { userId: customerId },
//       _sum: { totalPrice: true },
//       _count: { id: true }
//     });

//     if (!report.length) {
//       return res.status(404).json({
//         success: false,
//         error: "No financial data found for this customer"
//       });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: customerId },
//       select: {
//         email: true,
//         type: true,
//         profile: { select: { fullName: true } },
//         businessProfile: { select: { businessName: true } }
//       }
//     });

//     const response = {
//       customerId,
//       name: user?.type === 'individual' 
//         ? user?.profile?.fullName 
//         : user?.businessProfile?.businessName,
//       email: user?.email,
//       type: user?.type,
//       totalSales: safeNumber(report[0]._sum.totalPrice),
//       orderCount: report[0]._count.id,
//       aov: report[0]._count.id > 0 
//         ? safeNumber(report[0]._sum.totalPrice) / report[0]._count.id 
//         : 0,
//       orders: await prisma.order.findMany({
//         where: { userId: customerId },
//         select: {
//           id: true,
//           totalPrice: true,
//           status: true,
//           createdAt: true,
//           items: {
//             select: {
//               product: { select: { name: true } },
//               quantity: true,
//               unitPrice: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       })
//     };

//     return res.status(200).json({
//       success: true,
//       data: response
//     });

//   } catch (error) {
//     console.error("Error fetching financial report:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch financial report",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.message
//       })
//     });
//   }
// };

//  const deleteFinancialData = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     // Verify customer exists
//     const customer = await prisma.user.findUnique({
//       where: { id: customerId }
//     });

//     if (!customer) {
//       return res.status(404).json({
//         success: false,
//         error: "Customer not found"
//       });
//     }

//     // Delete all orders for this customer
//     await prisma.order.deleteMany({
//       where: { userId: customerId }
//     });

//     return res.status(200).json({
//       success: true,
//       message: `All financial data for customer ${customerId} has been deleted`,
//       deletedCustomer: {
//         id: customerId,
//         email: customer.email
//       }
//     });

//   } catch (error) {
//     console.error("Error deleting financial data:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to delete financial data",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.message
//       })
//     });
//   }
// };

// export { 
//   getDashboardReports,
//   getFinancialReports,
//   getFinancialReport 
//  };


import { DateTime } from "luxon";
import prisma from "../../prismaClient.js";

// Helper to safely convert BigInt
BigInt.prototype.toJSON = function() { return this.toString(); };

const safeNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'bigint') return Number(value);
  return Number(value) || 0;
};

// Month names mapping
const monthNames = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', 
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

const getDashboardReports = async (req, res) => {
  try {
    const now = DateTime.now();
    const todayStart = now.startOf('day').toJSDate();
    const yesterdayStart = now.minus({ days: 1 }).startOf('day').toJSDate();
    const lastWeekStart = now.minus({ weeks: 1 }).startOf('day').toJSDate();
    const sixMonthsAgo = now.minus({ months: 6 }).startOf('month');

    // Generate complete month range for the last 6 months
    const allMonths = Array.from({ length: 6 }, (_, i) => {
        const monthDate = sixMonthsAgo.plus({ months: i });
        return {
          yearMonth: monthDate.toFormat('yyyy-MM'),
          monthName: monthNames[monthDate.toFormat('MM')],
          year: monthDate.toFormat('yyyy')
        };
      });

    // Days of week for complete weekly data
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Execute all queries in parallel
    const [
      totalRevenue,
      yesterdayRevenue,
      totalOrders,
      yesterdayOrders,
      weeklyOrderDataRaw
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { 
          createdAt: { 
            gte: yesterdayStart,
            lt: todayStart
          } 
        }
      }),
      prisma.order.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.order.count({
        where: { 
          createdAt: { 
            gte: yesterdayStart,
            lt: todayStart
          } 
        }
      }),

      prisma.$queryRaw`
        SELECT
          TO_CHAR("createdAt", 'Dy') AS day,
          COUNT(*) AS order_count
        FROM "Order"
        WHERE "createdAt" >= ${lastWeekStart}
        GROUP BY TO_CHAR("createdAt", 'Dy'), TO_CHAR("createdAt", 'D')
        ORDER BY TO_CHAR("createdAt", 'D') ASC
      `
    ]);

    // Calculate profits (25% margin)
    const totalProfit = safeNumber(totalRevenue._sum.totalPrice) * 0.25;
    const yesterdayProfit = safeNumber(yesterdayRevenue._sum.totalPrice) * 0.25;

    // Create complete monthly data with all months
    // Get raw revenue data
    const monthlyRevenueDataRaw = await prisma.$queryRaw`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') AS year_month,
        SUM("totalPrice") AS revenue
      FROM "Order"
      WHERE "createdAt" >= ${sixMonthsAgo.toJSDate()}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY year_month ASC
    `;

    // Create complete monthly data with all months (including zeros)
    const monthlyRevenueData = allMonths.map(month => {
        const foundMonth = monthlyRevenueDataRaw.find(m => m.year_month === month.yearMonth);
        return {
          month: `${month.monthName} ${month.year}`,
          shortMonth: month.monthName,
          year: month.year,
          value: foundMonth ? safeNumber(foundMonth.revenue) : 0
        };
    });

    // Process weekly data to ensure all days are present
    const weeklyOrderData = daysOfWeek.map(day => {
      const foundDay = weeklyOrderDataRaw.find(d => d.day === day);
      return {
        day,
        value: foundDay ? safeNumber(foundDay.order_count) : 0
      };
    });

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current === 0 ? 0 : 100;
      return ((current - previous) / previous) * 100;
    };

    // Prepare response
    const response = {
      success: true,
      metrics: {
        revenue: {
          value: safeNumber(totalRevenue._sum.totalPrice),
          dailyChange: calculateChange(
            safeNumber(totalRevenue._sum.totalPrice),
            safeNumber(yesterdayRevenue._sum.totalPrice)
          ),
          trend: safeNumber(totalRevenue._sum.totalPrice) >= safeNumber(yesterdayRevenue._sum.totalPrice) 
            ? 'up' : 'down'
        },
        sales: {
          value: totalOrders,
          dailyChange: calculateChange(totalOrders, yesterdayOrders),
          trend: totalOrders >= yesterdayOrders ? 'up' : 'down'
        },
        profit: {
          value: totalProfit,
          dailyChange: calculateChange(totalProfit, yesterdayProfit),
          trend: totalProfit >= yesterdayProfit ? 'up' : 'down'
        }
      },
      charts: {
        revenueTrend: monthlyRevenueData,
        orderTrend: weeklyOrderData
      },
      lastUpdated: now.toISO()
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error("Error fetching dashboard reports:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard reports",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};





// const getFinancialReports = async (req, res) => {
//   // try {
//   //   const { 
//   //     startDate, 
//   //     endDate, 
//   //     customerType, 
//   //     minAOV, 
//   //     maxAOV,
//   //     page = 1,
//   //     pageSize = 10
//   //   } = req.query;

//   //   // Convert pagination params to numbers
//   //   const pageNum = parseInt(page);
//   //   const pageSizeNum = Math.min(parseInt(pageSize), 100); // Limit page size to 100
//   //   const skip = (pageNum - 1) * pageSizeNum;

//   //   // Build where clause
//   //   const where = {
//   //     createdAt: {
//   //       gte: startDate ? new Date(startDate) : undefined,
//   //       lte: endDate ? new Date(endDate) : undefined
//   //     },
//   //     user: customerType ? { type: customerType } : undefined
//   //   };

//   //   // First get the grouped reports (without customer data)
//   //   const reports = await prisma.order.groupBy({
//   //     by: ['userId'],
//   //     where,
//   //     _sum: { totalPrice: true },
//   //     _count: { id: true },
//   //     orderBy: { _sum: { totalPrice: 'desc' } },
//   //     skip,
//   //     take: pageSizeNum
//   //   });

//   //   // Calculate AOV for each report and filter if AOV params exist
//   //   const reportsWithAOV = reports.map(report => ({
//   //     ...report,
//   //     aov: report._count.id > 0 
//   //       ? safeNumber(report._sum.totalPrice) / report._count.id 
//   //       : 0
//   //   })).filter(report => {
//   //     if (minAOV && report.aov < parseFloat(minAOV)) return false;
//   //     if (maxAOV && report.aov > parseFloat(maxAOV)) return false;
//   //     return true;
//   //   });

//   //   // Get total count for pagination (before AOV filtering)
//   //   const totalCount = await prisma.order.groupBy({
//   //     by: ['userId'],
//   //     where,
//   //     _count: { _all: true }
//   //   }).then(results => results.length);

//   //   // Fetch customer data for the filtered reports
//   //   const reportsWithCustomerData = await Promise.all(
//   //     reportsWithAOV.map(async report => {
//   //       const user = await prisma.user.findUnique({
//   //         where: { id: report.userId },
//   //         select: {
//   //           email: true,
//   //           type: true,
//   //           profile: { select: { fullName: true } },
//   //           businessProfile: { select: { businessName: true } }
//   //         }
//   //       });

//   //       return {
//   //         customerId: report.userId,
//   //         name: user?.type === 'individual' 
//   //           ? user?.profile?.fullName 
//   //           : user?.businessProfile?.businessName,
//   //         email: user?.email,
//   //         type: user?.type,
//   //         totalSales: safeNumber(report._sum.totalPrice),
//   //         orderCount: report._count.id,
//   //         aov: report.aov
//   //       };
//   //     })
//   //   );

//   //   // Calculate meta data
//   //   const totalSales = reportsWithCustomerData.reduce((sum, r) => sum + r.totalSales, 0);
//   //   const averageAOV = reportsWithCustomerData.length > 0
//   //     ? reportsWithCustomerData.reduce((sum, r) => sum + r.aov, 0) / reportsWithCustomerData.length
//   //     : 0;

//   //   return res.status(200).json({
//   //     success: true,
//   //     data: reportsWithCustomerData,
//   //     meta: {
//   //       totalCustomers: totalCount,
//   //       totalSales,
//   //       averageAOV,
//   //       pagination: {
//   //         currentPage: pageNum,
//   //         pageSize: pageSizeNum,
//   //         totalPages: Math.ceil(totalCount / pageSizeNum),
//   //         hasNextPage: (pageNum * pageSizeNum) < totalCount,
//   //         hasPreviousPage: pageNum > 1
//   //       }
//   //     }
//   //   });

//   // } catch (error) {
//   //   console.error("Error fetching financial reports:", error);
//   //   return res.status(500).json({
//   //     success: false,
//   //     error: "Failed to fetch financial reports",
//   //     ...(process.env.NODE_ENV === 'development' && {
//   //       details: error.message
//   //     })
//   //   });
//   // }

//   // try {
//   //   const {
//   //     startDate,
//   //     endDate,
//   //     customerType,
//   //     minAOV,
//   //     maxAOV,
//   //     page = 1,
//   //     pageSize = 10,
//   //   } = req.query;

//   //   const pageNum = parseInt(page, 10);
//   //   const pageSizeNum = Math.min(parseInt(pageSize, 10), 100);
//   //   const skip = (pageNum - 1) * pageSizeNum;

//   //   // Build 'where' clause for filtering orders
//   //   const where = {
//   //     ...(startDate || endDate
//   //       ? {
//   //           createdAt: {
//   //             ...(startDate ? { gte: new Date(startDate) } : {}),
//   //             ...(endDate ? { lte: new Date(endDate) } : {}),
//   //           },
//   //         }
//   //       : {}),
//   //     ...(customerType ? { user: { type: customerType } } : {}),
//   //   };

//   //   // Fetch grouped reports with AOV calculation
//   //   const reports = await prisma.order.groupBy({
//   //     by: ['userId'],
//   //     where,
//   //     _sum: { totalPrice: true },
//   //     _count: { id: true },
//   //   });

//   //   // Calculate AOV and filter based on minAOV and maxAOV
//   //   const filteredReports = reports
//   //     .map((report) => {
//   //       const totalSales = safeNumber(report._sum.totalPrice);
//   //       const orderCount = report._count.id;
//   //       const aov = orderCount > 0 ? totalSales / orderCount : 0;
//   //       return { ...report, totalSales, orderCount, aov };
//   //     })
//   //     .filter((report) => {
//   //       if (minAOV && report.aov < parseFloat(minAOV)) return false;
//   //       if (maxAOV && report.aov > parseFloat(maxAOV)) return false;
//   //       return true;
//   //     });

//   //   const totalCount = filteredReports.length;

//   //   // Apply pagination
//   //   const paginatedReports = filteredReports
//   //     .sort((a, b) => b.totalSales - a.totalSales)
//   //     .slice(skip, skip + pageSizeNum);

//   //   // Fetch customer data for the paginated reports
//   //   const reportsWithCustomerData = await Promise.all(
//   //     paginatedReports.map(async (report) => {
//   //       const user = await prisma.user.findUnique({
//   //         where: { id: report.userId },
//   //         select: {
//   //           email: true,
//   //           type: true,
//   //           profile: { select: { fullName: true } },
//   //           businessProfile: { select: { businessName: true } },
//   //         },
//   //       });

//   //       return {
//   //         customerId: report.userId,
//   //         name:
//   //           user?.type === 'individual'
//   //             ? user?.profile?.fullName
//   //             : user?.businessProfile?.businessName,
//   //         email: user?.email,
//   //         type: user?.type,
//   //         totalSales: report.totalSales,
//   //         orderCount: report.orderCount,
//   //         aov: report.aov,
//   //       };
//   //     })
//   //   );

//   //   // Calculate meta data
//   //   const totalSales = reportsWithCustomerData.reduce(
//   //     (sum, r) => sum + r.totalSales,
//   //     0
//   //   );
//   //   const averageAOV =
//   //     reportsWithCustomerData.length > 0
//   //       ? reportsWithCustomerData.reduce((sum, r) => sum + r.aov, 0) /
//   //         reportsWithCustomerData.length
//   //       : 0;

//   //   return res.status(200).json({
//   //     success: true,
//   //     data: reportsWithCustomerData,
//   //     meta: {
//   //       totalCustomers: totalCount,
//   //       totalSales,
//   //       averageAOV,
//   //       pagination: {
//   //         currentPage: pageNum,
//   //         pageSize: pageSizeNum,
//   //         totalPages: Math.ceil(totalCount / pageSizeNum),
//   //         hasNextPage: pageNum * pageSizeNum < totalCount,
//   //         hasPreviousPage: pageNum > 1,
//   //       },
//   //     },
//   //   });
//   // } catch (error) {
//   //   console.error('Error fetching financial reports:', error);
//   //   return res.status(500).json({
//   //     success: false,
//   //     error: 'Failed to fetch financial reports',
//   //     ...(process.env.NODE_ENV === 'development' && {
//   //       details: error.message,
//   //     }),
//   //   });
//   // }

//   try {
//     const { 
//       startDate, 
//       endDate, 
//       customerType, 
//       minAOV, 
//       maxAOV
//     } = req.query;

//     // Build where clause
//     const where = {
//       createdAt: {
//         gte: startDate ? new Date(startDate) : undefined,
//         lte: endDate ? new Date(endDate) : undefined
//       },
//       user: customerType ? { type: customerType } : undefined
//     };

//     // Get all grouped reports (without customer data)
//     const reports = await prisma.order.groupBy({
//       by: ['userId'],
//       where,
//       _sum: { totalPrice: true },
//       _count: { id: true },
//       orderBy: { _sum: { totalPrice: 'desc' } }
//     });

//     // Calculate AOV for each report and filter if AOV params exist
//     const reportsWithAOV = reports.map(report => ({
//       ...report,
//       aov: report._count.id > 0 
//         ? safeNumber(report._sum.totalPrice) / report._count.id 
//         : 0
//     })).filter(report => {
//       if (minAOV && report.aov < parseFloat(minAOV)) return false;
//       if (maxAOV && report.aov > parseFloat(maxAOV)) return false;
//       return true;
//     });

//     // Fetch customer data for the filtered reports
//     const reportsWithCustomerData = await Promise.all(
//       reportsWithAOV.map(async report => {
//         const user = await prisma.user.findUnique({
//           where: { id: report.userId },
//           select: {
//             email: true,
//             type: true,
//             profile: { select: { fullName: true } },
//             businessProfile: { select: { businessName: true } }
//           }
//         });

//         return {
//           customerId: report.userId,
//           name: user?.type === 'individual' 
//             ? user?.profile?.fullName 
//             : user?.businessProfile?.businessName,
//           email: user?.email,
//           type: user?.type,
//           totalSales: safeNumber(report._sum.totalPrice),
//           orderCount: report._count.id,
//           aov: report.aov
//         };
//       })
//     );

//     // Calculate meta data
//     const totalSales = reportsWithCustomerData.reduce((sum, r) => sum + r.totalSales, 0);
//     const averageAOV = reportsWithCustomerData.length > 0
//       ? reportsWithCustomerData.reduce((sum, r) => sum + r.aov, 0) / reportsWithCustomerData.length
//       : 0;

//     return res.status(200).json({
//       success: true,
//       data: reportsWithCustomerData,
//       meta: {
//         totalCustomers: reportsWithCustomerData.length,
//         totalSales,
//         averageAOV
//       }
//     });

//   } catch (error) {
//     console.error("Error fetching financial reports:", error);
//     return res.status(500).json({
//       success: false,
//       error: "Failed to fetch financial reports",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: error.message
//       })
//     });
//   }
// };


 const getFinancialReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerType,
      minAOV,
      maxAOV,
    } = req.query;

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

    // Fetch grouped reports without pagination
    const reports = await prisma.order.groupBy({
      by: ['userId'],
      where,
      _sum: { totalPrice: true },
      _count: { id: true },
      
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

    // Apply sorting (e.g., by totalSales, if desired)
    filteredReports.sort((a, b) => b.totalSales - a.totalSales);

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

    // Calculate overall meta data based on the full filteredReports array
    const totalCustomers = reportsWithCustomerData.length;
    const overallTotalSales = reportsWithCustomerData.reduce(
      (sum, r) => sum + r.totalSales,
      0
    );
    const overallAverageAOV =
      reportsWithCustomerData.length > 0
        ? reportsWithCustomerData.reduce((sum, r) => sum + r.aov, 0) /
          reportsWithCustomerData.length
        : 0;

    return res.status(200).json({
      success: true,
      data: reportsWithCustomerData,
      meta: {
        totalCustomers,
        totalSales: overallTotalSales,
        averageAOV: overallAverageAOV,
        // No pagination meta here
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

// Example of a safeNumber utility (you might already have this)


const getFinancialReport = async (req, res) => {
  try {
    const { customerId } = req.params;

    const report = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: customerId },
      _sum: { totalPrice: true },
      _count: { id: true }
    });

    if (!report.length) {
      return res.status(404).json({
        success: false,
        error: "No financial data found for this customer"
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        email: true,
        type: true,
        profile: { select: { fullName: true } },
        businessProfile: { select: { businessName: true } }
      }
    });

    const response = {
      customerId,
      name: user?.type === 'individual' 
        ? user?.profile?.fullName 
        : user?.businessProfile?.businessName,
      email: user?.email,
      type: user?.type,
      totalSales: safeNumber(report[0]._sum.totalPrice),
      orderCount: report[0]._count.id,
      aov: report[0]._count.id > 0 
        ? safeNumber(report[0]._sum.totalPrice) / report[0]._count.id 
        : 0,
      orders: await prisma.order.findMany({
        where: { userId: customerId },
        select: {
          id: true,
          totalPrice: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              product: { select: { name: true } },
              quantity: true,
              unitPrice: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    };

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error("Error fetching financial report:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch financial report",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

 const deleteFinancialData = async (req, res) => {
  try {
    const { customerId } = req.params;

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    // Delete all orders for this customer
    await prisma.order.deleteMany({
      where: { userId: customerId }
    });

    return res.status(200).json({
      success: true,
      message: `All financial data for customer ${customerId} has been deleted`,
      deletedCustomer: {
        id: customerId,
        email: customer.email
      }
    });

  } catch (error) {
    console.error("Error deleting financial data:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete financial data",
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message
      })
    });
  }
};

export { 
  getDashboardReports,
  getFinancialReports,
  getFinancialReport,
  deleteFinancialData 
 };