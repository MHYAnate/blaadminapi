import prisma from '../prismaClient.js';

// Create new address
const createAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    const addressData = req.body;

    // Validate required fields
    if (!addressData.addressLine1 || !addressData.city || !addressData.stateProvince) {
      return res.status(400).json({ error: "Missing required address fields" });
    }

    // If setting as default, unset any existing default
    if (addressData.isDefault) {
      await prisma.address.updateMany({
        where: { userId: parseInt(userId), isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        ...addressData,
        userId: parseInt(userId),
      }
    });

    return res.status(201).json({
      message: "Address created successfully",
      data: address
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return res.status(500).json({ 
      error: "Failed to create address",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all addresses for a user
const getUserAddresses = async (req, res) => {
  try {
    const { userId } = req.params;

    const addresses = await prisma.address.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { isDefault: 'desc' } // Default addresses first
    });

    return res.status(200).json({
      message: "Addresses fetched successfully",
      data: addresses
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return res.status(500).json({ 
      error: "Failed to fetch addresses",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single address
const getAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: parseInt(id) }
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    return res.status(200).json({
      message: "Address fetched successfully",
      data: address
    });
  } catch (error) {
    console.error("Error fetching address:", error);
    return res.status(500).json({ 
      error: "Failed to fetch address",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update address
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If setting as default, unset any existing default for this user
    if (updateData.isDefault) {
      const address = await prisma.address.findUnique({
        where: { id: parseInt(id) }
      });
      
      if (address) {
        await prisma.address.updateMany({
          where: { 
            userId: address.userId, 
            isDefault: true,
            NOT: { id: parseInt(id) }
          },
          data: { isDefault: false }
        });
      }
    }

    const updatedAddress = await prisma.address.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    return res.status(200).json({
      message: "Address updated successfully",
      data: updatedAddress
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return res.status(500).json({ 
      error: "Failed to update address",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete address
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.address.delete({
      where: { id: parseInt(id) }
    });

    return res.status(200).json({
      message: "Address deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res.status(500).json({ 
      error: "Failed to delete address",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Set default address
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id: parseInt(id) }
    });

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Unset any existing default address for this user
    await prisma.address.updateMany({
      where: { 
        userId: address.userId, 
        isDefault: true,
        NOT: { id: parseInt(id) }
      },
      data: { isDefault: false }
    });

    // Set this address as default
    const updatedAddress = await prisma.address.update({
      where: { id: parseInt(id) },
      data: { isDefault: true }
    });

    return res.status(200).json({
      message: "Default address set successfully",
      data: updatedAddress
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return res.status(500).json({ 
      error: "Failed to set default address",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  createAddress,
  getUserAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
};