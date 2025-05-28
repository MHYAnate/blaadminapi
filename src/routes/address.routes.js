import express from 'express';
import { 
  createAddress,
  getUserAddresses,
  getAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/address.controller.js';
import authenticate from '../middlewares/authMiddleware.js';

const addressRouter = express.Router();

// Apply authentication middleware to all routes
addressRouter.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: User address management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         userId:
 *           type: integer
 *           example: 123
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         phoneNumber:
 *           type: string
 *           example: "+2348012345678"
 *         addressLine1:
 *           type: string
 *           example: "123 Main Street"
 *         addressLine2:
 *           type: string
 *           example: "Suite 101"
 *         city:
 *           type: string
 *           example: "Lagos"
 *         stateProvince:
 *           type: string
 *           example: "Lagos State"
 *         postalCode:
 *           type: string
 *           example: "100001"
 *         country:
 *           type: string
 *           example: "Nigeria"
 *         isDefault:
 *           type: boolean
 *           example: true
 *         addressType:
 *           type: string
 *           enum: [SHIPPING, BILLING, BOTH]
 *           example: "SHIPPING"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T14:32:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T14:32:00Z"
 *     AddressInput:
 *       type: object
 *       required:
 *         - addressLine1
 *         - city
 *         - stateProvince
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         phoneNumber:
 *           type: string
 *           example: "+2348012345678"
 *         addressLine1:
 *           type: string
 *           example: "123 Main Street"
 *         addressLine2:
 *           type: string
 *           example: "Suite 101"
 *         city:
 *           type: string
 *           example: "Lagos"
 *         stateProvince:
 *           type: string
 *           example: "Lagos State"
 *         postalCode:
 *           type: string
 *           example: "100001"
 *         country:
 *           type: string
 *           default: "Nigeria"
 *           example: "Nigeria"
 *         isDefault:
 *           type: boolean
 *           default: false
 *           example: true
 *         addressType:
 *           type: string
 *           enum: [SHIPPING, BILLING, BOTH]
 *           default: "SHIPPING"
 *           example: "SHIPPING"
 */

/**
 * @swagger
 * /api/users/{userId}/addresses:
 *   post:
 *     summary: Create a new address for a user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       400:
 *         description: Missing required fields
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.post('/:userId/addresses', createAddress);

/**
 * @swagger
 * /api/users/{userId}/addresses:
 *   get:
 *     summary: Get all addresses for a user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of user addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.get('/:userId/addresses', getUserAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Get a specific address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the address
 *     responses:
 *       200:
 *         description: Address details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.get('/addresses/:id', getAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   put:
 *     summary: Update an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddressInput'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Address not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.put('/addresses/:id', updateAddress);

/**
 * @swagger
 * /api/addresses/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the address
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Address not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.delete('/addresses/:id', deleteAddress);

/**
 * @swagger
 * /api/addresses/{id}/set-default:
 *   patch:
 *     summary: Set an address as default
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the address
 *     responses:
 *       200:
 *         description: Default address set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Address not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
addressRouter.patch('/addresses/:id/set-default', setDefaultAddress);

export default addressRouter;