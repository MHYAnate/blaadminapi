// import prisma from "../../prismaClient.js";


// const getAdminDashboardData = async (req, res) => {
//   try {
//     // Add BigInt serialization support
//     BigInt.prototype.toJSON = function() { return this.toString(); };

//     // Helper function to safely convert values
//     const safeNumber = (value) => {
//       if (value === null || value === undefined) return 0;
//       if (typeof value === 'bigint') return Number(value);
//       return Number(value) || 0;
//     };

//     // Date calculations
//     const currentDate = new Date();
//     const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
//     const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
//     const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
//     const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1);

//     // Parallel queries
//     const [
//       totalRevenueResult,
//       totalOrdersResult,
//       totalCustomersResult,
//       currentMonthRevenueResult,
//       previousMonthRevenueResult,
//       currentMonthOrdersResult,
//       previousMonthOrdersResult,
//       currentMonthCustomersResult,
//       previousMonthCustomersResult,
//       salesPerformanceResult,
//       orderSummaryResult,
//       topSellingProductsResult,
//       topCustomersResult
//     ] = await Promise.all([
//       prisma.order.aggregate({ _sum: { totalPrice: true } }),
//       prisma.order.count(),
//       prisma.user.count(),
//       prisma.order.aggregate({
//         _sum: { totalPrice: true },
//         where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } }
//       }),
//       prisma.order.aggregate({
//         _sum: { totalPrice: true },
//         where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } }
//       }),
//       prisma.order.count({ where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } }}),
//       prisma.order.count({ where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } }}),
//       prisma.user.count({ where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } }}),
//       prisma.user.count({ where: { createdAt: { gte: previousMonthStart, lt: currentMonthStart } }}),
//       prisma.$queryRaw`
//         SELECT
//           TO_CHAR("createdAt", 'YYYY-MM') AS month,
//           SUM("totalPrice") AS total_sales,
//           COUNT(*) AS orders_count
//         FROM "Order"
//         WHERE "createdAt" >= ${sixMonthsAgo}
//         GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
//         ORDER BY month ASC
//       `,
//       prisma.order.groupBy({
//         by: ['status'],
//         _count: { id: true },
//       }),
//       prisma.orderItem.groupBy({
//         by: ['productId'],
//         _sum: { quantity: true },
//         orderBy: { _sum: { quantity: 'desc' } },
//         take: 3
//       }),
//       prisma.order.groupBy({
//         by: ['userId'],
//         _sum: { totalPrice: true },
//         _count: { id: true },
//         orderBy: { _sum: { totalPrice: 'desc' } },
//         take: 4
//       })
//     ]);

//     // Calculate metrics
//     const calculatePercentageChange = (current, previous) => 
//       previous === 0 ? 0 : ((current - previous) / previous) * 100;

//     const currentRevenue = safeNumber(currentMonthRevenueResult._sum.totalPrice);
//     const previousRevenue = safeNumber(previousMonthRevenueResult._sum.totalPrice);
//     const totalRevenue = safeNumber(totalRevenueResult._sum.totalPrice);

//     const metrics = {
//       revenue: {
//         total: totalRevenue,
//         currentMonth: currentRevenue,
//         previousMonth: previousRevenue,
//         changePercentage: calculatePercentageChange(currentRevenue, previousRevenue),
//         trend: currentRevenue >= previousRevenue ? 'up' : 'down'
//       },
//       profits: {
//         total: totalRevenue * 0.2,
//         currentMonth: currentRevenue * 0.2,
//         previousMonth: previousRevenue * 0.2,
//         changePercentage: calculatePercentageChange(currentRevenue * 0.2, previousRevenue * 0.2),
//         trend: currentRevenue >= previousRevenue ? 'up' : 'down'
//       },
//       orders: {
//         total: safeNumber(totalOrdersResult),
//         currentMonth: safeNumber(currentMonthOrdersResult),
//         previousMonth: safeNumber(previousMonthOrdersResult),
//         changePercentage: calculatePercentageChange(
//           safeNumber(currentMonthOrdersResult), 
//           safeNumber(previousMonthOrdersResult)
//         ),
//         trend: safeNumber(currentMonthOrdersResult) >= safeNumber(previousMonthOrdersResult) ? 'up' : 'down'
//       },
//       customers: {
//         total: safeNumber(totalCustomersResult),
//         currentMonth: safeNumber(currentMonthCustomersResult),
//         previousMonth: safeNumber(previousMonthCustomersResult),
//         changePercentage: calculatePercentageChange(
//           safeNumber(currentMonthCustomersResult), 
//           safeNumber(previousMonthCustomersResult)
//         ),
//         trend: safeNumber(currentMonthCustomersResult) >= safeNumber(previousMonthCustomersResult) ? 'up' : 'down'
//       }
//     };

