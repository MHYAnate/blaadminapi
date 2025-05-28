import paystack from "paystack";
import prisma from "../prismaClient.js";
import { sendNotification } from "../services/notificationService.js";

const paystackClient = paystack(process.env.PAYSTACK_SECRET_TEST_KEY);

/**
 * Initialize Paystack payment
 */
const initializePayment = async (req, res) => {
  const { orderId, email, amount } = req.body;

  // Validate required fields
  if (!orderId || !email || !amount) {
    return res.status(400).json({ message: "Missing required fields: orderId, email, or amount" });
  }

  try {
    // Verify the order exists
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Convert amount to kobo (Paystack uses kobo as the smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    // Initialize Paystack payment
    const response = await paystackClient.transaction.initialize({
      email,
      amount: amountInKobo,
      reference: `order_${orderId}_${Date.now()}`, // Unique reference for the transaction
      metadata: {
        orderId,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId,
          },
        ],
      },
    });



    // Save the transaction in the database
    await prisma.transaction.create({
      data: {
        orderId,
        amount,
        reference: response.data.reference,
        status: "pending",
      },
    });

    res.status(200).json({
      message: "Payment initialized",
      authorizationUrl: response.data.authorization_url,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to initialize payment", error: error.message });
  }
};

/**
 * Verify Paystack payment
 */
// const verifyPayment = async (req, res) => {
//   const { reference } = req.body;

//   try {
//     // Verify the payment with Paystack
//     const response = await paystackClient.transaction.verify(reference);

//     if (response.data.status !== "success") {
//       return res.status(400).json({ message: "Payment failed or not completed" });
//     }

//     // Update the transaction status in the database
//     const transaction = await prisma.transaction.update({
//       where: { reference },
//       data: { status: "success" },
//       include: {
//         order: {
//           include: {
//             user: true
//           }
//         }
//       }
//     });

//     // Update the order status to "PAID" or "PROCESSING"
//     await prisma.order.update({
//       where: { id: transaction.orderId },
//       data: { status: "PROCESSING" },
//     });

//     // If this was a "Pay for Me" payment, mark the payment link as used
//     if (transaction.paymentLinkToken) {
//       await prisma.paymentLink.update({
//         where: { token: transaction.paymentLinkToken },
//         data: { used: true, usedAt: new Date() }
//       });

//       // Send notification to the original order creator
//       await sendNotification(transaction.order.userId, "PAYMENT", {
//         orderId: transaction.order.id,
//         status: "paid_by_friend",
//         amount: transaction.amount,
//         payerEmail: transaction.payerEmail
//       });
//     }

//     // Send regular payment confirmation notification
//     await sendNotification(transaction.order.userId, "ORDER", {
//       orderId: transaction.order.id,
//       status: "payment_completed",
//       amount: transaction.amount
//     });

//     res.status(200).json({ message: "Payment verified successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to verify payment", error: error.message });
//   }
// };

// const verifyPayment = async (req, res) => {
//   const { reference } = req.body;

//   try {
//     // Verify the payment with Paystack
//     const response = await paystackClient.transaction.verify(reference);

//     if (response.data.status !== "success") {
//       return res.status(400).json({ message: "Payment failed or not completed" });
//     }

//     // Update the transaction status in the database
//     const transaction = await prisma.transaction.update({
//       where: { reference },
//       data: { 
//         status: "success",
//         // Add gateway information if needed
//         gateway: "paystack" 
//       },
//       include: {
//         order: {
//           include: {
//             user: true
//           }
//         }
//       }
//     });

//     // Update the order with payment details
//     const updatedOrder = await prisma.order.update({
//       where: { id: transaction.orderId },
//       data: { 
//         status: "PROCESSING",
//         paymentStatus: "PAID",
//         amountPaid: transaction.amount, // Set amountPaid to the transaction amount
//         // If you want to reduce amountDue to 0 after payment:
//         amountDue: 0 
//       },
//       include: {
//         transactions: true,
//         items: true
//       }
//     });

//     // If this was a "Pay for Me" payment, mark the payment link as used
//     if (transaction.paymentLinkToken) {
//       await prisma.paymentLink.update({
//         where: { token: transaction.paymentLinkToken },
//         data: { used: true, usedAt: new Date() }
//       });

//       // Send notification to the original order creator
//       await sendNotification(transaction.order.userId, "PAYMENT", {
//         orderId: transaction.order.id,
//         status: "paid_by_friend",
//         amount: transaction.amount,
//         payerEmail: transaction.payerEmail
//       });
//     }

//     // Send regular payment confirmation notification
//     await sendNotification(transaction.order.userId, "ORDER", {
//       orderId: transaction.order.id,
//       status: "payment_completed",
//       amount: transaction.amount
//     });

//     res.status(200).json({ 
//       message: "Payment verified successfully",
//       order: updatedOrder // Optionally return the updated order
//     });
//   } catch (error) {
//     res.status(500).json({ message: "Failed to verify payment", error: error.message });
//   }
// };

const verifyPayment = async (req, res) => {
  const { reference } = req.body;

  try {
    // Verify the payment with Paystack
    const response = await paystackClient.transaction.verify(reference);

    if (response.data.status !== "success") {
      return res.status(400).json({ message: "Payment failed or not completed" });
    }

    // Update the transaction status in the database
    const transaction = await prisma.transaction.update({
      where: { reference },
      data: { 
        status: "success",
        gateway: "paystack" 
      },
      include: {
        order: {
          include: {
            user: true,
            items: true
          }
        }
      }
    });

    // Update the order with payment details
    const updatedOrder = await prisma.order.update({
      where: { id: transaction.orderId },
      data: { 
        status: "PROCESSING",
        paymentStatus: "PAID",
        amountPaid: transaction.amount,
        amountDue: 0 
      }
    });

    // Create payment timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: transaction.orderId,
        action: "PAYMENT_RECEIVED",
        status: "PROCESSING",
        details: {
          amount: transaction.amount,
          reference: transaction.reference,
          paymentMethod: "Paystack",
          items: transaction.order.items.map(item => ({
            productId: item.productId,
            productName: item.selectedOption,
            quantity: item.quantity,
            price: item.price
          }))
        }
      }
    });

    // If this was a "Pay for Me" payment
    if (transaction.paymentLinkToken) {
      await prisma.paymentLink.update({
        where: { token: transaction.paymentLinkToken },
        data: { used: true, usedAt: new Date() }
      });

      // Create timeline entry for payment by friend
      await prisma.orderTimeline.create({
        data: {
          orderId: transaction.orderId,
          action: "PAID_BY_FRIEND",
          status: "PROCESSING",
          details: {
            payerEmail: transaction.payerEmail,
            amount: transaction.amount
          }
        }
      });

      // await sendNotification(transaction.order.userId, "PAYMENT", {
      //   orderId: transaction.order.id,
      //   status: "paid_by_friend",
      //   amount: transaction.amount,
      //   payerEmail: transaction.payerEmail
      // });
    }

    // Create processing timeline entry
    await prisma.orderTimeline.create({
      data: {
        orderId: transaction.orderId,
        action: "ORDER_PROCESSING",
        status: "PROCESSING",
        details: {
          message: "Payment confirmed, order is now being processed"
        }
      }
    });

    // Send payment confirmation notification
    // await sendNotification(transaction.order.userId, "ORDER", {
    //   orderId: transaction.order.id,
    //   status: "payment_completed",
    //   amount: transaction.amount
    // });

    res.status(200).json({ 
      success: true,
      message: "Payment verified successfully",
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        amountPaid: updatedOrder.amountPaid,
        amountDue: updatedOrder.amountDue
      },
      timeline: [
        {
          action: "PAYMENT_RECEIVED",
          status: "PROCESSING",
          timestamp: new Date()
        },
        ...(transaction.paymentLinkToken ? [{
          action: "PAID_BY_FRIEND",
          status: "PROCESSING",
          timestamp: new Date()
        }] : []),
        {
          action: "ORDER_PROCESSING",
          status: "PROCESSING",
          timestamp: new Date()
        }
      ]
    });

  } catch (error) {
    console.error('Payment verification failed:', error);
    
    // Create failed payment timeline entry if we have the orderId
    if (transaction?.orderId) {
      await prisma.orderTimeline.create({
        data: {
          orderId: transaction.orderId,
          action: "PAYMENT_FAILED",
          status: "FAILED",
          details: {
            error: error.message,
            reference: reference
          }
        }
      });
    }

    res.status(500).json({ 
      success: false,
      message: "Failed to verify payment",
      error: error.message 
    });
  }
};

