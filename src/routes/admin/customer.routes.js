import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.js";
import authenticate from "../../middlewares/authMiddleware.js";
import { 
    getCustomerById, 
    getCustomerOrderHistory, 
    listCustomers 
} from "../../controllers/admin/customer.controller.js";


const customerRouter = express.Router();

customerRouter.use(authenticate);
customerRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Customers
 *   description: Customer management endpoints for administrators
 */

/**
 * @swagger
 * /admin/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Admin Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [individual, business]
 *         description: Filter by customer type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [verified, not verified]
 *         description: Filter by verification status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by customer name or email
 *     responses:
 *       200:
 *         description: List of customers with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Customers fetched successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       customerType:
 *                         type: string
 *                       role:
 *                         type: string
 *                       status:
 *                         type: string
 *                       kyc:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPreviousPage:
 *                       type: boolean
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 *                   description: Only included in development environment
 */

customerRouter.get("/", listCustomers);

/**
 * @swagger
 * /admin/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Admin Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Customer'
 *       404:
 *         description: Customer not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
customerRouter.get("/:id" , getCustomerById);

/**
 * @swagger
 * /admin/customers/{id}/orders:
 *   get:
 *     summary: Get customer order history
 *     tags: [Admin Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer order history
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       $ref: '#/components/schemas/OrderSummary'
 *                     orders:
 *                       $ref: '#/components/schemas/CategorizedOrders'
 *       400:
 *         description: Invalid customer ID
 *       404:
 *         description: Customer not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
customerRouter.get("/:id/orders", getCustomerOrderHistory);

// customerRouter.get('/admin/customers/download', downloadCustomers);

export default customerRouter;