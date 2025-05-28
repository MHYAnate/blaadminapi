import express from 'express';
import { 
    adminCreateProduct, 
    adminDeleteProduct, 
    adminGetProduct, 
    adminGetProducts, 
    adminUpdateProduct 
} from '../../controllers/admin/product.controller.js';
import authenticate from '../../middlewares/authMiddleware.js';
import { adminAuth } from '../../middlewares/adminAuth.js';

const adminProductRouter = express.Router();

adminProductRouter.use(authenticate);
adminProductRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin - Products
 *   description: Product management endpoints for administrators
 */

/**
 * @swagger
 * /api/admin/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductCreate'
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       400:
 *         description: Missing required fields or invalid data
 *       500:
 *         description: Internal server error
 */
adminProductRouter.post('/', adminCreateProduct);

/**
 * @swagger
 * /api/admin/products:
 *   get:
 *     summary: Get all products with advanced filtering
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by product name (partial match)
 *       # Add other parameters as needed
 *     responses:
 *       200:
 *         description: List of products with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductListResponse'
 *       500:
 *         description: Internal server error
 */
adminProductRouter.get('/', adminGetProducts);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProductResponse'
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
adminProductRouter.put('/:id', adminUpdateProduct);

/**
 * @swagger
 * /api/admin/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Admin - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       400:
 *         description: Cannot delete product with associated orders
 *       404:
 *         description: Product not found
 *       500:
 *         description: Internal server error
 */
adminProductRouter.delete('/:id', adminDeleteProduct);

export default adminProductRouter;