//     // Process additional data
//     const [topProducts, topCustomersDetails, recentCustomers] = await Promise.all([
//       Promise.all(topSellingProductsResult.map(async (item) => {
//         const product = await prisma.product.findUnique({
//           where: { id: item.productId },
//           select: { name: true, options: { take: 1, select: { image: true } } }
//         });
//         return {
//           productId: item.productId,
//           name: product?.name || 'Unknown Product',
//           sales: safeNumber(item._sum.quantity),
//           revenue: safeNumber(item._sum.quantity) * 10, // Assuming average price
//           image: product?.options[0]?.image[0] || null
//         };
//       })),
//       Promise.all(topCustomersResult.map(async (customer) => {
//         const user = await prisma.user.findUnique({
//           where: { id: customer.userId },
//           include: { profile: true, businessProfile: true }
//         });
//         const lastOrder = await prisma.order.findFirst({
//           where: { userId: customer.userId },
//           orderBy: { createdAt: 'desc' },
//           select: { createdAt: true }
//         });
//         console.log(user);
//         return {
//           userId: customer.userId,
//           email: user?.email || 'Unknown',
//           name: user?.type === 'individual' 
//             ? user?.profile?.fullName 
//             : user?.businessProfile?.fullName,
//           status: user?.status || 'inactive',
//           totalSpent: safeNumber(customer._sum.totalPrice),
//           orderCount: safeNumber(customer._count.id),
//           lastOrderDate: lastOrder?.createdAt
//         };
//       })),
//       prisma.user.findMany({
//         orderBy: { createdAt: 'desc' },
//         take: 10,
//         include: {
//           profile: { select: { fullName: true } },
//           businessProfile: { select: { businessName: true } },
//           roles: { select: { role: { select: { name: true } } } }
//         }
//       }).then(users => users.map(user => ({
//         id: user.id,
//         email: user.email,
//         type: user.type,
//         name: user.type === 'individual' 
//           ? user.profile?.fullName 
//           : user.businessProfile?.businessName,
//         status: user.status || 'inactive', // Added status field here
//         kycStatus: user.isVerified ? 'verified' : 'pending',
//         joinDate: user.createdAt,
//         role: user.roles[0]?.role.name || 'customer'
//       })))
//     ]);

//     // Process order summary - simplified format
//     const orderSummary = orderSummaryResult.map(item => ({
//       status: item.status,
//       sales: safeNumber(item._count.id) // Changed to just sales count
//     }));

//     // Final response
//     const response = {
//       success: true,
//       period: {
//         current: currentMonthStart.toISOString(),
//         comparison: previousMonthStart.toISOString(),
//         range: 'monthly'
//       },
//       metrics,
//       charts: {
//         salesPerformance: salesPerformanceResult.map(item => ({
//           month: item.month,
//           total_sales: safeNumber(item.total_sales),
//           orders_count: safeNumber(item.orders_count)
//         })),
//         orderSummary
//       },
//       topPerformers: {
//         products: topProducts,
//         customers: topCustomersDetails
//       },
//       recentActivity: {
//         newCustomers: recentCustomers
//       },
//       lastUpdated: new Date().toISOString()
//     };

//     return res.status(200).json(response);

//   } catch (error) {
//     console.error("Error fetching admin dashboard data:", error);
//     return res.status(500).json({ 
//       success: false,
//       error: "Failed to fetch dashboard data",
//       ...(process.env.NODE_ENV === 'development' && {
//         details: {
//           message: error.message,
//           stack: error.stack
//         }
//       })
//     });
//   }
// };


// export { getAdminDashboardData };

import prisma from "../../prismaClient.js";

