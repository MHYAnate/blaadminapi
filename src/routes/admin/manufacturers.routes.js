import express from 'express';

import    {
    adminGetManufacturesHandler,
    adminCreateManufacturerHandler,
    adminGetSingleManufacturerHandler,
    adminGetProductsByManufacturerHandler,
    adminDeleteManufacturerHandler,
    adminUpdateManufacturerHandler,
    adminChangeManufacturerStatusHandler
} from '../../controllers/admin/manufacturer.controller.js';
import authenticate from '../../middlewares/authMiddleware.js';
import { adminAuth } from '../../middlewares/adminAuth.js';

const adminManufacturesRouter = express.Router();

adminManufacturesRouter.use(authenticate);
adminManufacturesRouter.use(adminAuth);

/**
 * @swagger
 * tags:
 *   name: Admin - Manufacturers
 *   description: Manufacturer management endpoints for administrators
 */

/**
 * @swagger
 * /admin/manufacturers:
 *   get:
 *     summary: Get all manufacturers with pagination and filtering
 *     tags: [Admin - Manufacturers]
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
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by manufacturer name (partial match)
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country (exact match)
 *     responses:
 *       200:
 *         description: List of manufacturers
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.get('/', adminGetManufacturesHandler);

/**
 * @swagger
 * /admin/manufacturers:
 *   post:
 *     summary: Create a new manufacturer (Admin Only)
 *     description: |
 *       Creates a new manufacturer in the system.
 *       Requires admin privileges.
 *     tags: [Admin - Manufacturers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManufacturerCreate'
 *     responses:
 *       201:
 *         description: Manufacturer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Manufacturer created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Manufacturer'
 *       400:
 *         description: Bad Request - Missing or invalid fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient privileges
 *       409:
 *         description: Conflict - Manufacturer with this name or email already exists
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// In your components section (usually at the bottom of your Swagger docs)
/**
 * @swagger
 * components:
 *   schemas:
 *     ManufacturerCreate:
 *       type: object
 *       required:
 *         - name
 *         - country
 *         - logo
 *         - email
 *         - contactPerson
 *       properties:
 *         name:
 *           type: string
 *           example: "Acme Corp"
 *         country:
 *           type: string
 *           example: "United States"
 *         logo:
 *           type: string
 *           format: uri
 *           example: "https://example.com/logo.png"
 *         email:
 *           type: string
 *           format: email
 *           example: "contact@acme.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *           nullable: true
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 * 
 *     Manufacturer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *         country:
 *           type: string
 *         email:
 *           type: string
 *         status:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error message"
 *         details:
 *           type: string
 *           example: "Additional error details (in development)"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
adminManufacturesRouter.post('/', adminCreateManufacturerHandler);

/**
 * @swagger
 * /admin/manufacturers/{manufacturerId}:
 *   get:
 *     summary: Get a single manufacturer by ID
 *     tags: [Admin - Manufacturers]
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Manufacturer ID
 *       - in: query
 *         name: includeProducts
 *         schema:
 *           type: boolean
 *         description: Include sample products
 *       - in: query
 *         name: includeProductCount
 *         schema:
 *           type: boolean
 *         description: Include product count
 *     responses:
 *       200:
 *         description: Manufacturer details
 *       404:
 *         description: Manufacturer not found
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.get('/:manufacturerId', adminGetSingleManufacturerHandler);

/**
 * @swagger
 * /admin/manufacturers/{manufacturerId}/products:
 *   get:
 *     summary: Get products by manufacturer
 *     tags: [Admin - Manufacturers]
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Manufacturer ID
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
 *         name: productName
 *         schema:
 *           type: string
 *         description: Filter by product name (partial match)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by product category
 *     responses:
 *       200:
 *         description: List of products for the manufacturer
 *       404:
 *         description: Manufacturer not found
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.get('/:manufacturerId/products', adminGetProductsByManufacturerHandler);


/**
 * @swagger
 * /admin/manufacturers/{manufacturerId}/status:
 *   patch:
 *     summary: Update manufacturer status (active/inactive)
 *     tags: [Admin - Manufacturers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Manufacturer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: boolean
 *                 description: New status (true = active, false = inactive)
 *                 example: true
 *     responses:
 *       200:
 *         description: Manufacturer status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manufacturer'
 *       400:
 *         description: Invalid status value or manufacturer ID
 *       404:
 *         description: Manufacturer not found
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.patch('/:manufacturerId/status', adminChangeManufacturerStatusHandler);

/**
 * @swagger
 * /admin/manufacturers/{manufacturerId}:
 *   put:
 *     summary: Update manufacturer details
 *     tags: [Admin - Manufacturers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Manufacturer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ManufacturerUpdate'
 *     responses:
 *       200:
 *         description: Manufacturer updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Manufacturer'
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Manufacturer not found
 *       409:
 *         description: Conflict (duplicate name or email)
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.put('/:manufacturerId', adminUpdateManufacturerHandler);

/**
 * @swagger
 * /admin/manufacturers/{manufacturerId}:
 *   delete:
 *     summary: Delete a manufacturer
 *     tags: [Admin - Manufacturers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: manufacturerId
 *         schema:
 *           type: string
 *         required: true
 *         description: Manufacturer ID
 *     responses:
 *       200:
 *         description: Manufacturer deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 deletedManufacturer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *       400:
 *         description: Manufacturer has associated products
 *       404:
 *         description: Manufacturer not found
 *       500:
 *         description: Internal server error
 */
adminManufacturesRouter.delete('/:manufacturerId', adminDeleteManufacturerHandler);

/**
 * @swagger
 * components:
 *   schemas:
 *     ManufacturerCreate:
 *       type: object
 *       required:
 *         - name
 *         - country
 *         - logo
 *         - email
 *         - contactPerson
 *       properties:
 *         name:
 *           type: string
 *           example: "Acme Corp"
 *         country:
 *           type: string
 *           example: "United States"
 *         logo:
 *           type: string
 *           format: uri
 *           example: "https://example.com/logo.png"
 *         email:
 *           type: string
 *           format: email
 *           example: "contact@acme.com"
 *         phone:
 *           type: string
 *           example: "+1234567890"
 *           nullable: true
 *         contactPerson:
 *           type: string
 *           example: "John Doe"
 * 
 *     ManufacturerUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Acme Corp Updated"
 *         country:
 *           type: string
 *           example: "Canada"
 *         logo:
 *           type: string
 *           format: uri
 *           example: "https://example.com/new-logo.png"
 *         email:
 *           type: string
 *           format: email
 *           example: "new-contact@acme.com"
 *         phone:
 *           type: string
 *           example: "+1987654321"
 *           nullable: true
 *         contactPerson:
 *           type: string
 *           example: "Jane Smith"
 *         status:
 *           type: boolean
 *           example: true
 * 
 *     Manufacturer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *         country:
 *           type: string
 *         logo:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         contactPerson:
 *           type: string
 *         status:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         products:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Product'
 * 
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error message"
 *         details:
 *           type: string
 *           example: "Additional error details (in development)"
 * 
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
export default adminManufacturesRouter;