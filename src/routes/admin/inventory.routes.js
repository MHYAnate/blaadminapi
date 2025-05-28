import express from 'express';
import { adminAuth } from '../../middlewares/adminAuth.js';
import authenticate from '../../middlewares/authMiddleware.js';
import { getDashboardStats, getManufacturerInventory, setStockLimits } from '../../controllers/admin/inventory.controller.js';

const adminInventoryRouter = express.Router();

adminInventoryRouter.use(authenticate);
adminInventoryRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin Inventory
 *   description: Inventory management for administrators
 */

/**
 * @swagger
 * /admin/inventory/dashboard:
 *   get:
 *     summary: Get inventory dashboard statistics
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProducts:
 *                       type: integer
 *                       description: Total number of products in inventory
 *                     statusCounts:
 *                       type: object
 *                       properties:
 *                         IN_STOCK:
 *                           type: integer
 *                         LOW_STOCK:
 *                           type: integer
 *                         OUT_OF_STOCK:
 *                           type: integer
 *                     monthlyMovement:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           stockIn:
 *                             type: integer
 *                           stockOut:
 *                             type: integer
 *                     stockAlerts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/InventoryAlert'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminInventoryRouter.get('/dashboard', getDashboardStats);

/**
 * @swagger
 * /admin/inventory/manufacturer/{manufacturerId}:
 *   get:
 *     summary: Get inventory by manufacturer
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the manufacturer
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
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [product.name, currentStock, status]
 *           default: product.name
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Manufacturer inventory data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ManufacturerInventory'
 *                 manufacturer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Manufacturer not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminInventoryRouter.get('/manufacturer/:manufacturerId', getManufacturerInventory);

/**
 * @swagger
 * /admin/inventory/limits/{inventoryId}:
 *   put:
 *     summary: Set stock limits for an inventory item
 *     tags: [Admin Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the inventory item
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - minStockLevel
 *               - reorderPoint
 *             properties:
 *               minStockLevel:
 *                 type: integer
 *                 description: Minimum stock level before alerts
 *                 example: 10
 *               maxStockLevel:
 *                 type: integer
 *                 description: Maximum stock capacity (optional)
 *                 example: 100
 *               reorderPoint:
 *                 type: integer
 *                 description: When to trigger reordering
 *                 example: 20
 *     responses:
 *       200:
 *         description: Stock limits updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/BusinessInventory'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: Inventory item not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
adminInventoryRouter.put('/limits/:inventoryId', setStockLimits);

export default adminInventoryRouter;