import prisma from "../prismaClient.js";
import { sendNotification } from "../services/notificationService.js";
import { randomBytes } from 'crypto';

// controllers/orderController.js

  // const createOrder = async (req, res) => {
  //   const userId = req.user.id;
  //   const { orderType = 'IMMEDIATE', scheduledDate } = req.body;

  //   try {

  //       // Get user with free shipping status
  //     const user = await prisma.user.findUnique({
  //       where: { id: userId },
  //       select: { 
  //         hasFreeShipping: true,
  //         referralBonus: {
  //           where: {
  //             bonusType: 'FREE_SHIPPING',
  //             isUsed: false,
  //             expiresAt: { gt: new Date() }
  //           },
  //           orderBy: { expiresAt: 'asc' },
  //           take: 1
  //         }
  //       }
  //     });

  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //     }

  //     // Validate orderType
  //     if (!['IMMEDIATE', 'SCHEDULED'].includes(orderType)) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "Invalid order type. Must be either 'IMMEDIATE' or 'SCHEDULED'",
  //         code: "INVALID_ORDER_TYPE"
  //       });
  //     }

  //     // Validate scheduling parameters
  //     if (orderType === 'SCHEDULED') {
  //       if (!scheduledDate) {
  //         return res.status(400).json({ 
  //           success: false,
  //           message: "Scheduled date is required for scheduled orders",
  //           code: "MISSING_SCHEDULED_DATE"
  //         });
  //       }
        
  //       const scheduledDateTime = new Date(scheduledDate);
  //       if (isNaN(scheduledDateTime.getTime())) {
  //         return res.status(400).json({ 
  //           success: false,
  //           message: "Invalid date format",
  //           code: "INVALID_DATE_FORMAT"
  //         });
  //       }
        
  //       if (scheduledDateTime <= new Date()) {
  //         return res.status(400).json({ 
  //           success: false,
  //           message: "Scheduled date must be in the future",
  //           currentTime: new Date().toISOString(),
  //           attemptedDate: scheduledDate,
  //           code: "PAST_SCHEDULED_DATE"
  //         });
  //       }
  //     }

  //     // Get user cart with items
  //     const cart = await prisma.cart.findUnique({
  //       where: { userId },
  //       include: {
  //         items: {
  //           include: {
  //             productOption: {
  //               include: {
  //                 product: true
  //               }
  //             }
  //           }
  //         }
  //       }
  //     });

  //     if (!cart || cart.items.length === 0) {
  //       return res.status(400).json({ 
  //         success: false,
  //         message: "No items in cart",
  //         code: "EMPTY_CART"
  //       });
  //     }

  //     // Calculate total price
  //     const totalPrice = cart.items.reduce(
  //       (sum, item) => sum + item.productOption.price * item.quantity, 0
  //     );

  //     // Create order data object
  //     const orderData = {
  //       userId,
  //       totalPrice,
  //       status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
  //       orderType,
  //       items: {
  //         create: cart.items.map(item => ({
  //           productId: item.productOption.productId,
  //           quantity: item.quantity,
  //           price: item.productOption.price,
  //           selectedOption: item.productOption.product.name,
  //         }))
  //       },
  //       timeline: {
  //         create: {
  //           action: 'ORDER_CREATED',
  //           status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
  //           details: orderType === 'SCHEDULED' ? { scheduledDate } : {}
  //         }
  //       }
  //     };

  //     // Add scheduledDate only if it's a scheduled order
  //     if (orderType === 'SCHEDULED') {
  //       orderData.scheduledDate = new Date(scheduledDate);
  //     }

  //     // Create order
  //     const order = await prisma.order.create({
  //       data: orderData,
  //       include: {
  //         items: true,
  //         timeline: true
  //       }
  //     });

  //     // Clear the cart
  //     await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

  //     // Return appropriate response
  //     return res.status(201).json({
  //       success: true,
  //       message: orderType === 'SCHEDULED' 
  //         ? "Order scheduled successfully" 
  //         : "Order created successfully. Proceed to payment",
  //       order: {
  //         id: order.id,
  //         status: order.status,
  //         totalPrice: order.totalPrice,
  //         orderType: order.orderType,
  //         ...(orderType === 'SCHEDULED' && { 
  //           scheduledDate: order.scheduledDate 
  //         })
  //       },
  //       paymentRequired: true
  //     });

  //   } catch (error) {
  //     console.error('Order creation error:', error);
  //     return res.status(500).json({ 
  //       success: false,
  //       message: "Failed to create order",
  //       error: error.message,
  //       code: "ORDER_CREATION_FAILED",
  //       ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  //     });
  //   }
  // };

  // const createOrder = async (req, res) => {
  //     const userId = req.user.id;
  //     const { orderType = 'IMMEDIATE', scheduledDate, distance } = req.body;
    
  //     try {
  //       // Get user with free shipping status
  //       const user = await prisma.user.findUnique({
  //         where: { id: userId },
  //         select: { 
  //           hasFreeShipping: true,
  //           referralBonus: {
  //             where: {
  //               bonusType: 'FREE_SHIPPING',
  //               isUsed: false,
  //               expiresAt: { gt: new Date() }
  //             },
  //             orderBy: { expiresAt: 'asc' },
  //             take: 1
  //           }
  //         }
  //       });
    
  //       if (!user) {
  //         return res.status(404).json({ message: "User not found" });
  //       }
    
  //       // Validate orderType
  //       if (!['IMMEDIATE', 'SCHEDULED'].includes(orderType)) {
  //         return res.status(400).json({ 
  //           message: "Invalid order type. Must be either 'IMMEDIATE' or 'SCHEDULED'"
  //         });
  //       }
    
  //       // Validate distance for shipping calculation
  //       if (!user.hasFreeShipping && !distance) {
  //         return res.status(400).json({ message: "Distance is required for shipping calculation" });
  //       }
    
  //       // Get user cart with items
  //       const cart = await prisma.cart.findUnique({
  //         where: { userId },
  //         include: {
  //           items: {
  //             include: {
  //               productOption: {
  //                 include: {
  //                   product: true
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       });
    
  //       if (!cart || cart.items.length === 0) {
  //         return res.status(400).json({ message: "No items in cart" });
  //       }
    
  //       // Calculate product total
  //       const productTotal = cart.items.reduce(
  //         (sum, item) => sum + item.productOption.price * item.quantity, 0
  //       );
    
  //       // Calculate total weight
  //       const totalWeight = cart.items.reduce(
  //         (sum, item) => sum + (item.productOption.product.weight * item.quantity), 0
  //       );
    
  //       // Calculate shipping fees (0 if user has free shipping)
  //       let shippingData = null;
  //       let shippingFee = 0;
        
  //       if (!user.hasFreeShipping) {
  //         // Calculate distance fee
  //         let distanceFee = 0;
  //         if (distance <= 10) {
  //           distanceFee = 1000;
  //         } else if (distance <= 30) {
  //           distanceFee = 2500;
  //         } else {
  //           distanceFee = 5000;
  //         }
    
  //         // Calculate weight fee
  //         let weightFee = 0;
  //         if (totalWeight <= 10) {
  //           weightFee = 500;
  //         } else if (totalWeight <= 50) {
  //           weightFee = 1500;
  //         } else {
  //           weightFee = 3000;
  //         }
    
  //         shippingFee = distanceFee + weightFee;
  //         shippingData = {
  //           distance,
  //           totalWeight,
  //           distanceFee,
  //           weightFee,
  //           totalShippingFee: shippingFee
  //         };
  //       }
    
  //       // Create order data object
  //       const orderData = {
  //         userId,
  //         totalPrice: productTotal + shippingFee,
  //         status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
  //         orderType,
  //         items: {
  //           create: cart.items.map(item => ({
  //             productId: item.productOption.productId,
  //             quantity: item.quantity,
  //             price: item.productOption.price,
  //             selectedOption: item.productOption.product.name,
  //             originalProductOptionId: item.productOptionId
  //           }))
  //         },
  //         timeline: {
  //           create: {
  //             action: 'ORDER_CREATED',
  //             status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
  //             details: orderType === 'SCHEDULED' ? { scheduledDate } : {}
  //           }
  //         },
  //         ...(shippingData && {
  //           shipping: {
  //             create: shippingData
  //           }
  //         })
  //       };
    
  //       // Add scheduledDate if it's a scheduled order
  //       if (orderType === 'SCHEDULED') {
  //         orderData.scheduledDate = new Date(scheduledDate);
  //       }
    
  //       // Create order in a transaction
  //       const order = await prisma.$transaction(async (tx) => {
  //         const newOrder = await tx.order.create({
  //           data: orderData,
  //           include: {
  //             items: true,
  //             timeline: true,
  //             shipping: true
  //           }
  //         });
    
  //         // Clear the cart
  //         await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    
  //         // Mark free shipping bonus as used if applicable
  //         if (user.hasFreeShipping && user.referralBonus.length > 0) {
  //           await tx.referralBonus.update({
  //             where: { id: user.referralBonus[0].id },
  //             data: { 
  //               isUsed: true,
  //               usedAt: new Date()
  //             }
  //           });
    
  //           // Check if user has any remaining free shipping bonuses
  //           const remainingBonuses = await tx.referralBonus.count({
  //             where: {
  //               userId,
  //               bonusType: 'FREE_SHIPPING',
  //               isUsed: false,
  //               expiresAt: { gt: new Date() }
  //             }
  //           });
    
  //           // Update user's free shipping status if no more bonuses
  //           if (remainingBonuses === 0) {
  //             await tx.user.update({
  //               where: { id: userId },
  //               data: { hasFreeShipping: false }
  //             });
  //           }
  //         }
    
  //         return newOrder;
  //       });
    
  //       return res.status(201).json({
  //         success: true,
  //         message: orderType === 'SCHEDULED' 
  //           ? "Order scheduled successfully" 
  //           : "Order created successfully. Proceed to payment",
  //         order: {
  //           id: order.id,
  //           status: order.status,
  //           totalPrice: order.totalPrice,
  //           shippingFee: order.shipping?.totalShippingFee || 0,
  //           hasFreeShipping: user.hasFreeShipping,
  //           orderType: order.orderType,
  //           ...(orderType === 'SCHEDULED' && { 
  //             scheduledDate: order.scheduledDate 
  //           })
  //         },
  //         paymentRequired: true
  //       });
    
  //     } catch (error) {
  //       console.error('Order creation error:', error);
  //       return res.status(500).json({ 
  //         message: "Failed to create order",
  //         error: error.message
  //       });
  //     }
  // };

  const createOrder = async (req, res) => {
      const userId = req.user.id;
      const { orderType = 'IMMEDIATE', scheduledDate, distance, shippingPaymentType = 'PAY_NOW' } = req.body;
    
      try {
        // Validate shipping payment type
        if (!['PAY_NOW', 'PAY_ON_DELIVERY'].includes(shippingPaymentType)) {
          return res.status(400).json({ 
            message: "Invalid shipping payment type. Must be either 'PAY_NOW' or 'PAY_ON_DELIVERY'" 
          });
        }

        // Get user with free shipping status
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            hasFreeShipping: true,
            referralBonus: {
              where: {
                bonusType: 'FREE_SHIPPING',
                isUsed: false,
                expiresAt: { gt: new Date() }
              },
              orderBy: { expiresAt: 'asc' },
              take: 1
            }
          }
        });
    
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
    
        // Validate orderType
        if (!['IMMEDIATE', 'SCHEDULED'].includes(orderType)) {
          return res.status(400).json({ 
            message: "Invalid order type. Must be either 'IMMEDIATE' or 'SCHEDULED'"
          });
        }
    
        // Validate distance for shipping calculation
        if (!user.hasFreeShipping && !distance) {
          return res.status(400).json({ message: "Distance is required for shipping calculation" });
        }
    
        // Get user cart with items
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
    
        if (!cart || cart.items.length === 0) {
          return res.status(400).json({ message: "No items in cart" });
        }
    
        // Calculate product total
        const productTotal = cart.items.reduce(
          (sum, item) => sum + item.productOption.price * item.quantity, 0
        );
    
        // Calculate total weight
        const totalWeight = cart.items.reduce(
          (sum, item) => sum + (item.productOption.weight * item.quantity), 0
        );
    
        // Calculate shipping fees (0 if user has free shipping)
        let shippingData = null;
        let shippingFee = 0;
        
        if (!user.hasFreeShipping) {
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
    
          shippingFee = distanceFee + weightFee;
          shippingData = {
            distance,
            totalWeight,
            distanceFee,
            weightFee,
            totalShippingFee: shippingFee,
            paymentType: shippingPaymentType
          };
        }
    
        // Calculate amounts based on shipping payment type
        let amountToPayNow = 0;
        if (shippingPaymentType === 'PAY_NOW') {
          amountToPayNow = productTotal + shippingFee;
        } else { // PAY_ON_DELIVERY
          amountToPayNow = shippingFee; // Only pay shipping now
        }

        // Create order data object
        const orderData = {
          userId,
          totalPrice: productTotal + shippingFee, // Total order value
          amountPaid: 0, // Will be updated when payment is made
          amountDue: amountToPayNow, // What needs to be paid now
          status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
          orderType,
          paymentStatus: 'PENDING',
          shippingPaymentType,
          items: {
            create: cart.items.map(item => ({
              productId: item.productOption.productId,
              quantity: item.quantity,
              price: item.productOption.price,
              selectedOption: item.productOption.product.name,
              originalProductOptionId: item.productOptionId,
              paymentStatus: shippingPaymentType === 'PAY_NOW' ? 'PAID' : 'PENDING' // Mark items as pending payment if shipping only
            }))
          },
          timeline: {
            create: {
              action: 'ORDER_CREATED',
              status: orderType === 'SCHEDULED' ? 'SCHEDULED' : 'PENDING',
              details: {
                scheduledDate: orderType === 'SCHEDULED' ? scheduledDate : undefined,
                shippingPaymentType
              }
            }
          },
          ...(shippingData && {
            shipping: {
              create: shippingData
            }
          })
        };
    
        // Add scheduledDate if it's a scheduled order
        if (orderType === 'SCHEDULED') {
          orderData.scheduledDate = new Date(scheduledDate);
        }

        // Start transaction
        // const order = await prisma.$transaction(async (prisma) => {
        //   try {
        //     // Create order
        //     const newOrder = await prisma.order.create({
        //       data: orderData,
        //       include: {
        //         items: true,
        //         timeline: true,
        //         shipping: true
        //       }
        //     });
        //     console.log("Order created:", newOrder);
            
        //     console.log("Clearing cart items for user:", cart.id );
        //     // Clear the cart

        //     await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

        //     // Mark free shipping bonus as used if applicable
        //     if (user.hasFreeShipping && user.referralBonus.length > 0) {
        //       await prisma.referralBonus.update({
        //         where: { id: user.referralBonus[0].id },
        //         data: { 
        //           isUsed: true,
        //           usedAt: new Date()
        //         }
        //       });

        //       // Check if user has any remaining free shipping bonuses
        //       const remainingBonuses = await prisma.referralBonus.count({
        //         where: {
        //           userId,
        //           bonusType: 'FREE_SHIPPING',
        //           isUsed: false,
        //           expiresAt: { gt: new Date() }
        //         }
        //       });

        //       // Update user's free shipping status if no more bonuses
        //       if (remainingBonuses === 0) {
        //         await prisma.user.update({
        //           where: { id: userId },
        //           data: { hasFreeShipping: false }
        //         });
        //       }
        //     }

        //     return newOrder;
        //   } catch (error) {
        //     console.error('Transaction error:', error);
        //     throw error; // This will trigger transaction rollback
        //   }
        // });

        // NEW: Implement transaction with proper error handling
        const order = await prisma.$transaction(async (tx) => {
            // 1. First create the order
            const newOrder = await tx.order.create({
                data: orderData,
                include: {
                    items: true,
                    timeline: true,
                    shipping: true
                }
            });

            // 2. Then delete cart items - use the SAME transaction client
            await tx.cartItem.deleteMany({
                where: { cartId: cart.id }
            });

            // 3. Handle referral bonuses if needed
            if (user.hasFreeShipping && user.referralBonus.length > 0) {
                await tx.referralBonus.update({
                    where: { id: user.referralBonus[0].id },
                    data: { 
                        isUsed: true,
                        usedAt: new Date()
                    }
                });

                const remainingBonuses = await tx.referralBonus.count({
                    where: {
                        userId,
                        bonusType: 'FREE_SHIPPING',
                        isUsed: false,
                        expiresAt: { gt: new Date() }
                    }
                });

                if (remainingBonuses === 0) {
                    await tx.user.update({
                        where: { id: userId },
                        data: { hasFreeShipping: false }
                    });
                }
            }

            return newOrder;
        }, {
            // Transaction options
            maxWait: 10000, // Default: 2000
            timeout: 10000 // Default: 5000
        });


        // Determine payment message based on shipping payment type
        let paymentMessage = "Order created successfully. Proceed to payment";
        if (shippingPaymentType === 'PAY_ON_DELIVERY') {
          paymentMessage = `Order created successfully. Pay ${shippingFee} now for shipping. Product payment (${productTotal}) will be collected on delivery`;
        } else if (user.hasFreeShipping) {
          paymentMessage = "Order created successfully with free shipping. Proceed to payment";
        }
    
        return res.status(201).json({
          success: true,
          message: orderType === 'SCHEDULED' 
            ? `Order scheduled successfully. ${paymentMessage}`
            : paymentMessage,
          order: {
            id: order.id,
            status: order.status,
            totalPrice: order.totalPrice,
            amountDue: order.amountDue,
            shippingFee: order.shipping?.totalShippingFee || 0,
            hasFreeShipping: user.hasFreeShipping,
            orderType: order.orderType,
            shippingPaymentType: order.shippingPaymentType,
            ...(orderType === 'SCHEDULED' && { 
              scheduledDate: order.scheduledDate 
            })
          },
          paymentRequired: amountToPayNow > 0
        });

        // 1. First create the order
        // const newOrder = await prisma.order.create({
        //     data: orderData,
        //     include: {
        //         items: true,
        //         timeline: true,
        //         shipping: true
        //     }
        // });

        // try {
        //     // 2. Delete cart items
        //     await prisma.cartItem.deleteMany({
        //         where: { cartId: cart.id }
        //     });

        //     // 3. Handle referral bonuses if needed
        //     if (user.hasFreeShipping && user.referralBonus.length > 0) {
        //         await prisma.referralBonus.update({
        //             where: { id: user.referralBonus[0].id },
        //             data: { 
        //                 isUsed: true,
        //                 usedAt: new Date()
        //             }
        //         });

        //         const remainingBonuses = await prisma.referralBonus.count({
        //             where: {
        //                 userId,
        //                 bonusType: 'FREE_SHIPPING',
        //                 isUsed: false,
        //                 expiresAt: { gt: new Date() }
        //             }
        //         });

        //         if (remainingBonuses === 0) {
        //             await prisma.user.update({
        //                 where: { id: userId },
        //                 data: { hasFreeShipping: false }
        //             });
        //         }
        //     }

        //     // Success response
        //     let paymentMessage = "Order created successfully. Proceed to payment";
        //     if (shippingPaymentType === 'PAY_ON_DELIVERY') {
        //         paymentMessage = `Order created successfully. Pay ${shippingFee} now for shipping. Product payment (${productTotal}) will be collected on delivery`;
        //     } else if (user.hasFreeShipping) {
        //         paymentMessage = "Order created successfully with free shipping. Proceed to payment";
        //     }
        
        //     return res.status(201).json({
        //         success: true,
        //         message: orderType === 'SCHEDULED' 
        //             ? `Order scheduled successfully. ${paymentMessage}`
        //             : paymentMessage,
        //         order: {
        //             id: newOrder.id,
        //             status: newOrder.status,
        //             totalPrice: newOrder.totalPrice,
        //             amountDue: newOrder.amountDue,
        //             shippingFee: newOrder.shipping?.totalShippingFee || 0,
        //             hasFreeShipping: user.hasFreeShipping,
        //             orderType: newOrder.orderType,
        //             shippingPaymentType: newOrder.shippingPaymentType,
        //             ...(orderType === 'SCHEDULED' && { 
        //                 scheduledDate: newOrder.scheduledDate 
        //             })
        //         },
        //         paymentRequired: amountToPayNow > 0
        //     });

        // } catch (cleanupError) {
        //     // If cart deletion or bonus handling fails, attempt to rollback by deleting the order
        //     await prisma.order.delete({ 
        //         where: { id: newOrder.id },
        //         include: { items: true, shipping: true } // Include related records to delete
        //     }).catch(deleteError => {
        //         console.error('Failed to rollback order creation:', deleteError);
        //     });

        //     console.error('Order cleanup failed:', cleanupError);
        //     return res.status(500).json({ 
        //         message: "Failed to complete order processing",
        //         error: cleanupError.message
        //     });
        // }

      } catch (error) {
        console.error('Order creation error:', error);
        return res.status(500).json({ 
          message: "Failed to create order",
          error: error.message
        });
      }
  };  

  // Get scheduled orders
  const getScheduledOrders = async (req, res) => {
    const userId = req.user.id;

    try {
      const orders = await prisma.order.findMany({
        where: {
          userId,
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          timeline: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          scheduledDate: 'asc'
        }
      });

      return res.status(200).json({
        success: true,
        orders
      });

    } catch (error) {
      console.error('Failed to fetch scheduled orders:', error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch scheduled orders",
        error: error.message
      });
    }
  };

  const getOrder = async (req, res) => {
    const { orderId } = req.params;

    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: { items: true },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order retrieved successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve order", error: error.message });
    }
  };

  const getAllOrder = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    try {
      // Fetch all orders for the user
      const orders = await prisma.order.findMany({
        where: { userId },
        include: { 
          items: {
            include:{
                product:true
            }
          }, // Include order items
          transactions: true, // Include payment transactions (if applicable)
        },
      });
  
      // If no orders are found, return a 404 response
      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found for this user" });
      }
  
      // Return the orders with a success message
      res.status(200).json({ message: "Orders retrieved successfully", orders });
    } catch (error) {
      // Handle errors
      res.status(500).json({ message: "Failed to retrieve orders", error: error.message });
    }
  };

  const scheduleOrder = async (req, res) => {
    const { orderId } = req.params;
    const { scheduledDate } = req.body;
  
    // Validate orderId
    const parsedOrderId = parseInt(orderId);
    if (isNaN(parsedOrderId)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid order ID" 
      });
    }
  
    // Validate and parse scheduledDate
    const parsedDate = new Date(scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SSZ)" 
      });
    }
  
    // Check if date is in the past
    const now = new Date();
    if (parsedDate < now) {
      return res.status(400).json({ 
        success: false,
        error: "Cannot schedule order in the past",
        currentTime: now.toISOString(),
        attemptedScheduleTime: parsedDate.toISOString()
      });
    }
  
    try {
      // First verify the order exists and get current status
      const existingOrder = await prisma.order.findUnique({
        where: { id: parsedOrderId },
        include: { user: { select: { id: true } } }
      });
  
      if (!existingOrder) {
        return res.status(404).json({ 
          success: false,
          error: "Order not found" 
        });
      }
  
      // Check if order can be scheduled (business logic)
      if (existingOrder.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          error: "Cannot schedule a cancelled order"
        });
      }
  
      const order = await prisma.order.update({
        where: { id: parsedOrderId },
        data: { 
          scheduledDate: parsedDate,
          status: 'SCHEDULED' 
        },
        include: { user: { select: { id: true } } }
      });
  
      // Create timeline entry
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          action: 'SCHEDULED',
          status: 'SCHEDULED',
          details: { 
            scheduledDate: order.scheduledDate.toISOString() 
          }
        }
      });
  
      // Send notification
      try {
        await sendNotification(order.user.id, "ORDER", {
          orderId: order.id,
          status: "scheduled",
          scheduledDate: order.scheduledDate.toISOString(),
        });
      } catch (notificationError) {
        console.error("Notification failed:", notificationError);
      }
  
      res.status(200).json({ 
        success: true,
        message: "Order scheduled successfully",
        data: {
          ...order,
          scheduledDate: order.scheduledDate.toISOString()
        }
      });
    } catch (error) {
      console.error("Error scheduling order:", error);
      res.status(500).json({ 
        success: false,
        error: "Failed to schedule order",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  const updateScheduledOrder = async (req, res) => {
    const { orderId } = req.params;
    const { newScheduledDate } = req.body;
    const userId = req.user.id; // Get the authenticated user's ID

    // Validate orderId
    const parsedOrderId = parseInt(orderId);
    if (isNaN(parsedOrderId)) {
        return res.status(400).json({ 
            success: false,
            error: "Invalid order ID",
            code: "INVALID_ORDER_ID"
        });
    }

    // Validate newScheduledDate exists
    if (!newScheduledDate) {
        return res.status(400).json({ 
            success: false,
            error: "New scheduled date is required",
            code: "MISSING_SCHEDULED_DATE"
        });
    }

    // Validate and parse newScheduledDate
    const parsedDate = new Date(newScheduledDate);
    if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
            success: false,
            error: "Invalid date format. Please use ISO format (YYYY-MM-DDTHH:MM:SSZ)",
            code: "INVALID_DATE_FORMAT"
        });
    }

    // Check if date is in the past
    const now = new Date();
    if (parsedDate < now) {
        return res.status(400).json({ 
            success: false,
            error: "Cannot reschedule order to the past",
            currentTime: now.toISOString(),
            attemptedScheduleTime: parsedDate.toISOString(),
            code: "PAST_SCHEDULED_DATE"
        });
    }

    try {
        // Verify the order exists, is scheduled, and belongs to the user
        const existingOrder = await prisma.order.findUnique({
            where: { id: parsedOrderId },
            include: { 
                user: { select: { id: true } },
                timeline: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (!existingOrder) {
            return res.status(404).json({ 
                success: false,
                error: "Order not found",
                code: "ORDER_NOT_FOUND"
            });
        }

        // Check if order belongs to the requesting user
        if (existingOrder.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: "Unauthorized to update this order",
                code: "UNAUTHORIZED_ACCESS"
            });
        }

        // Check if order is actually scheduled
        if (!existingOrder.scheduledDate || existingOrder.status !== 'SCHEDULED') {
            return res.status(400).json({
                success: false,
                error: "Order is not currently scheduled",
                currentStatus: existingOrder.status,
                code: "NOT_SCHEDULED_ORDER"
            });
        }

        // Check if the new date is different from the current one
        if (parsedDate.getTime() === new Date(existingOrder.scheduledDate).getTime()) {
            return res.status(400).json({
                success: false,
                error: "New scheduled date is the same as current date",
                code: "UNCHANGED_SCHEDULED_DATE"
            });
        }

        // Check if order can be rescheduled (not already processing/completed)
        if (['PROCESSING', 'COMPLETED'].includes(existingOrder.status)) {
            return res.status(400).json({
                success: false,
                error: `Cannot reschedule order with status: ${existingOrder.status}`,
                code: "INVALID_ORDER_STATUS"
            });
        }

        // Update the order with new scheduled date
        const order = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id: parsedOrderId },
                data: { 
                    scheduledDate: parsedDate,
                    timeline: {
                        create: {
                            action: 'RESCHEDULED',
                            status: 'SCHEDULED',
                            details: { 
                                previousScheduledDate: existingOrder.scheduledDate.toISOString(),
                                newScheduledDate: parsedDate.toISOString(),
                                changedBy: userId
                            }
                        }
                    }
                },
                include: { 
                    user: { select: { id: true, email: true, name: true } },
                    items: true
                }
            });

            return updatedOrder;
        });

        // Send notification
        try {
            await sendNotification(order.user.id, "ORDER_RESCHEDULED", {
                orderId: order.id,
                previousScheduledDate: existingOrder.scheduledDate.toISOString(),
                newScheduledDate: order.scheduledDate.toISOString(),
                items: order.items.map(item => ({
                    name: item.selectedOption,
                    quantity: item.quantity
                }))
            });

            // Optional: Send email notification
            await sendEmailNotification({
                to: order.user.email,
                subject: `Order #${order.id} Rescheduled`,
                template: 'order-rescheduled',
                data: {
                    userName: order.user.name,
                    orderId: order.id,
                    oldDate: formatDate(existingOrder.scheduledDate),
                    newDate: formatDate(order.scheduledDate),
                    items: order.items
                }
            });
        } catch (notificationError) {
            console.error("Notification failed:", notificationError);
            // Don't fail the whole request if notification fails
        }

        res.status(200).json({ 
            success: true,
            message: "Scheduled order updated successfully",
            data: {
                id: order.id,
                status: order.status,
                previousScheduledDate: existingOrder.scheduledDate.toISOString(),
                newScheduledDate: order.scheduledDate.toISOString(),
                updatedAt: order.updatedAt
            }
        });
    } catch (error) {
        console.error("Error updating scheduled order:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to update scheduled order",
            code: "INTERNAL_SERVER_ERROR",
            details: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : undefined
        });
    }
};


  const trackOrder = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
    try {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        select: { status: true, scheduledDate: true, updatedAt: true },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send a notification to the user
      await sendNotification(userId, "ORDER", {
        orderId: order.id,
        status: order.status,
      });
      
      res.status(200).json({ message: "Order tracking details retrieved", order });
    } catch (error) {
      res.status(500).json({ message: "Failed to track order", error: error.message });
    }
  };

  const generatePaymentLink = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id;
  
    try {
      // Verify the order exists and belongs to the user
      const order = await prisma.order.findFirst({
        where: {
          id: parseInt(orderId),
          userId: userId,
        },
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      });
  
      if (!order) {
        return res.status(404).json({ message: "Order not found or doesn't belong to you" });
      }
  
      // Check if order is already paid
      if (order.status === 'PAID' || order.status === 'PROCESSING') {
        return res.status(400).json({ message: "Order is already paid for" });
      }
  
      // Check if a payment link already exists and is still valid
      const existingLink = await prisma.paymentLink.findFirst({
        where: {
          orderId: order.id,
          expiresAt: { gt: new Date() },
          used: false
        }
      });
  
      if (existingLink) {
        return res.status(200).json({ 
          message: "Payment link already exists",
          paymentLink: `${process.env.FRONTEND_URL}/pay-for-me/${existingLink.token}`,
          status: order.status,
          expiresAt: existingLink.expiresAt
        });
      }
  
      // Create a unique token for the payment link
      const token = randomBytes(32).toString('hex');
  
      const EXPIRATION_MINUTES = process.env.LINK_EXPIRATION_MINUTES || 30;
      const expiresAt = new Date(Date.now() + EXPIRATION_MINUTES * 60 * 1000);
  
      // Create the payment link in database
      const paymentLink = await prisma.paymentLink.create({
        data: {
          orderId: order.id,
          token: token,
          expiresAt: expiresAt,
          createdBy: userId
        }
      });
  
      res.status(201).json({ 
        message: "Payment link generated successfully",
        paymentLink: `${process.env.FRONTEND_URL}/pay-for-me/${token}`,
        status: order.status,
        expiresAt: expiresAt
      });
  
    } catch (error) {
      res.status(500).json({ message: "Failed to generate payment link", error: error.message });
    }
  };
  
  const getPaymentLinkOrderDetails = async (req, res) => {
    const { token } = req.params;
  
    try {
      // Verify the payment link exists and is still valid
      const paymentLink = await prisma.paymentLink.findFirst({
        where: {
          token: token,
          expiresAt: { gt: new Date() },
          used: false
        },
        include: {
          order: {
            include: {
              items: {
                include: {
                  product: true
                }
              },
              user: {
                select: {
                  email: true,
                }
              }
            }
          }
        }
      });
  
      if (!paymentLink) {
        return res.status(404).json({ message: "Payment link not found or expired" });
      }
  
      res.status(200).json({ 
        message: "Order details retrieved",
        order: paymentLink.order,
        createdBy: paymentLink.createdBy,
        recipient: paymentLink.order.user
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Failed to get order details", 
        error: error.message 
      });
    }
  };
  


  const orderStatusStream = async (socket, orderId) => {
    try {
      // Validate input
      if (!orderId) {
        throw new Error('Order ID is required');
      }
  
      const parsedOrderId = parseInt(orderId);
      if (isNaN(parsedOrderId)) {
        throw new Error('Invalid order ID format');
      }
  
      // Verify order exists and user has permission
      const order = await prisma.order.findUnique({
        where: { id: parsedOrderId },
        select: { 
          id: true,
          userId: true,
          status: true,
          orderType: true,
          scheduledDate: true
        }
      });
  
      if (!order) {
        throw new Error(`Order ${parsedOrderId} not found`);
      }
  
      // Add authorization check (example implementation)
      if (order.userId !== socket.user?.id) {
        throw new Error('Unauthorized to track this order');
      }
  
      // Initial status payload
      const initialPayload = {
        orderId: order.id,
        status: order.status,
        orderType: order.orderType,
        ...(order.scheduledDate && { scheduledDate: order.scheduledDate }),
        timestamp: new Date().toISOString()
      };
  
      // Send initial status
      socket.emit('status_update', initialPayload);
  
      // Set up Prisma subscription for real-time updates
      const unsubscribe = prisma.$subscribe.order({
        where: {
          node: { id: parsedOrderId },
          updatedFields: { contains: ['status'] }
        }
      }).node().on('update', async (updatedOrder) => {
        const updatePayload = {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          timestamp: new Date().toISOString(),
          previousStatus: order.status // Include previous status for context
        };
  
        // Update local status reference
        order.status = updatedOrder.status;
  
        socket.emit('status_update', updatePayload);
  
        // Handle terminal states
        if (['PAID', 'COMPLETED', 'CANCELLED'].includes(updatedOrder.status)) {
          const completionPayload = {
            ...updatePayload,
            isFinal: true,
            message: `Order ${updatedOrder.status.toLowerCase()}`
          };
  
          socket.emit('status_complete', completionPayload);
          
          // Add slight delay before disconnecting
          setTimeout(() => {
            socket.disconnect(true);
          }, 500);
        }
      });
  
      // Heartbeat to keep connection alive
      const heartbeatInterval = setInterval(() => {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      }, 30000);
  
      // Enhanced cleanup handlers
      const cleanup = async () => {
        clearInterval(heartbeatInterval);
        try {
          await unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing:', err);
        }
      };
  
      socket.on('disconnect', cleanup);
      socket.on('error', (err) => {
        console.error('Socket error:', err);
        cleanup();
      });
  
      // Add ping/pong handler
      socket.on('ping', (cb) => {
        if (typeof cb === 'function') {
          cb();
        }
      });
  
    } catch (error) {
      console.error('Order tracking error:', error);
      
      const errorPayload = {
        message: 'Failed to track order',
        error: error.message,
        orderId,
        timestamp: new Date().toISOString()
      };
  
      socket.emit('error', errorPayload);
      
      // Delay disconnect to ensure error is delivered
      setTimeout(() => {
        socket.disconnect(true);
      }, 100);
    }
  };

  const getOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id; // Get the authenticated user's ID

    try {
      // Validate orderId
      const parsedOrderId = parseInt(orderId);
      if (isNaN(parsedOrderId)) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid order ID" 
        });
      }

      // Fetch the order status
      const order = await prisma.order.findUnique({
        where: { id: parsedOrderId },
        select: { status: true, scheduledDate: true, updatedAt: true },
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.status(200).json({ message: "Order status retrieved successfully", order });
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve order status", error: error.message });
    }
  }
export { 
  createOrder, 
  getScheduledOrders,
  getOrder, 
  scheduleOrder, 
  updateScheduledOrder, 
  trackOrder, 
  getAllOrder,
  generatePaymentLink,
  getPaymentLinkOrderDetails,
  orderStatusStream,
  getOrderStatus
};