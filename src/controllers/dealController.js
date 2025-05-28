import prisma from "../prismaClient.js";

const createDeal = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      value,
      startDate,
      endDate,
      productIds,
      categoryIds,
      banner
    } = req.body;

    // Validate required fields
    if (!name || !type || !value || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate productIds and categoryIds
    if (!Array.isArray(productIds) || !Array.isArray(categoryIds)) {
      return res.status(400).json({ error: "productIds and categoryIds must be arrays" });
    }

    // Create the deal
    const deal = await prisma.deal.create({
      data: {
        name,
        description,
        type,
        value,
        banner,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        products: {
          connect: productIds.map((id) => ({ id })),
        },
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
    });

    // Return the created deal
    return res.status(201).json({
      message: "Deal created successfully",
      data: deal,
    });
  } catch (error) {
    console.error("Error creating deal:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getProductWithDeals = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate productId
    if (!productId || isNaN(Number(productId))) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Fetch the product with active deals
    const product = await prisma.product.findUnique({
      where: { id: Number(productId) },
      include: {
        deals: {
          where: {
            startDate: { lte: new Date() }, // Deals that have started
            endDate: { gte: new Date() },   // Deals that haven't ended
          },
        },
      },
    });

    // If product not found
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Return the product with deals
    return res.status(200).json({
      message: "Product with deals fetched successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product with deals:", error);
    return res.status(500).json({ error: "Failed to fetch product with deals" });
  }
};

const getCategoryWithDeals = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate categoryId
    if (!categoryId || isNaN(Number(categoryId))) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Fetch the category with active deals
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
      include: {
        deals: {
          where: {
            startDate: { lte: new Date() }, // Deals that have started
            endDate: { gte: new Date() },   // Deals that haven't ended
          },
        },
      },
    });

    // If category not found
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return the category with deals
    return res.status(200).json({
      message: "Category with deals fetched successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error fetching category with deals:", error);
    return res.status(500).json({ error: "Failed to fetch category with deals" });
  }
};

const getDeals = async (req, res) => {
  try {
    // Fetch active deals
    const deals = await prisma.deal.findMany({
      where: {
        isActive: true,
      },
      include: {
        products: true,   
        categories: true,
      },
    });

    // If no deals found
    if (deals.length === 0) {
      return res.status(404).json({ error: "No active deals found" });
    }

    // Return the list of active deals
    return res.status(200).json({
      message: "Active deals fetched successfully",
      data: deals,
    });
  } catch (error) {
    console.error("Error fetching deals:", error);
    return res.status(500).json({ error: "Failed to fetch deals" });
  }
};

export { createDeal, getProductWithDeals, getCategoryWithDeals, getDeals };

