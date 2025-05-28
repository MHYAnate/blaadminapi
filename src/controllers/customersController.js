import prisma from "../prismaClient.js";

// List all customers
const listCustomers = async (req, res) => {
  try {
    const customers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        type: true, // Customer type (individual or business)
        isVerified: true, // Use this as the KYC status
        createdAt: true,
        profile: { // Fetch related UserProfile
          select: {
            fullName: true, // Use this as the name
          },
        },
        businessProfile: { // Fetch related BusinessProfile
          select: {
            businessName: true, // Use this as the name for business customers
          },
        },
        roles: { // Fetch related roles
          select: {
            role: {
              select: {
                name: true, // Role name
              },
            },
          },
        },
      },
    });

    // Format the response
    const formattedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.profile?.fullName || customer.businessProfile?.businessName || 'N/A',
      email: customer.email,
      customerType: customer.type,
      role: customer.roles[0]?.role.name || 'N/A',
      status: customer.isVerified ? 'Verified' : 'Not Verified',
      kyc: customer.isVerified ? 'Verified' : 'Pending',
      createdAt: customer.createdAt,
    }));

    return res.status(200).json({
      message: "Customers fetched successfully",
      data: formattedCustomers
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({ error: "Failed to fetch customers" });
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
      };
  
      return res.status(200).json(formattedCustomer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      return res.status(500).json({ error: "Failed to fetch customer" });
    }
  };

  // Get customer order history
const getCustomerOrderHistory = async (req, res) => {
    try {
      const { id } = req.params;
  
      // Fetch all orders for the customer
      const orders = await prisma.order.findMany({
        where: { userId: parseInt(id) },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
  
      // Categorize orders by status
      const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
      const ongoingOrders = orders.filter((order) => order.status === "PROCESSING" || order.status === "SHIPPED");
      const canceledOrders = orders.filter((order) => order.status === "CANCELLED");
  
      return res.status(200).json({
        message: "Customer order history fetched successfully",
        data: {
            deliveredOrders,
            ongoingOrders,
            canceledOrders,
            totalOrders: orders.length,
            orders
        }
      });
    } catch (error) {
      console.error("Error fetching customer order history:", error);
      return res.status(500).json({ error: "Failed to fetch customer order history" });
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

export { 
    listCustomers, 
    getCustomerById, 
    getCustomerOrderHistory, 
    getAllOrders 
};