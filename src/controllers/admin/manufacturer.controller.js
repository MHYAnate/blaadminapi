import prisma from "../../prismaClient.js";



const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;


const adminGetManufacturesHandler = async (req, res) => {
    try {
        // Parse pagination parameters
        const page = parseInt(req.query.page) || 1;
        let pageSize = parseInt(req.query.pageSize) || DEFAULT_PAGE_SIZE;
        pageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
        const skip = (page - 1) * pageSize;

        // Build filter conditions from query parameters
        const where = {};
        
        // Name filter (supports partial matches)
        if (req.query.name) {
            where.name = {
                contains: req.query.name,
                mode: 'insensitive' // Case-insensitive search
            };
        }
        
        // Country filter (exact match)
        if (req.query.country) {
            where.country = req.query.country;
        }
        
        // Date range filters (createdAt)
        if (req.query.createdAfter) {
            where.createdAt = {
                gte: new Date(req.query.createdAfter)
            };
        }
        if (req.query.createdBefore) {
            where.createdAt = {
                ...where.createdAt,
                lte: new Date(req.query.createdBefore)
            };
        }
        
        // Active status filter (if applicable)
        if (req.query.active !== undefined) {
            where.active = req.query.active === 'true';
        }

        // Get total count with applied filters
        const totalCount = await prisma.manufacturer.count({ where });

        // Get filtered manufacturers
        const manufacturers = await prisma.manufacturer.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [req.query.sortBy || 'name']: req.query.sortOrder || 'asc'
            },
            // Select specific fields if requested
            select: req.query.fields ? 
                req.query.fields.split(',').reduce((acc, field) => {
                    acc[field.trim()] = true;
                    return acc;
                }, {}) : undefined
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
            },
            filters: Object.keys(where).length > 0 ? where : undefined
        });
    } catch (error) {
        console.error("Error retrieving manufacturers:", error);
        return res.status(500).json({
            message: "An error occurred while retrieving manufacturers",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const adminGetProductsByManufacturerHandler = async (req, res) => {
    try {
        const { manufacturerId } = req.params;

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
            manufacturerId: manufacturerId
        };

        // Product name filter
        if (req.query.productName) {
            where.name = {
                contains: req.query.productName,
                mode: 'insensitive'
            };
        }

        // Price range filters
        if (req.query.minPrice) {
            where.price = {
                ...where.price,
                gte: parseFloat(req.query.minPrice)
            };
        }
        if (req.query.maxPrice) {
            where.price = {
                ...where.price,
                lte: parseFloat(req.query.maxPrice)
            };
        }

        // Category filter
        if (req.query.category) {
            where.category = req.query.category;
        }

        // Availability filter
        if (req.query.inStock !== undefined) {
            where.inventory = {
                gt: req.query.inStock === 'true' ? 0 : 0
            };
        }

        // Get total count with applied filters
        const totalCount = await prisma.product.count({ where });

        // Get filtered products
        const products = await prisma.product.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: {
                [req.query.sortBy || 'name']: req.query.sortOrder || 'asc'
            },
            include: {
                inventory: req.query.includeInventory === 'true'
            },
            select: req.query.fields ? 
                req.query.fields.split(',').reduce((acc, field) => {
                    acc[field.trim()] = true;
                    return acc;
                }, {}) : undefined
        });

        return res.status(200).json({
            message: `Products for manufacturer ${manufacturerId} retrieved successfully`,
            data: products,
            manufacturer: {
                id: manufacturerExists.id,
                name: manufacturerExists.name,
                logo: manufacturerExists.logo
            },
            pagination: {
                currentPage: page,
                pageSize: pageSize,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / pageSize),
                hasNextPage: (page * pageSize) < totalCount,
                hasPreviousPage: page > 1
            },
            filters: Object.keys(where).length > 1 ? where : undefined
        });

    } catch (error) {
        console.error("Error retrieving products by manufacturer:", error);
        return res.status(500).json({
            message: "An error occurred while retrieving products",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



const adminGetSingleManufacturerHandler = async (req, res) => {
    try {
        const { manufacturerId } = req.params;

        // Validate manufacturerId
        if (!manufacturerId) {
            return res.status(400).json({ 
                error: 'Manufacturer ID is required' 
            });
        }

        // Build query options
        const includeOptions = {};
        
        // Include products if requested
        if (req.query.includeProducts === 'true') {
            includeOptions.products = {
                take: parseInt(req.query.productsLimit) || 5,
                orderBy: {
                    [req.query.productsSortBy || 'name']: 
                    req.query.productsSortOrder || 'asc'
                },
                where: {
                    // Additional product filters if needed
                }
            };
        }

        // Include product count if requested
        if (req.query.includeProductCount === 'true') {
            includeOptions._count = {
                select: { products: true }
            };
        }

        // Get the manufacturer
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { id: manufacturerId },
            include: Object.keys(includeOptions).length > 0 ? 
                   includeOptions : undefined,
            select: req.query.fields ? 
                req.query.fields.split(',').reduce((acc, field) => {
                    acc[field.trim()] = true;
                    return acc;
                }, {}) : undefined
        });

        // Check if manufacturer exists
        if (!manufacturer) {
            return res.status(404).json({ 
                error: 'Manufacturer not found' 
            });
        }

        return res.status(200).json({
            message: 'Manufacturer retrieved successfully',
            data: manufacturer
        });

    } catch (error) {
        console.error("Error retrieving manufacturer:", error);
        return res.status(500).json({
            message: "An error occurred while retrieving the manufacturer",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


const adminCreateManufacturerHandler = async (req, res) => {
    const { 
        name, 
        country, 
        logo, 
        email, 
        phone, 
        contactPerson 
    } = req.body;

    // Validate required fields
    if (!name || !country || !logo || !email || !contactPerson) {
        return res.status(400).json({ 
            error: 'Missing required fields: name, country, logo, email, and contactPerson are required' 
        });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    try {
        // Check if manufacturer with same name or email already exists
        const existingManufacturer = await prisma.manufacturer.findFirst({
            where: {
                OR: [
                    { name },
                    { email }
                ]
            }
        });

        if (existingManufacturer) {
            const conflictField = existingManufacturer.name === name ? 'name' : 'email';
            return res.status(409).json({ 
                error: `Manufacturer with this ${conflictField} already exists` 
            });
        }

        // Create the manufacturer
        const manufacturer = await prisma.manufacturer.create({
            data: {
                name,
                country,
                logo,
                email,
                phone: phone || null, // Handle optional field
                contactPerson,
                status: false // Default status
            },
            select: { // Only return specific fields in response
                id: true,
                name: true,
                country: true,
                email: true,
                status: true,
                createdAt: true
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Manufacturer created successfully',
            data: manufacturer
        });

    } catch (error) {
        console.error('Error creating manufacturer:', error);
        
        // Handle Prisma specific errors
        if (error.code === 'P2002') {
            return res.status(400).json({ 
                error: 'Unique constraint violation - manufacturer with this name or email already exists' 
            });
        }

        return res.status(500).json({ 
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const adminUpdateManufacturerHandler = async (req, res) => {
    const { manufacturerId } = req.params;
    const { name, country, logo, email, phone, contactPerson, status } = req.body;

    try {
        // Validate input
        if (!manufacturerId) {
            return res.status(400).json({ error: 'Manufacturer ID is required' });
        }

        // Check if manufacturer exists
        const existingManufacturer = await prisma.manufacturer.findUnique({
            where: { id: parseInt(manufacturerId)}
        });

        if (!existingManufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Validate email format if provided
        if (email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
        }

        // Check for duplicate name or email
        if (name || email) {
            const duplicate = await prisma.manufacturer.findFirst({
                where: {
                    AND: [
                        { id: { not: parseInt(manufacturerId) } },
                        { OR: [
                            ...(name ? [{ name }] : []),
                            ...(email ? [{ email }] : [])
                        ]}
                    ]
                }
            });

            if (duplicate) {
                const conflictField = duplicate.name === name ? 'name' : 'email';
                return res.status(409).json({
                    error: `Manufacturer with this ${conflictField} already exists`
                });
            }
        }

        // Update manufacturer
        const updatedManufacturer = await prisma.manufacturer.update({
            where: { id: parseInt(manufacturerId) },
            data: {
                ...(name && { name }),
                ...(country && { country }),
                ...(logo && { logo }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(contactPerson && { contactPerson }),
                ...(status !== undefined && { status })
            },
            select: {
                id: true,
                name: true,
                country: true,
                email: true,
                status: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            message: 'Manufacturer updated successfully',
            data: updatedManufacturer
        });

    } catch (error) {
        console.error('Error updating manufacturer:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const adminDeleteManufacturerHandler = async (req, res) => {
    const { manufacturerId } = req.params;

    try {
        // Validate input
        if (!manufacturerId) {
            return res.status(400).json({ error: 'Manufacturer ID is required' });
        }

        // Check if manufacturer exists
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { id: Number(manufacturerId) },
            include: { _count: { select: { products: true } } }
        })

        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Prevent deletion if manufacturer has products
        if (manufacturer._count.products > 0) {
            return res.status(400).json({
                error: 'Cannot delete manufacturer with associated products',
                productCount: manufacturer._count.products
            });
        }

        // Delete manufacturer
        await prisma.manufacturer.delete({
            where: { id: Number(manufacturerId) }
        });

        return res.status(200).json({
            success: true,
            message: 'Manufacturer deleted successfully',
            deletedManufacturer: {
                id: manufacturer.id,
                name: manufacturer.name
            }
        });

    } catch (error) {
        console.error('Error deleting manufacturer:', error);
        
        // Handle foreign key constraint violation
        if (error.code === 'P2003') {
            return res.status(400).json({
                error: 'Cannot delete manufacturer with associated products'
            });
        }

        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const adminChangeManufacturerStatusHandler = async (req, res) => {
    const { manufacturerId } = req.params;
    const { status } = req.body;

    try {
        // Validate input
        if (!manufacturerId) {
            return res.status(400).json({ error: 'Manufacturer ID is required' });
        }
        
        if (typeof status !== 'boolean') {
            return res.status(400).json({ error: 'Status must be a boolean value' });
        }

        // Check if manufacturer exists
        const manufacturer = await prisma.manufacturer.findUnique({
            where: { id: Number(manufacturerId) }
        });

        if (!manufacturer) {
            return res.status(404).json({ error: 'Manufacturer not found' });
        }

        // Update status
        const updatedManufacturer = await prisma.manufacturer.update({
            where: { id: Number(manufacturerId) },
            data: { status },
            select: {
                id: true,
                name: true,
                status: true,
                updatedAt: true
            }
        });

        return res.status(200).json({
            success: true,
            message: `Manufacturer status ${status ? 'activated' : 'deactivated'} successfully`,
            data: updatedManufacturer
        });

    } catch (error) {
        console.error('Error changing manufacturer status:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


export {
    adminGetManufacturesHandler,
    adminCreateManufacturerHandler,
    adminGetSingleManufacturerHandler,
    adminGetProductsByManufacturerHandler,
    adminUpdateManufacturerHandler,
    adminDeleteManufacturerHandler,
    adminChangeManufacturerStatusHandler
  }