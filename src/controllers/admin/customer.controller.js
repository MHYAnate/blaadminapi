  import prisma from "../../prismaClient.js";

  // List all customers
  const listCustomers = async (req, res) => {
    try {
      // Parse pagination parameters from query string
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.pageSize) || parseInt(req.query.limit) || 10;

      const skip = (page - 1) * limit;

      // Parse filter parameters
      const { type, status, search } = req.query;
      
      // Build where clause for filters
      const where = {};
      
      if (type) {
        where.type = type; // Filter by customer type (individual/business)
      }
      
      if (status) {
        // Convert status string to boolean for isVerified
        if (status.toLowerCase() === 'verified') {
          where.isVerified = true;
        } else if (status.toLowerCase() === 'not verified') {
          where.isVerified = false;
        }
      }

      // Implement search functionality
      if (search) {
        where.OR = [
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            profile: {
              fullName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            businessProfile: {
              businessName: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ];
      }

      // Get total count of customers (with filters applied)
      const totalCount = await prisma.user.count({ where });

      // Calculate total pages
      const totalPages = Math.ceil(totalCount / limit);

      // Fetch paginated customers (with filters applied)
      const customers = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          type: true, 
          isVerified: true, 
          createdAt: true,
          profile: { 
            select: {
              fullName: true,
            },
          },
          businessProfile: { 
            select: {
              businessName: true, 
            },
          },
          roles: { 
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Default sorting by newest first
        },
      });

      // Format the response
      const formattedCustomers = customers.map((customer) => ({
        id: customer.id,
        name: customer.profile?.fullName || customer.businessProfile?.businessName || '',
        email: customer.email,
        customerType: customer.type,
        role: customer.roles[0]?.role.name || '',
        status: customer.isVerified ? 'Verified' : 'Not Verified',
        kyc: customer.isVerified ? 'Verified' : 'Pending',
        createdAt: customer.createdAt,
      }));

      return res.status(200).json({
        message: "Customers fetched successfully",
        data: formattedCustomers,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
      return res.status(500).json({ 
        error: "Failed to fetch customers",
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message 
        })
      });
    }
  };

  // Get customer by ID
  const getCustomerById = async (req, res) => {
    try {
      const { id } = req.params;

      const customer = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          type: true,
          isVerified: true,
          createdAt: true,
          profile: {
            select: {
              fullName: true,
            },
          },
          businessProfile: {
            select: {
              businessName: true,
            },
          },
          roles: {
            select: {
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          addresses: { 
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
              addressLine1: true,
              addressLine2: true,
              city: true,
              stateProvince: true,
              postalCode: true,
              country: true,
              isDefault: true,
              addressType: true,
              createdAt: true,
              updatedAt: true
            },
            orderBy: {
              isDefault: 'desc' // Default addresses first
            }
          },
        },
      });

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }

      // Format the response
      const formattedCustomer = {
        id: customer.id,
        name: customer.profile?.fullName || customer.businessProfile?.businessName || 'N/A',
        email: customer.email,
        customerType: customer.type,
        role: customer.roles[0]?.role.name || 'N/A',
        status: customer.isVerified ? 'Verified' : 'Not Verified',
        kyc: customer.isVerified ? 'Verified' : 'Pending',
        createdAt: customer.createdAt,
        addresses: customer.addresses // Include addresses in response
      };

      return res.status(200).json({
        message: "Customer fetched successfully",
        data: formattedCustomer  // Return the formatted customer with addresses
      });
    } catch (error) {
      console.error("Error fetching customer:", error);
      return res.status(500).json({ 
        error: "Failed to fetch customer",
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message 
        })
      });
    }
  };

  // Get customer order history
  const getCustomerOrderHistory = async (req, res) => {
      try {
        const { id } = req.params;

        // Validate customer ID
        const customerId = parseInt(id);
        if (isNaN(customerId)) {
          return res.status(400).json({
            success: false,
            error: "Invalid customer ID format"
          });
        }

        // Check if customer exists
        const customerExists = await prisma.user.findUnique({
          where: { id: customerId },
          select: { id: true }
        });

        if (!customerExists) {
          return res.status(404).json({
            success: false,
            error: "Customer not found"
          });
        }

        // Fetch orders with detailed information
        const orders = await prisma.order.findMany({
          where: { 
            userId: customerId
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    category: true,
                    manufacturer: true
                  }
                }
              }
            },
            shipping: true,
            transactions: true,
            timeline: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 5
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Calculate product counts by status
        const statusCounts = {
          PENDING: 0,
          PROCESSING: 0,
          SHIPPED: 0,
          DELIVERED: 0,
          CANCELLED: 0,
          SCHEDULED: 0
        };

        orders.forEach(order => {
          const productCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          statusCounts[order.status] += productCount;
        });

        // Calculate summary statistics
        const summary = {
          totalOrders: orders.length,
          totalProducts: orders.reduce((sum, order) => sum + 
            order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
          totalSpent: orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0),
          firstOrderDate: orders.length > 0 
            ? new Date(Math.min(...orders.map(o => new Date(o.createdAt)))) 
            : null,
          lastOrderDate: orders.length > 0 
            ? new Date(Math.max(...orders.map(o => new Date(o.createdAt)))) 
            : null,
          productCounts: statusCounts,
          orderCounts: {
            PENDING: orders.filter(o => o.status === 'PENDING').length,
            PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
            SHIPPED: orders.filter(o => o.status === 'SHIPPED').length,
            DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
            CANCELLED: orders.filter(o => o.status === 'CANCELLED').length,
            SCHEDULED: orders.filter(o => o.status === 'SCHEDULED').length
          }
        };

        // Format response data
        const formattedOrders = orders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalPrice: order.totalPrice,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          items: order.items.map(item => ({
            id: item.id,
            productId: item.productId,
            productName: item.product.name,
            category: item.product.category?.name || null,
            manufacturer: item.product.manufacturer?.name || null,
            quantity: item.quantity,
            price: item.price
          })),
          shipping: order.shipping,
          transactions: order.transactions,
          latestTimeline: order.timeline[0] // Most recent timeline entry
        }));

        return res.status(200).json({
          success: true,
          message: "Customer order history retrieved successfully",
          data: {
            customerId,
            summary,
            orders: formattedOrders
          }
        });

      } catch (error) {
        console.error("Error fetching customer order history:", error);
        return res.status(500).json({
          success: false,
          error: "Failed to fetch customer order history",
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
  };

  // Get all orders
  const getAllOrders = async (req, res) => {
        try {
        const orders = await prisma.order.findMany({
            include: {
            user: {
                select: {
                id: true,
                email: true,
                },
            },
            items: {
                include: {
                product: true,
                },
            },
            },
        });
    
        return res.status(200).json(orders);
        } catch (error) {
        console.error("Error fetching orders:", error);
        return res.status(500).json({ error: "Failed to fetch orders" });
        }
  };

  const downloadCustomers = async (req, res) => {
      try {
        // Parse filter parameters
        const { type, status, search } = req.query;
        
        // Build where clause (same as listCustomers)
        const where = {};
        
        if (type && ['INDIVIDUAL', 'BUSINESS'].includes(type.toUpperCase())) {
          where.type = type.toUpperCase();
        }
        
        if (status) {
          if (status.toLowerCase() === 'verified') {
            where.isVerified = true;
          } else if (status.toLowerCase() === 'not verified') {
            where.isVerified = false;
          }
        }
    
        if (search) {
          where.OR = [
            { email: { contains: search, mode: 'insensitive' } },
            { profile: { isNot: null, fullName: { contains: search, mode: 'insensitive' } } },
            { businessProfile: { isNot: null, businessName: { contains: search, mode: 'insensitive' } } }
          ];
        }
    
        // Fetch all customers matching filters
        const customers = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            type: true,
            isVerified: true,
            createdAt: true,
            profile: { select: { fullName: true } },
            businessProfile: { select: { businessName: true } },
            roles: { select: { role: { select: { name: true } } } },
          },
          orderBy: { createdAt: 'desc' },
        });
    
        // Format data for Excel
        const excelData = customers.map(customer => ({
          'ID': customer.id,
          'Name': customer.profile?.fullName || customer.businessProfile?.businessName || '',
          'Email': customer.email,
          'Type': customer.type,
          'Role': customer.roles[0]?.role.name || '',
          'Status': customer.isVerified ? 'Verified' : 'Not Verified',
          'KYC Status': customer.isVerified ? 'Verified' : 'Pending',
          'Created At': customer.createdAt,
        }));
    
        // Create Excel workbook
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Customers');
        
        // Add headers
        worksheet.columns = [
          { header: 'ID', key: 'ID', width: 10 },
          { header: 'Name', key: 'Name', width: 25 },
          { header: 'Email', key: 'Email', width: 30 },
          { header: 'Type', key: 'Type', width: 15 },
          { header: 'Role', key: 'Role', width: 15 },
          { header: 'Status', key: 'Status', width: 15 },
          { header: 'KYC Status', key: 'KYC Status', width: 15 },
          { header: 'Created At', key: 'Created At', width: 20 },
        ];
    
        // Add data rows
        worksheet.addRows(excelData);
    
        // Set response headers
        res.setHeader(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
          'Content-Disposition',
          'attachment; filename=customers.xlsx'
        );
    
        // Send the Excel file
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error("Error generating Excel file:", error);
        return res.status(500).json({ 
          error: "Failed to generate customer report",
          ...(process.env.NODE_ENV === 'development' && {
            details: error.message 
          })
        });
      }
  };

export { 
    listCustomers, 
    getCustomerById, 
    getCustomerOrderHistory, 
    getAllOrders 
};