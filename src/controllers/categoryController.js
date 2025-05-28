import prisma from "../prismaClient.js";


const createCategoryHandler = async (req, res) => {
    const { name } = req.body;
  
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
  
    try {
      // Check if a category with the same name already exists
      const existingCategory = await prisma.category.findFirst({
        where: { name },
      });
  
      if (existingCategory) {
        return res.status(400).json({ error: 'Category with this name already exists' });
      }
  
      // Create the category in the database
      const category = await prisma.category.create({
        data: {
          name,
        },
      });
  
      return res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  };

export { createCategoryHandler };