const getAdminDashboardData = async (req, res) => {
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

		// Date calculations
		const currentDate = new Date();
		const currentMonthStart = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth(),
			1
		);
		const nextMonthStart = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() + 1,
			1
		);
		const previousMonthStart = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() - 1,
			1
		);
		const sixMonthsAgo = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() - 6,
			1
		);

		// Parallel queries
		const [
			totalRevenueResult,
			totalOrdersResult,
			totalCustomersResult,
			currentMonthRevenueResult,
			previousMonthRevenueResult,
			currentMonthOrdersResult,
			previousMonthOrdersResult,
			currentMonthCustomersResult,
			previousMonthCustomersResult,
			salesPerformanceResult,
			orderSummaryResult,
			topSellingProductsResult,
			topCustomersResult,
		] = await Promise.all([
			prisma.order.aggregate({ _sum: { totalPrice: true } }),
			prisma.order.count(),
			prisma.user.count(),
			prisma.order.aggregate({
				_sum: { totalPrice: true },
				where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
			}),
			prisma.order.aggregate({
				_sum: { totalPrice: true },
				where: {
					createdAt: { gte: previousMonthStart, lt: currentMonthStart },
				},
			}),
			prisma.order.count({
				where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
			}),
			prisma.order.count({
				where: {
					createdAt: { gte: previousMonthStart, lt: currentMonthStart },
				},
			}),
			prisma.user.count({
				where: { createdAt: { gte: currentMonthStart, lt: nextMonthStart } },
			}),
			prisma.user.count({
				where: {
					createdAt: { gte: previousMonthStart, lt: currentMonthStart },
				},
			}),
			prisma.$queryRaw`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          SUM("totalPrice") AS total_sales,
          COUNT(*) AS orders_count
        FROM "Order"
        WHERE "createdAt" >= ${sixMonthsAgo}
        GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
        ORDER BY month ASC
      `,
			prisma.order.groupBy({
				by: ["status"],
				_count: { id: true },
			}),
			prisma.orderItem.groupBy({
				by: ["productId"],
				_sum: { quantity: true },
				orderBy: { _sum: { quantity: "desc" } },
				take: 3,
			}),
			prisma.order.groupBy({
				by: ["userId"],
				_sum: { totalPrice: true },
				_count: { id: true },
				orderBy: { _sum: { totalPrice: "desc" } },
				take: 4,
			}),
		]);

		// Calculate metrics
		const calculatePercentageChange = (current, previous) =>
			previous === 0 ? 0 : ((current - previous) / previous) * 100;

		const currentRevenue = safeNumber(
			currentMonthRevenueResult._sum.totalPrice
		);
		const previousRevenue = safeNumber(
			previousMonthRevenueResult._sum.totalPrice
		);
		const totalRevenue = safeNumber(totalRevenueResult._sum.totalPrice);

		const metrics = {
			revenue: {
				total: totalRevenue,
				currentMonth: currentRevenue,
				previousMonth: previousRevenue,
				changePercentage: calculatePercentageChange(
					currentRevenue,
					previousRevenue
				),
				trend: currentRevenue >= previousRevenue ? "up" : "down",
			},
			profits: {
				total: totalRevenue * 0.2,
				currentMonth: currentRevenue * 0.2,
				previousMonth: previousRevenue * 0.2,
				changePercentage: calculatePercentageChange(
					currentRevenue * 0.2,
					previousRevenue * 0.2
				),
				trend: currentRevenue >= previousRevenue ? "up" : "down",
			},
			orders: {
				total: safeNumber(totalOrdersResult),
				currentMonth: safeNumber(currentMonthOrdersResult),
				previousMonth: safeNumber(previousMonthOrdersResult),
				changePercentage: calculatePercentageChange(
					safeNumber(currentMonthOrdersResult),
					safeNumber(previousMonthOrdersResult)
				),
				trend:
					safeNumber(currentMonthOrdersResult) >=
					safeNumber(previousMonthOrdersResult)
						? "up"
						: "down",
			},
			customers: {
				total: safeNumber(totalCustomersResult),
				currentMonth: safeNumber(currentMonthCustomersResult),
				previousMonth: safeNumber(previousMonthCustomersResult),
				changePercentage: calculatePercentageChange(
					safeNumber(currentMonthCustomersResult),
					safeNumber(previousMonthCustomersResult)
				),
				trend:
					safeNumber(currentMonthCustomersResult) >=
					safeNumber(previousMonthCustomersResult)
						? "up"
						: "down",
			},
		};

		// Process additional data
		const [topProducts, topCustomersDetails, recentCustomers] =
			await Promise.all([
				Promise.all(
					topSellingProductsResult.map(async (item) => {
						const product = await prisma.product.findUnique({
							where: { id: item.productId },
							select: {
								name: true,
								options: { take: 1, select: { image: true } },
							},
						});
						return {
							productId: item.productId,
							name: product?.name || "Unknown Product",
							sales: safeNumber(item._sum.quantity),
							revenue: safeNumber(item._sum.quantity) * 10, // Assuming average price
							image: product?.options[0]?.image[0] || null,
						};
					})
				),
				Promise.all(
					topCustomersResult.map(async (customer) => {
						const user = await prisma.user.findUnique({
							where: { id: customer.userId },
							include: { profile: true, businessProfile: true },
						});
						const lastOrder = await prisma.order.findFirst({
							where: { userId: customer.userId },
							orderBy: { createdAt: "desc" },
							select: { createdAt: true },
						});
						console.log(user);
						return {
							userId: customer.userId,
							email: user?.email || "Unknown",
							name:
								user?.type === "individual"
									? user?.profile?.fullName
									: user?.businessProfile?.fullName,
							status: user?.status || "inactive",
							totalSpent: safeNumber(customer._sum.totalPrice),
							orderCount: safeNumber(customer._count.id),
							lastOrderDate: lastOrder?.createdAt,
						};
					})
				),
				prisma.user
					.findMany({
						orderBy: { createdAt: "desc" },
						take: 10,
						include: {
							profile: { select: { fullName: true } },
							businessProfile: { select: { businessName: true } },
							roles: { select: { role: { select: { name: true } } } },
						},
					})
					.then((users) =>
						users.map((user) => ({
							id: user.id,
							email: user.email,
							type: user.type,
							name:
								user.type === "individual"
									? user.profile?.fullName || user.email.split("@")[0] // Add email fallback
									: user.businessProfile?.businessName ||
										user.email.split("@")[0], // Add email fallback
							status: user.status || "inactive", // Added status field here
							kycStatus: user.isVerified ? "verified" : "pending",
							joinDate: user.createdAt,
							role: user.roles[0]?.role.name || "customer",
						}))
					),

				// .then(users => users.map(user => {
				//   const name = user.type === 'individual'
				//     ? user.profile?.fullName
				//     : user.businessProfile?.businessName;
				//   const customerObject = {
				//     id: user.id,
				//     email: user.email,
				//     type: user.type,
				//     name: name,
				//     status: user.status || 'inactive',
				//     kycStatus: user.isVerified ? 'verified' : 'pending',
				//     joinDate: user.createdAt,
				//     role: user.roles[0]?.role.name || 'customer'
				//   };
				//   console.log("Processing Recent Customer:", customerObject); // Log the final object
				//   return customerObject;
				// }))
			]);

		// Process order summary - simplified format
		const orderSummary = orderSummaryResult.map((item) => ({
			status: item.status,
			sales: safeNumber(item._count.id), // Changed to just sales count
		}));

		// Final response
		const response = {
			success: true,
			period: {
				current: currentMonthStart.toISOString(),
				comparison: previousMonthStart.toISOString(),
				range: "monthly",
			},
			metrics,
			charts: {
				salesPerformance: salesPerformanceResult.map((item) => ({
					month: item.month,
					total_sales: safeNumber(item.total_sales),
					orders_count: safeNumber(item.orders_count),
				})),
				orderSummary,
			},
			topPerformers: {
				products: topProducts,
				customers: topCustomersDetails,
			},
			recentActivity: {
				newCustomers: recentCustomers,
			},
			lastUpdated: new Date().toISOString(),
		};

		return res.status(200).json(response);
	} catch (error) {
		console.error("Error fetching admin dashboard data:", error);
		return res.status(500).json({
			success: false,
			error: "Failed to fetch dashboard data",
			...(process.env.NODE_ENV === "development" && {
				details: {
					message: error.message,
					stack: error.stack,
				},
			}),
		});
	}
};

export { getAdminDashboardData };
