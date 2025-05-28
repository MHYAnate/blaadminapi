import prisma from "../../prismaClient.js";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

// Helper function to process product options
const processOptions = (options) => {
  return options.map(option => ({
    ...option,
    weight: parseFloat(option.weight) || 0,
    stockPrice: parseFloat(option.stockPrice) || 0,
    sellingPrice: parseFloat(option.sellingPrice) || 0,
    markupValue: parseFloat(option.markupValue) || 0,
    price: parseFloat(option.price) || 0,
    moq: parseInt(option.moq) || 1,
    inventory: parseInt(option.inventory) || 0,
    lowStockThreshold: parseInt(option.lowStockThreshold) || 10,
    image: Array.isArray(option.image) ? option.image : [option.image]
  }));
};

// Create Product
const adminCreateProduct = async (req, res) => {
  try {
    const { name, description, categoryId, manufacturerId, options, type } = req.body;

    // Validate required fields
    const requiredFields = ['name', 'description', 'categoryId', 'manufacturerId', 'options'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }

    // Create product with processed options

    const product = await prisma.product.create({
      data: {
        name,
        description,
        type: type || 'platform',
        category: { connect: { id: parseInt(categoryId) } },
        manufacturer: { connect: { id: parseInt(manufacturerId) } },
        options: { create: processOptions(options) }
      },
      include: {
        category: true,
        manufacturer: true,
        options: true
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ 
      error: 'Failed to create product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Products with Advanced Filtering
const adminGetProducts = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    let pageSize = parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE;
    pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    const skip = (page - 1) * pageSize;

    // Build filters
    const where = {
      ...(req.query.name && { 
        name: { contains: req.query.name, mode: 'insensitive' } 
      }),
      ...(req.query.categoryId && { categoryId: parseInt(req.query.categoryId) }),
      ...(req.query.manufacturerId && { manufacturerId: parseInt(req.query.manufacturerId) }),
      ...(req.query.type && { type: req.query.type }),
      ...(req.query.minPrice && {
        options: { some: { price: { gte: parseFloat(req.query.minPrice) } } }
      }),
      ...(req.query.maxPrice && {
        options: { some: { price: { lte: parseFloat(req.query.maxPrice) } } }
      })
    };

    // Date range filters
    if (req.query.createdAfter || req.query.createdBefore) {
      where.createdAt = {
        ...(req.query.createdAfter && { gte: new Date(req.query.createdAfter) }),
        ...(req.query.createdBefore && { lte: new Date(req.query.createdBefore) })
      };
    }

    // Get total count
    const totalCount = await prisma.product.count({ where });

    // Prepare include object
    const include = {
      category: true,
      manufacturer: true,
      options: req.query.includeOptions === 'true'
    };

    // Only include _count if at least one count is requested
    const includeOrderCount = req.query.includeOrderCount === 'true';
    const includeSavedCount = req.query.includeSavedCount === 'true';
    
    if (includeOrderCount || includeSavedCount) {
      include._count = {
        select: {
          ...(includeOrderCount && { orders: true }),
          ...(includeSavedCount && { savedByUsers: true })
        }
      };
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: {
        [req.query.sortBy || 'createdAt']: req.query.sortOrder || 'desc'
      },
      include
    });

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        hasNextPage: (page * pageSize) < totalCount,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Failed to fetch products',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Single Product
const adminGetProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        manufacturer: true,
        options: true,
        deals: req.query.includeDeals === 'true',
        inventory: req.query.includeInventory === 'true',
        _count: {
          select: {
            orders: req.query.includeOrderCount === 'true',
            savedByUsers: req.query.includeSavedCount === 'true'
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update Product
const adminUpdateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, categoryId, manufacturerId, options, type } = req.body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(description && { description }),
      ...(type && { type }),
      ...(categoryId && { categoryId: parseInt(categoryId) }),
      ...(manufacturerId && { manufacturerId: parseInt(manufacturerId) })
    };

    // Process options if provided
    if (options) {
      // First delete all existing options
      await prisma.productOption.deleteMany({
        where: { productId: parseInt(id) }
      });
      
      // Then create new options
      updateData.options = {
        create: processOptions(options)
      };
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: true,
        manufacturer: true,
        options: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });

  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ 
      error: 'Failed to update product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete Product
const adminDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists and has associated orders
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: { 
        _count: { 
          select: { 
            orders: true,
            savedByUsers: true
          } 
        } 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product._count.orders > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete product with associated orders' 
      });
    }

    // Delete product (relations will be cascade deleted)
    await prisma.product.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ 
      error: 'Failed to delete product',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  adminCreateProduct,
  adminGetProducts,
  adminGetProduct,
  adminUpdateProduct,
  adminDeleteProduct
};