import prisma from '../prismaClient.js';

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

const getManufacturesHandler = async (req, res) => {
    try {
        // Parse pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE;
        
        // Validate page size
        pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        
        // Calculate offset for pagination
        const skip = (page - 1) * pageSize;
        
        // Get total count for pagination metadata
        const totalCount = await prisma.manufacturer.count();
        
        const manufacturers = await prisma.manufacturer.findMany({
            skip,
            take: pageSize,
            orderBy: {
                name: 'asc' // Default sorting by name
            }
        });
        
        return res.status(200).json({
            message: "Manufacturers retrieved successfully",
            data: manufacturers,
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
        console.error("Error retrieving manufacturers:", error);
        
        return res.status(500).json({
            message: "An error occurred while retrieving manufacturers",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const createManufacturesHandler = async (req, res) => {
    const { name, country, logo } = req.body; 
    
    // Validate required fields
    if (!name) {
        return res.status(400).json({ error: 'Manufacturer name is required' });
    }
    if (!country) {
        return res.status(400).json({ error: 'Country is required' });
    }
    
    try {
        // Check if manufacturer with same name already exists
        const existingManufacturer = await prisma.manufacturer.findUnique({
            where: { name }
        });
        
        if (existingManufacturer) {
            return res.status(409).json({
                error: 'Manufacturer with this name already exists'
            });
        }
        
        // Create the manufacturer
        const manufacturer = await prisma.manufacturer.create({
            data: {
                name,
                country,
                logo: logo || null, // Make logo optional
            },
        });
        
        return res.status(201).json({
            message: 'Manufacturer created successfully',
            data: manufacturer
        });
    } catch (error) {
        console.error('Error creating manufacturer:', error);
        
        // Handle Prisma specific errors
        if (error.code === 'P2002') {
            return res.status(409).json({
                error: 'Manufacturer with this name already exists'
            });
        }
        
        return res.status(500).json({ 
            error: 'Failed to create manufacturer',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export { getManufacturesHandler, createManufacturesHandler };