const processPaymentLinkPayment = async (req, res) => {
  const { token } = req.params;
  const { email } = req.body;

  try {
    // Verify the payment link exists and is still valid
    const paymentLink = await prisma.paymentLink.findFirst({
      where: {
        token: token,
        expiresAt: { gt: new Date() },
        used: false
      },
      include: {
        order: true
      }
    });

    if (!paymentLink) {
      return res.status(404).json({ 
        success: false,
        message: "Payment link not found or expired" 
      });
    }

    // Initialize Paystack payment
    const amountInKobo = Math.round(paymentLink.order.totalPrice * 100);
    const response = await paystackClient.transaction.initialize({
      email,
      amount: amountInKobo,
      reference: `payforme_${paymentLink.order.id}_${Date.now()}`,
      metadata: {
        orderId: paymentLink.order.id,
        paymentLinkToken: token,
        payerEmail: email,
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: paymentLink.order.id,
          },
          {
            display_name: "Payment Type",
            variable_name: "payment_type",
            value: "pay_for_me",
          }
        ],
      },
    });

    // Validate Paystack response
    if (!response?.data?.reference) {
      console.error('Invalid Paystack response:', response);
      throw new Error('Payment gateway returned invalid response');
    }

    // Save the transaction in the database
    await prisma.transaction.create({
      data: {
        orderId: paymentLink.order.id,
        amount: paymentLink.order.totalPrice,
        reference: response.data.reference,
        status: "pending",
      },
    });

    res.status(200).json({
      success: true,
      message: "Payment initialized successfully",
      authorizationUrl: response.data.authorization_url,
      reference: response.data.reference
    });

  } catch (error) {
    console.error('Payment initialization error:', {
      token,
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      success: false,
      message: "Failed to process payment", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export { initializePayment, verifyPayment, processPaymentLinkPayment };