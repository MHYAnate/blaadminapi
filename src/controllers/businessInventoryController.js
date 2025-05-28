import { Prisma } from "@prisma/client";
import cloudinary from "../cloudinary.js";
import prisma from "../prismaClient.js";

// Get Inventory Dashboard
const getInventoryDashboard = async (req, res) => {
  const businessUserId = req.user.id; // Authenticated business user
  const type = req.user.type; // Type of user (e.g., 'business', 'individual')
  try {

    // Check if the user is a business user
    if (type !== 'business') {
      return res.status(403).json({ 
        error: 'Access denied. Only business users can access this endpoint.'
      });
    }

    // Total number of products in inventory
    const totalProducts = await prisma.inventory.count({
      where: { businessUserId },
    });

    // Total profits (assuming profits are calculated from sales)
    const totalProfits = await prisma.order.aggregate({
      _sum: { totalPrice: true },
      where: {
        userId: businessUserId,
        status: 'DELIVERED', // Only consider delivered orders
      },
    });

    // Profit graph (last 6 months)
    const profitGraph = await prisma.$queryRaw`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') AS month,
        SUM("totalPrice") AS totalProfit
      FROM
        "Order"
      WHERE
        "userId" = ${businessUserId}
        AND "status" = 'DELIVERED'
        AND "createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY
        TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY
        month ASC
    `;

    // Top-selling products
    const topSellingProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: {
        order: {
          userId: businessUserId,
          status: 'DELIVERED',
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5, // Top 5 selling products
    });

    const topProducts = await Promise.all(
      topSellingProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return {
          product: product.name,
          sales: item._sum.quantity,
        };
      })
    );

    return res.status(200).json({
      message: 'Inventory dashboard fetched successfully',
      data: {
        totalProducts,
        totalProfits: totalProfits._sum.totalPrice || 0,
        profitGraph,
        topSellingProducts: topProducts,
      },
    });
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error);
    return res.status(500).json({ error: 'Failed to fetch inventory dashboard' });
  }
};

