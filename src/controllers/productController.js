import express from 'express';
import prisma from '../prismaClient.js';
import cloudinary from '../cloudinary.js';

  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 10;


  const ProductHandler = async (req, res) => {
      try {
          const {
              type,
              id,
              page = DEFAULT_PAGE,
              limit = DEFAULT_LIMIT,
              categoryId,
              manufacturerId,
              frequentlyBought, 
              suggested,        
          } = req.query;

          const pageNumber = parseInt(page);
          const limitNumber = parseInt(limit);
          const offset = (pageNumber - 1) * limitNumber;

          // Get a single product by ID
          if (id) {
              const product = await prisma.product.findUnique({
                  where: { id: parseInt(id) },
                  include: {
                      options: true,
                      manufacturer: true,
                      category: true,
                  },
              });

              if (!product) {
                  return res.status(404).json({ error: 'Product not found' });
              }

              return res.json(product);
          }

          // Base query for filtering
          const where = {};
          if (categoryId) {
              where.categoryId = parseInt(categoryId); // Filter by category
          }
          if (manufacturerId) {
              where.manufacturerId = parseInt(manufacturerId); // Filter by manufacturer
          }

          // Filter for frequently bought items
          if (frequentlyBought === 'true') {
              where.orders = {
                  some: {}, // Ensure the product has at least one order
              };
          }

          // Get total count of products (for pagination metadata)
          const totalProducts = await prisma.product.count({ where });

          // Calculate total pages
          const totalPages = Math.ceil(totalProducts / limitNumber);

          // Get new products (sorted by creation date)
          if (type === 'new') {
              const newProducts = await prisma.product.findMany({
                  where,
                  orderBy: { createdAt: 'desc' },
                  skip: offset,
                  take: limitNumber,
                  include: {
                      options: true,
                      manufacturer: true,
                      category: true,
                  },
              });

              return res.json({
                  data: newProducts,
                  pagination: {
                      totalProducts,
                      totalPages,
                      currentPage: pageNumber,
                      limit: limitNumber,
                  },
              });
          }

          // Get trending products (sorted by most ordered)
          if (type === 'trending') {
              const trendingProducts = await prisma.product.findMany({
                  where,
                  orderBy: {
                      orders: {
                          _count: 'desc',
                      },
                  },
                  skip: offset,
                  take: limitNumber,
                  include: {
                      options: true,
                      manufacturer: true,
                      category: true,
                  },
              });

              return res.json({
                  data: trendingProducts,
                  pagination: {
                      totalProducts,
                      totalPages,
                      currentPage: pageNumber,
                      limit: limitNumber,
                  },
              });
          }

          // Get suggested/popular products (sorted by most saved or most ordered)
          if (suggested === 'true') {
              const suggestedProducts = await prisma.product.findMany({
                  where,
                  orderBy: [
                      {
                          savedByUsers: {
                              _count: 'desc',
                          },
                      },
                      {
                          orders: {
                              _count: 'desc',
                          },
                      },
                  ],
                  skip: offset,
                  take: limitNumber,
                  include: {
                      options: true,
                      manufacturer: true,
                      category: true,
                  },
              });

              return res.json({
                  data: suggestedProducts,
                  pagination: {
                      totalProducts,
                      totalPages,
                      currentPage: pageNumber,
                      limit: limitNumber,
                  },
              });
          }

          // Get all products (default) with pagination
          const products = await prisma.product.findMany({
              where,
              skip: offset,
              take: limitNumber,
              include: {
                  options: true,
                  manufacturer: true,
                  category: true,
              },
          });

          return res.json({
              data: products,
              pagination: {
                  totalProducts,
                  totalPages,
                  currentPage: pageNumber,
                  limit: limitNumber,
              },
          });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ error: 'Failed to fetch products' });
      }
  };

  const searchProducts = async (req, res) => {
      try {
          const { query, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = req.query;
          const pageNumber = parseInt(page);
          const limitNumber = parseInt(limit);
          const offset = (pageNumber - 1) * limitNumber;

          if (!query) {
              return res.status(400).json({ error: "Search query is required" });
          }

          const products = await prisma.product.findMany({
              where: {
                  OR: [
                      // Search by product name
                      { name: { contains: query, mode: 'insensitive' } },
                      // Search by category
                      { category: { name: { contains: query, mode: 'insensitive' } } },
                      // Search by manufacturer
                      { manufacturer: { name: { contains: query, mode: 'insensitive' } } }
                  ]
              },
              skip: offset,
              take: limitNumber,
              include: {
                  options: true,
                  manufacturer: true,
                  category: true
              }
          });

          if (products.length === 0) {
              return res.status(404).json({ message: "No products found" });
          }

          return res.json(products);
      } catch (error) {
          console.error(error);
          return res.status(500).json({ error: "Failed to search products" });
      }
  };

  const ProductCategories = async (req, res) => {
      try {
        
          const category = await prisma.category.findMany();

          return res.json({ message:" Product Categories Retrived", data: category });
      } catch (error) {
          console.error(error);
          return res.status(500).json({ error: "Failed to search products" });
      }
  };

  const createProduct = async (req, res) => {
    try {
      const { name, description, categoryId, manufacturerId, options } = req.body;

      // Validate required fields
      if (!name || !description || !categoryId || !manufacturerId || !options) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse options (assuming options is an array of objects)
      const updatedOptions = options.map((option) => {
        const { image, ...rest } = option;

        // Ensure image is an array of URLs
        const imageUrls = Array.isArray(image) ? image : [image];

        // Set default values for missing fields
        return {
          value: rest.value , 
          weight: rest.weight , 
          stockPrice: rest.stockPrice , 
          sellingPrice: rest.sellingPrice , 
          markupType: rest.markupType ,
          markupValue: rest.markupValue, 
          price: rest.price , 
          moq: rest.moq, 
          unit: rest.unit, 
          image: imageUrls,
          inventory: rest.inventory, 
          lowStockThreshold: rest.lowStockThreshold, 
        };
      });

      // Create the product in the database
      const product = await prisma.product.create({
        data: {
          name,
          description,
          categoryId: parseInt(categoryId),
          manufacturerId: parseInt(manufacturerId),
          options: {
            create: updatedOptions, 
          },
        },
        include: {
          options: true, 
          category: true,
          manufacturer: true, 
        },
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create product', details: error.message });
    }
  };

  const updateProduct = async (req, res) => {
    try {
      const { id } = req.params; 
      const { name, description, categoryId, manufacturerId, options } = req.body;
  
      // Fetch the existing product
      const existingProduct = await prisma.product.findUnique({
        where: { id: parseInt(id) },
        include: { options: true }, // Include options in the response
      });
  
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
  
      // Update the product
      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(id) },
        data: {
          name: name || existingProduct.name,
          description: description || existingProduct.description,
          categoryId: parseInt(categoryId) || existingProduct.categoryId,
          manufacturerId: parseInt(manufacturerId) || existingProduct.manufacturerId,
          options: {
            upsert: options.map((option) => ({
              where: { id: option.id || -1 }, 
              update: {
                value: option.value,
                weight: option.weight,
                stockPrice: option.stockPrice,
                sellingPrice: option.sellingPrice,
                markupType: option.markupType,
                markupValue: option.markupValue,
                price: option.price,
                moq: option.moq,
                unit: option.unit,
                image: option.image,
                inventory: option.inventory,
                lowStockThreshold: option.lowStockThreshold,
              },
              create: {
                value: option.value,
                weight: option.weight,
                stockPrice: option.stockPrice,
                sellingPrice: option.sellingPrice,
                markupType: option.markupType,
                markupValue: option.markupValue,
                price: option.price,
                moq: option.moq,
                unit: option.unit,
                image: option.image,
                inventory: option.inventory,
                lowStockThreshold: option.lowStockThreshold,
              },
            })),
          },
        },
        include: {
          options: true,
          category: true, 
          manufacturer: true,
        },
      });
  
      return res.status(200).json({
        message: 'Product updated successfully',
        data:updatedProduct
      });
      
    } catch (error) {
      console.error('Error updating product:', error);
      return res.status(500).json({ error: 'Failed to update product', details: error.message });
    }
  };
  
  // Save a product for a user
  const saveProduct = async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;

    try {
      // Check if the product is already saved by the user
      const existingSavedProduct = await prisma.savedProduct.findUnique({
        where: {
          userId_productId: {
            userId: parseInt(userId),
            productId: parseInt(productId),
          },
        },
      });

      if (existingSavedProduct) {
        return res.status(400).json({ message: 'Product is already saved by the user.' });
      }

      // Save the product
      const savedProduct = await prisma.savedProduct.create({
        data: {
          userId: parseInt(userId),
          productId: parseInt(productId),
        },
      });

      res.status(201).json({ message: 'Product saved successfully.', savedProduct });
    } catch (error) {
      console.error('Error saving product:', error);
      res.status(500).json({ message: 'An error occurred while saving the product.' });
    }
  };

  const getSavedProducts = async (req, res) => {
      const userId = req.user.id;
      
      try {
        const savedProducts = await prisma.savedProduct.findMany({
          where: {
            userId: parseInt(userId),
          },
          include: {
            product: {
              include: {
                options: true,
                manufacturer: true,
                category: true,
              },
            },
          },
        });
        
        res.status(200).json({ savedProducts });
      } catch (error) {
        console.error('Error fetching saved products:', error);
        res.status(500).json({ message: 'An error occurred while fetching saved products.' });
      }
  };


  // Remove a saved product for a user
  const removeSavedProduct = async (req, res) => {
      const { productId } = req.params;
      const userId = req.user.id;

      try {

        // Check if the saved product exists
        const savedProduct = await prisma.savedProduct.findUnique({
          where: {
            userId_productId: {
              userId: parseInt(userId),
              productId: parseInt(productId),
            },
          },
        });
    
        if (!savedProduct) {
          return res.status(404).json({ message: 'Saved product not found.' });
        }
    
        // Delete the saved product
        await prisma.savedProduct.delete({
          where: {
            userId_productId: {
              userId: parseInt(userId),
              productId: parseInt(productId),
            },
          },
        });
    
        res.status(200).json({ message: 'Saved product removed successfully.' });
      } catch (error) {
        console.error('Error removing saved product:', error);
        res.status(500).json({ message: 'An error occurred while removing the saved product.' });
      }
  };

export {
    ProductHandler,
    searchProducts,
    ProductCategories,
    createProduct,
    updateProduct,
    saveProduct,
    getSavedProducts,
    removeSavedProduct
}