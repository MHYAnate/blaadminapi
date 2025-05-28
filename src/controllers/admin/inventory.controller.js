import prisma from "../../prismaClient.js";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Get inventory dashboard stats
export const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Total products count
        const totalProducts = await prisma.businessInventory.count({
            where: { userId }
        });

        // Status counts
        const statusCounts = await prisma.businessInventory.groupBy({
            by: ['status'],
            where: { userId },
            _count: { id: true }
        });

        // Monthly stock movement (Jan-Dec)
        const currentYear = new Date().getFullYear();
        const monthlyMovement = await getMonthlyStockMovement(userId, currentYear);

        // Stock alerts (products below min stock)
        const stockAlerts = await prisma.businessInventory.findMany({
            where: {
                userId,
                currentStock: {
                    lt: prisma.businessInventory.fields.minStockLevel
                }
            },
            include: {
                product: true
            },
            orderBy: {
                currentStock: 'asc'
            }
        });

        // Format status counts
        const formattedStatusCounts = statusCounts.reduce((acc, { status, _count }) => {
            acc[status] = _count.id;
            return acc;
        }, {});

        return res.status(200).json({
            message: "Dashboard stats retrieved successfully",
            data: {
                totalProducts,
                statusCounts: formattedStatusCounts,
                monthlyMovement,
                stockAlerts
            }
        });
    } catch (error) {
        console.error("Error retrieving dashboard stats:", error);
        return res.status(500).json({
            message: "An error occurred while retrieving dashboard stats",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get manufacturer inventory summary
export const getManufacturerInventory = async (req, res) => {
    try {
        const manufacturerId = parseInt(req.params.manufacturerId);
        const userId = req.user.id;

        // Validate manufacturerId
        if (!manufacturerId) {
            return res.status(400).json({ error: 'Manufacturer ID is required' });
        }

        // Check if manufacturer exists
        const manufacturerExists = await prisma.manufacturer.findUnique({
            where: { id: manufacturerId }
        });

        if (!manufacturerExists) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE;
        pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        const skip = (page - 1) * pageSize;

        // Build filter conditions
        const where = {
            userId,
            product: { manufacturerId }
        };

        // Get total count with applied filters
        const totalCount = await prisma.businessInventory.count({ where });

        // Get filtered inventory
        const inventory = await prisma.businessInventory.findMany({
            where,
            skip,
            take: pageSize,
            include: {
                product: true,
                productOption: true
            },
            orderBy: {
                [req.query.sortBy || 'product.name']: req.query.sortOrder || 'asc'
            }
        });

        const summary = {
            totalProducts: inventory.length,
            inStock: inventory.filter(i => i.status === 'IN_STOCK').length,
            lowStock: inventory.filter(i => i.status === 'LOW_STOCK').length,
            outOfStock: inventory.filter(i => i.status === 'OUT_OF_STOCK').length,
            products: inventory
        };

        return res.status(200).json({
            message: "Manufacturer inventory retrieved successfully",
            data: summary,
            manufacturer: {
                id: manufacturerExists.id,
                name: manufacturerExists.name
            },
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                hasNextPage: (page * pageSize) < totalCount,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error retrieving manufacturer inventory:", error);
        return res.status(500).json({
            message: "An error occurred while retrieving manufacturer inventory",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Set stock limits for a product
export const setStockLimits = async (req, res) => {
    try {
        const inventoryId = parseInt(req.params.inventoryId);
        const { minStockLevel, maxStockLevel, reorderPoint } = req.body;

        // Validate input
        if (!inventoryId) {
            return res.status(400).json({ error: 'Inventory ID is required' });
        }

        // Get current inventory
        const currentInventory = await prisma.businessInventory.findUnique({
            where: { id: inventoryId }
        });

        if (!currentInventory) {
            return res.status(404).json({ error: 'Inventory record not found' });
        }

        // Calculate new status
        const newStatus = calculateInventoryStatus(
            currentInventory.currentStock,
            minStockLevel,
            maxStockLevel
        );

        // Update inventory
        const updatedInventory = await prisma.businessInventory.update({
            where: { id: inventoryId },
            data: {
                minStockLevel,
                maxStockLevel,
                reorderPoint,
                status: newStatus
            }
        });

        return res.status(200).json({
            message: "Stock limits updated successfully",
            data: updatedInventory
        });
    } catch (error) {
        console.error("Error setting stock limits:", error);
        return res.status(500).json({
            message: "An error occurred while setting stock limits",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Helper to get monthly stock movement
async function getMonthlyStockMovement(userId, year) {
    const results = await prisma.$queryRaw`
        SELECT 
            EXTRACT(MONTH FROM "createdAt") as month,
            SUM(CASE WHEN "changeType" = 'STOCK_IN' THEN "changeAmount" ELSE 0 END) as stock_in,
            SUM(CASE WHEN "changeType" = 'STOCK_OUT' THEN ABS("changeAmount") ELSE 0 END) as stock_out
        FROM "InventoryHistory"
        WHERE "userId" = ${userId} 
            AND EXTRACT(YEAR FROM "createdAt") = ${year}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY month
    `;

    // Format for all months (Jan-Dec)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((monthName, index) => {
        const monthData = results.find(r => parseInt(r.month) === index + 1);
        return {
            month: monthName,
            stockIn: monthData ? parseInt(monthData.stock_in) : 0,
            stockOut: monthData ? parseInt(monthData.stock_out) : 0
        };
    });
}

// Helper to calculate inventory status
function calculateInventoryStatus(currentStock, minStock, maxStock) {
    if (currentStock <= 0) return 'OUT_OF_STOCK';
    if (currentStock < minStock) return 'LOW_STOCK';
    if (maxStock && currentStock > maxStock) return 'OVERSTOCKED';
    return 'IN_STOCK';
}