// Get Product Summary
const getProductSummary = async (req, res) => {
  const businessUserId = req.user.id;

  try {
    // Single optimized query to get all necessary data
    const inventoryData = await prisma.inventory.findMany({
      where: { businessUserId },
      include: {
        product: {
          include: {
            options: true
          }
        }
      }
    });

    // Calculate all metrics in a single pass
    let totalProducts = 0;
    let stockInHand = 0;
    let totalStockPrice = 0;
    let pendingStockCount = 0;

    inventoryData.forEach(item => {
      totalProducts++;
      stockInHand += item.quantity;
      
      // Find the first/main product option for price calculation
      const mainOption = item.product.options[0];
      if (mainOption) {
        totalStockPrice += (item.quantity * mainOption.sellingPrice);
      }

      if (item.quantity < 10) { // Low stock threshold
        pendingStockCount++;
      }
    });

    return res.status(200).json({
      message: 'Product summary fetched successfully',
      data: {
        totalProducts,
        stockInHand,
        totalStockPrice,
        pendingStock: pendingStockCount,
        // Optional: Include pending stock items if needed
        // pendingStockItems: inventoryData.filter(item => item.quantity < 10)
      },
    });
  } catch (error) {
    console.error('Error fetching product summary:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch product summary',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Products in Inventory
const getProductsInInventory = async (req, res) => {
  const businessUserId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // Get paginated inventory items
    const inventory = await prisma.inventory.findMany({
      where: { businessUserId },
      include: { 
        product: {
          include: {
            options: true,
            manufacturer: true,
            category: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        product: {
          name: 'asc', // Default sorting by product name
        },
      },
    });

    // Get total count for pagination metadata
    const totalItems = await prisma.inventory.count({
      where: { businessUserId },
    });

    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      message: 'Products in inventory fetched successfully',
      data: inventory,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('Error fetching products in inventory:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch products in inventory',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create Product and Inventory
const createProductAndInventory = async (req, res) => {
  try {
    const { name, description, categoryId, manufacturerId, options, type = "business" } = req.body;
    const businessUserId = req.user.id;

    // Validate required fields
    if (!name || !description || !categoryId || !manufacturerId || !options) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate options
    if (!Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ error: 'At least one product option is required' });
    }

    // Upload images to Cloudinary for each product option
    const updatedOptions = await Promise.all(
      options.map(async (option) => {
        const { image = [], ...rest } = option;

        // Upload images to Cloudinary if provided
        const uploadedImages = image && image.length > 0 ? await Promise.all(
          image.map(async (img) => {
            if (typeof img === 'string' && img.startsWith('http')) {
              return img; // Already a URL, no need to upload
            }
            const result = await cloudinary.uploader.upload(img, {
              folder: 'products',
            });
            return result.secure_url;
          })
        ) : [];

        return {
          ...rest,
          image: uploadedImages,
          inventory: rest.inventory || 0, // Changed from currentStock to inventory
        };
      })
    );

    // Create the product in the database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        categoryId: parseInt(categoryId),
        manufacturerId: parseInt(manufacturerId),
        type,
        businessOwnerId: type === "business" ? businessUserId : undefined,
        options: {
          create: updatedOptions.map(option => ({
            value: option.value,
            weight: option.weight || 0,
            stockPrice: option.stockPrice || 0,
            sellingPrice: option.sellingPrice || 0,
            markupType: option.markupType || 'FIXED',
            markupValue: option.markupValue || 0,
            price: option.price || 0,
            moq: option.moq || 1,
            image: option.image,
            unit: option.unit || 'unit',
            inventory: option.inventory || 0,
            lowStockThreshold: option.lowStockThreshold || 10
          })),
        },
      },
      include: {
        options: true,
        category: true,
        manufacturer: true,
      },
    });

    // Create inventory records for the product (not per option)
    const inventory = await prisma.inventory.create({
      data: {
        productId: product.id,
        businessUserId,
        quantity: updatedOptions.reduce((sum, option) => sum + (option.inventory || 0), 0),
        source: 'manual',
      },
    });

    return res.status(201).json({
      message: 'Product and inventory created successfully',
      data: { 
        product,
        inventory 
      },
    });
  } catch (error) {
    console.error('Error creating product and inventory:', error);
    return res.status(500).json({ 
      error: 'Failed to create product and inventory',
      details: error.message 
    });
  }
};

// Create Stock Transaction
const createStockTransaction = async (req, res) => {
    const { productId, quantity, type } = req.body; // type: 'in' or 'out'
    const businessUserId = req.user.id; // Authenticated business user
  
    try {
      // Find the product in inventory
      const inventory = await prisma.inventory.findUnique({
        where: {
          productId_businessUserId_source: {
            productId,
            businessUserId,
            source: 'manual', // Assuming manual transactions
          },
        },
        include: {
          product: {
            include: {
              options: true, // Include product options
            },
          },
        },
      });
  
      if (!inventory) {
        return res.status(404).json({ error: 'Product not found in inventory' });
      }
  
      // Update quantity based on transaction type
      const updatedQuantity =
        type === 'in' ? inventory.quantity + quantity : inventory.quantity - quantity;
  
      // Update the main inventory quantity
      await prisma.inventory.update({
        where: { id: inventory.id },
        data: { quantity: updatedQuantity },
      });
  
      // Update the inventory for each product option
      await Promise.all(
        inventory.product.options.map(async (option) => {
          const updatedOptionQuantity =
            type === 'in' ? option.inventory + quantity : option.inventory - quantity;
  
          await prisma.productOption.update({
            where: { id: option.id },
            data: { inventory: updatedOptionQuantity },
          });
        })
      );
  
      return res.status(200).json({ message: 'Stock transaction completed successfully' });
    } catch (error) {
      console.error('Error creating stock transaction:', error);
      return res.status(500).json({ error: 'Failed to create stock transaction' });
    }
  };
  

// Get Low Stock Products
const getLowStockProducts = async (req, res) => {
  const businessUserId = req.user.id; // Authenticated business user

  try {
    const lowStockProducts = await prisma.inventory.findMany({
      where: {
        businessUserId,
        quantity: { lt: 10 }, // Assuming low stock threshold is 10
      },
      include: { product: true },
    });

    return res.status(200).json({
      message: 'Low stock products fetched successfully',
      data: lowStockProducts,
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return res.status(500).json({ error: 'Failed to fetch low stock products' });
  }
};


  // Update Product and Inventory
  const updateProductAndInventory = async (req, res) => {
    const { productId } = req.params;
    const { name, description, categoryId, manufacturerId, options, quantity } = req.body;
    const businessUserId = req.user.id;
  
    try {
      // First check if product exists and is not a platform product
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        select: { type: true }
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      if (product.type === 'platform') {
        return res.status(403).json({ error: 'Platform products cannot be modified' });
      }
  
      // Rest of your update logic...
      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          name,
          description,
          categoryId: parseInt(categoryId),
          manufacturerId: parseInt(manufacturerId),
          options: {
            deleteMany: {},
            create: options.map(option => ({
              ...option,
              image: option.image || [],
            })),
          },
        },
        include: {
          options: true,
          category: true,
          manufacturer: true,
        },
      });
  
      if (quantity !== undefined) {
        await prisma.inventory.update({
          where: {
            productId_businessUserId_source: {
              productId: parseInt(productId),
              businessUserId,
              source: 'manual',
            },
          },
          data: { quantity },
        });
      }
  
      return res.status(200).json({
        message: 'Product and inventory updated successfully',
        data: updatedProduct,
      });
  
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product' });
    }
  };


  // Delete Product and Inventory
  const deleteProductAndInventory = async (req, res) => {
    const { productId } = req.params;
    const businessUserId = req.user.id;
  
    // Validate productId
    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }
  
    const numericProductId = parseInt(productId);
  
    try {
      // Verify product exists and belongs to the business user
      const product = await prisma.product.findUnique({
        where: { id: numericProductId },
        include: {
          inventory: {
            where: { businessUserId }
          },
          options: true // Include options to check if they exist
        }
      });
  
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      if (product.type === 'platform') {
        return res.status(403).json({ 
          error: 'Platform products cannot be deleted',
          code: 'PLATFORM_PRODUCT_PROTECTED'
        });
      }
  
      // Verify the product has inventory belonging to this business user
      if (!product.inventory || product.inventory.length === 0) {
        return res.status(403).json({
          error: 'Product does not belong to your business',
          code: 'PRODUCT_OWNERSHIP_MISMATCH'
        });
      }
  
      // Use a transaction to ensure all deletions succeed or fail together
      await prisma.$transaction([
        // 1. First delete any cart items referencing product options
        prisma.cartItem.deleteMany({
          where: {
            productOptionId: {
              in: product.options.map(option => option.id)
            }
          }
        }),
        
        // 2. Delete saved products
        prisma.savedProduct.deleteMany({
          where: {
            productId: numericProductId
          }
        }),
        
        // 3. Delete product options
        prisma.productOption.deleteMany({
          where: {
            productId: numericProductId
          }
        }),
        
        // 4. Delete inventory records
        prisma.inventory.deleteMany({
          where: {
            productId: numericProductId,
            businessUserId
          }
        }),
        
        // 5. Finally delete the product itself
        prisma.product.delete({
          where: { 
            id: numericProductId,
            businessOwnerId: businessUserId
          }
        })
      ]);
  
      return res.status(200).json({
        success: true,
        message: 'Product and all associated data deleted successfully',
        deletedProductId: numericProductId
      });
  
    } catch (error) {
      console.error('Error deleting product:', error);
  
      // Handle specific Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            error: 'Product or inventory not found',
            details: error.meta
          });
        }
        return res.status(500).json({
          error: 'Database error',
          code: error.code,
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
  
      return res.status(500).json({
        error: 'Failed to delete product',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

export {
  getInventoryDashboard,
  getProductSummary,
  getProductsInInventory,
  createProductAndInventory,
  createStockTransaction,
  getLowStockProducts,
  updateProductAndInventory,
  deleteProductAndInventory
};