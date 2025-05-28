  import e from "cors";
import prisma from "../prismaClient.js";
import { sendNotification } from "../services/notificationService.js";


  const  addToCart = async (req, res) => {
      const { productOptionId, quantity } = req.body;
      const userId = req.user.id;

      try {
        // Find or create the user's cart
        let cart = await prisma.cart.findUnique({
          where: { userId },
        });
    
        if (!cart) {
          cart = await prisma.cart.create({
            data: { userId },
          });
        }
    
        // Check if the item already exists in the cart
        const existingItem = await prisma.cartItem.findFirst({
          where: { cartId: cart.id, productOptionId },
        });
    
        if (existingItem) {
          // Update the quantity if the item already exists
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
          });
        } else {
          // Add a new item to the cart
          await prisma.cartItem.create({
            data: { cartId: cart.id, productOptionId, quantity },
          });
        }

        // Send a notification to the user
        const productOption = await prisma.productOption.findUnique({
          where: { id: productOptionId },
          include: { product: true },
        });

        await sendNotification(userId, "CART", {
          action: "item_added",
          productName: productOption.product.name,
          quantity,
        });
    
        res.status(200).json({ message: "Item added to cart" });
      } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Failed to add item to cart", error });
      }
  }

  const updateCartItem = async (req, res) => {
    const { cartItemId, quantity } = req.body;
    const userId = req.user.id;

    try {
        
      const cartItem = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { quantity },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });
  
      // Send a notification to the user
      await sendNotification(userId, "CART", {
        action: "item_updated",
        productName: cartItem.productOption.product.name,
        quantity,
      });

      res.status(200).json({ message: "Cart item updated" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Failed to update cart item", error });
    }
  }

  const removeFromCart = async (req, res) => {
    const { cartItemId } = req.body;
  
    // Validate input
    if (!cartItemId) {
      return res.status(400).json({ 
        success: false,
        error: "cartItemId is required" 
      });
    }
  
    try {
      // First verify the cart item exists and get cart info
      const existingItem = await prisma.cartItem.findUnique({
        where: { id: cartItemId },
        include: {
          cart: {
            select: { userId: true }
          },
          productOption: {
            include: {
              product: {
                select: { name: true }
              }
            }
          }
        }
      });
  
      if (!existingItem) {
        return res.status(404).json({ 
          success: false,
          message: "Item not found in cart" 
        });
      }
  
      // Now delete the item
      await prisma.cartItem.delete({
        where: { id: cartItemId }
      });
  
      // Send notification
      try {
        await sendNotification(existingItem.cart.userId, "CART", {
          action: "item_removed",
          productName: existingItem.productOption.product.name,
        });
      } catch (notificationError) {
        console.error("Notification failed:", notificationError);
        // Continue even if notification fails
      }
  
      res.status(200).json({ 
        success: true,
        message: "Item removed from cart successfully" 
      });
  
    } catch (error) {
      console.error("Error removing cart item:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to remove item from cart",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  const getCart = async (req, res) => {
    const userId  = req.user.id;
  
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId: parseInt(userId) },
        include: {
          items: {
            include: {
              productOption: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
      });
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      res.status(200).json(cart);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  }

  const addNote = async (req, res) => {
    const userId = req.user.id;
    const { cartItemId, note } = req.body;
  
    // Validate input
    if (!cartItemId || isNaN(Number(cartItemId))) {
      return res.status(400).json({ message: "Invalid cartItemId" });
    }
    if (!note || typeof note !== "string") {
      return res.status(400).json({ message: "Invalid note" });
    }
  
    try {
      // Find the user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true },
      });
  
      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }
  
      // Find the specific cart item
      const cartItem = await prisma.cartItem.findUnique({
        where: { id: Number(cartItemId) },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });
  
      if (!cartItem || cartItem.cartId !== cart.id) {
        return res.status(404).json({ message: "Cart item not found" });
      }
  
      // Update the cart item with the new note
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: Number(cartItemId) },
        data: { note },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });
  
      // Send a notification to the user
      await sendNotification(userId, "CART", {
        action: "note_added",
        productName: updatedCartItem.productOption.product.name,
        note,
      });
  
      return res.status(200).json({
        message: "Note added successfully",
        cartItem: updatedCartItem,
      });
    } catch (error) {
      console.error("Error adding note:", error);
      return res.status(500).json({ message: "Internal server error", details: error.message });
    }
  };

  const updateNote = async (req, res) => {
    const userId = req.user.id;
    const { cartItemId, note } = req.body; 
  
    if (!cartItemId || !note) {
      return res.status(400).json({ message: 'cartItemId and note are required' });
    }
  
    try {
      // Find the user's cart
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }, 
      });
  
      if (!cart) {
        return res.status(404).json({ message: 'Cart not found' });
      }
  
      // Find the specific cart item
      const cartItem = cart.items.find((item) => item.id === cartItemId);
  
      if (!cartItem) {
        return res.status(404).json({ message: 'Cart item not found' });
      }
  
      // Update the cart item with the new note
      const updatedCartItem = await prisma.cartItem.update({
        where: { id: cartItemId },
        data: { note },
        include: {
          productOption: {
            include: {
              product: true,
            },
          },
        },
      });

      // Send a notification to the user
      await sendNotification(userId, "CART", {
        action: "note_updated",
        productName: updatedCartItem.productOption.product.name,
        note,
      });
    
      return res.status(200).json({
        message: 'Note updated successfully',
        cartItem: updatedCartItem,
      });

    } catch (error) {
      console.error('Error updating note:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };

export {
    addToCart,
    updateCartItem,
    removeFromCart,
    getCart,
    addNote,
    updateNote
}