import express from 'express';
import { 
    cancelOrder, 
    getOrderDetails, 
    getOrders, 
    getOrderSummary, 
    getSalesData, 
    processRefund, 
    shipOrder
} from '../../controllers/admin/order.controller.js';
import authenticate from '../../middlewares/authMiddleware.js';
import { adminAuth } from '../../middlewares/adminAuth.js';

const adminOrderRouter = express.Router();

// Apply authentication and authorization middleware
adminOrderRouter.use(authenticate);
adminOrderRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin - Orders
 *   description: Order management endpoints for administrators
 */

/**
 * @swagger
 * /admin/orders/summary:
 *   get:
 *     summary: Get order summary statistics
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: integer
 *                   example: 150
 *                 pendingOrders:
 *                   type: integer
 *                   example: 25
 *                 shippedOrders:
 *                   type: integer
 *                   example: 100
 *                 deliveredOrders:
 *                   type: integer
 *                   example: 75
 *                 cancelledOrders:
 *                   type: integer
 *                   example: 5
 *                 totalRevenue:
 *                   type: number
 *                   format: float
 *                   example: 125000.50
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.get('/summary', getOrderSummary);


/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Get all orders
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer   
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering orders
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json: 
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 totalOrders:
 *                   type: integer
 *                   example: 150
 *                 totalPages:
 *                   type: integer
 *                   example: 15
 *                 currentPage:
 *                   type: integer
 *                   example: 1
 *                 pageSize:
 *                   type: integer
 *                   example: 10
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       500:
 *         description: Internal server error
 */
  adminOrderRouter.get('/', getOrders);


/**
 * @swagger
 * /admin/orders/sales:
 *   get:
 *     summary: Get sales data and analytics
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, custom]
 *           default: 'month'
 *         description: The time period for sales data
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom period (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom period (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales data and analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: number
 *                   format: float
 *                   example: 125000.50
 *                 salesData:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: "2023-05-01"
 *                       sales:
 *                         type: number
 *                         format: float
 *                         example: 2500.75
 *                       orders:
 *                         type: integer
 *                         example: 15
 *                 topProducts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductSales'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.get('/sales', getSalesData);

/**
 * @swagger
 * /admin/orders/{id}:
 *   get:
 *     summary: Get detailed information about a specific order
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderDetails'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.get('/:id', getOrderDetails);

/**
 * @swagger
 * /admin/orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *               notifyCustomer:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the customer
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request (order cannot be cancelled)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.post('/:id/cancel', cancelOrder);

/**
 * @swagger
 * /admin/orders/{id}/ship:
 *   post:
 *     summary: Mark an order as shipped
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               trackingNumber:
 *                 type: string
 *                 description: Shipping tracking number
 *               carrier:
 *                 type: string
 *                 description: Shipping carrier
 *               notifyCustomer:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the customer
 *     responses:
 *       200:
 *         description: Order marked as shipped successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request (order cannot be shipped)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.post('/:id/ship', shipOrder);

/**
 * @swagger
 * /admin/orders/{id}/refund:
 *   post:
 *     summary: Process a refund for an order
 *     tags: [Admin - Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: Amount to refund
 *               reason:
 *                 type: string
 *                 description: Reason for refund
 *               notifyCustomer:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify the customer
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 refund:
 *                   $ref: '#/components/schemas/Refund'
 *       400:
 *         description: Bad request (invalid refund amount or order cannot be refunded)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal server error
 */
adminOrderRouter.post('/:id/refund', processRefund);

export default adminOrderRouter;