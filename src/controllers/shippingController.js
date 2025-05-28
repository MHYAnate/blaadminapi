import prisma from "../prismaClient.js";

const calculateShippingFee = async (req, res) => {
    const { distance } = req.body;
    const userId = req.user.id; // Assuming user is authenticated and ID is available
    
    try {
        // Validate required fields
        if (!distance) {
            return res.status(400).json({ error: "Distance is required" });
        }

        // Check if user has free shipping
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { hasFreeShipping: true }
        });

        if (user?.hasFreeShipping) {
            return res.status(200).json({
                message: "Free shipping applied",
                rate: 0,
                details: {
                    distance,
                    totalWeight: 0,
                    distanceFee: 0,
                    weightFee: 0,
                    isFreeShipping: true
                },
            });
        }

        // Fetch the user's cart with cart items and product details
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        productOption: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        // If cart not found or empty
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.status(404).json({ error: "Cart is empty or not found" });
        }

        // Calculate total weight of the cart
        let totalWeight = 0;
        for (const item of cart.items) {
            if (!item.productOption?.weight || !item.quantity) {
                return res.status(400).json({ 
                    error: `Invalid product or quantity for item: ${item.id}` 
                });
            }
            totalWeight += item.productOption.weight * item.quantity;
        }

        // Calculate distance fee
        let distanceFee = 0;
        if (distance <= 10) {
            distanceFee = 1000;
        } else if (distance <= 30) {
            distanceFee = 2500;
        } else {
            distanceFee = 5000;
        }

        // Calculate weight fee
        let weightFee = 0;
        if (totalWeight <= 10) {
            weightFee = 500;
        } else if (totalWeight <= 50) {
            weightFee = 1500;
        } else {
            weightFee = 3000;
        }

        // Calculate total shipping fee
        const totalShippingFee = distanceFee + weightFee;

        // Return the estimated shipping fee
        return res.status(200).json({
            message: "Shipping fee estimated successfully",
            rate: totalShippingFee,
            details: {
                distance,
                totalWeight,
                distanceFee,
                weightFee,
                isFreeShipping: false
            },
        });

    } catch (error) {
        console.error("Error estimating shipping fee:", error);
        return res.status(500).json({ error: "Failed to estimate shipping fee" });
    }
};

// Fetch shipping details for an order
const getShippingDetails = async (req, res) => {
  const { orderId } = req.params;

  try {
    // Validate orderId
    if (!orderId || isNaN(Number(orderId))) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // Fetch shipping details
    const shipping = await prisma.shipping.findUnique({
      where: { orderId: Number(orderId) },
    });

    // If shipping details not found
    if (!shipping) {
      return res.status(404).json({ error: "Shipping details not found" });
    }

    // Return the shipping details
    return res.status(200).json(shipping);
  } catch (error) {
    console.error("Error fetching shipping details:", error);
    return res.status(500).json({ error: "Failed to fetch shipping details" });
  }
};

export { calculateShippingFee, getShippingDetails };