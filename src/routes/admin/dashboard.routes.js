import express from "express";
import { getAdminDashboardData } from "../../controllers/admin/dashboard.controller.js";
import authenticate from "../../middlewares/authMiddleware.js";
import { adminAuth } from "../../middlewares/adminAuth.js";
import { 
  deleteAdmin 
} from '../../controllers/admin/admin.controller.js';

const adminRouter = express.Router();

// Apply authentication and admin authorization middleware to all admin routes
adminRouter.use(authenticate);
adminRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_revenue:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       example: 125000.50
 *                     increase_percentage:
 *                       type: number
 *                       format: float
 *                       example: 15.5
 *                 total_profits:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       example: 25000.10
 *                     increase_percentage:
 *                       type: number
 *                       format: float
 *                       example: 15.5
 *                 total_orders:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                       example: 1250
 *                     increase_percentage:
 *                       type: number
 *                       format: float
 *                       example: 8.3
 *                 total_customers:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: integer
 *                       example: 350
 *                     increase_percentage:
 *                       type: number
 *                       format: float
 *                       example: 5.2
 *                 sales_performance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2023-05"
 *                       totalSales:
 *                         type: number
 *                         format: float
 *                         example: 25000.75
 *                 order_summary:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       status:
 *                         type: string
 *                         example: "DELIVERED"
 *                       _count:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 45
 *                 top_selling_products:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product:
 *                         type: string
 *                         example: "Premium Widget"
 *                       sales:
 *                         type: integer
 *                         example: 125
 *                 top_customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         example: "customer@example.com"
 *                       totalSpent:
 *                         type: number
 *                         format: float
 *                         example: 5000.75
 *                       numberOfPurchases:
 *                         type: integer
 *                         example: 12
 *                 recent_customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       email:
 *                         type: string
 *                         example: "new@customer.com"
 *                       type:
 *                         type: string
 *                         example: "INDIVIDUAL"
 *                       isVerified:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       name:
 *                         type: string
 *                         example: "John Doe"
 *                       role:
 *                         type: string
 *                         example: "CUSTOMER"
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient privileges
 *       500:
 *         description: Internal server error
 */
adminRouter.get("/dashboard", getAdminDashboardData);

adminRouter.delete('/:id', deleteAdmin);


export default adminRouter;