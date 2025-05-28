import express from "express";
import authenticate from "../../middlewares/authMiddleware.js";
import { adminAuth } from "../../middlewares/adminAuth.js";
import { getDashboardReports, getFinancialReport, getFinancialReports, deleteFinancialData, } from "../../controllers/admin/reports.controller.js";
import { getAllTransactions } from "../../controllers/admin/adminpaymanage.controller.js";

const reportsRouter = express.Router();

reportsRouter.use(authenticate);
reportsRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Analytics and reporting endpoints
 */

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get dashboard analytics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardReport'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       500:
 *         description: Internal server error
 */
reportsRouter.get('/dashboard', getDashboardReports);



/**
 * @swagger
 * tags:
 *   name: Financial Reports
 *   description: Customer financial reporting endpoints
 */

/**
 * @swagger
 * /financial-reports:
 *   get:
 *     summary: Get financial reports for all customers
 *     tags: [Financial Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date filter (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date filter (YYYY-MM-DD)
 *       - in: query
 *         name: customerType
 *         schema:
 *           type: string
 *           enum: [individual, business]
 *         description: Filter by customer type
 *       - in: query
 *         name: minAOV
 *         schema:
 *           type: number
 *           format: float
 *         description: Minimum average order value to filter by
 *       - in: query
 *         name: maxAOV
 *         schema:
 *           type: number
 *           format: float
 *         description: Maximum average order value to filter by
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
 *     responses:
 *       200:
 *         description: Financial reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialReportsResponse'
 */
reportsRouter.get('/', getFinancialReports);
reportsRouter.get('/transactions', getAllTransactions);

reportsRouter.get('/', getDashboardReports);


/**
 * @swagger
 * /financial-reports/{customerId}:
 *   get:
 *     summary: Get financial report for a single customer
 *     tags: [Financial Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Financial report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialReportResponse'
 *       404:
 *         description: Customer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin access required)
 *       500:
 *         description: Internal server error
 */
reportsRouter.get('/:customerId', getFinancialReport);

reportsRouter.delete('/:customerId', deleteFinancialData);


// export default router;
export default reportsRouter;