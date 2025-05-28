import express from 'express';
import { body } from 'express-validator';
import { 
  registerHandler, 
  loginHandler,
  verifyHandler,
  resetPasswordHandler,
  logoutHandler,
  updateUserPreferencesHandler,
  updateUserProfileHandler,
  userDetailsHandler,
  resendVerificationHandler,
  setPasswordHandler,
 } from '../controllers/authController.js';
import { loginLimiter } from '../utils.js';
import authenticate from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', [
  body('email').isEmail().withMessage('Invalid email'),
  body('type').isIn(['business', 'individual']).withMessage('Invalid user type'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('referal_code').optional(),
], registerHandler);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     addresses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Address'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty(),
], loginHandler);


router.post('/verify', [
  body('email').isEmail(),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code'),
], verifyHandler);


router.post('/reset', [
  body('email').isEmail(),
], resetPasswordHandler);


router.post('/reset-password',[
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('confirmPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('code').isLength({ min: 6, max: 6 }).withMessage('Invalid verification code'),
  body('email').isEmail(),
], setPasswordHandler);


router.post('/logout',authenticate, logoutHandler);

router.post('/preference',authenticate, [
  body('preference').isArray(),
], updateUserPreferencesHandler);

// Update User Profile (Business or Individual)

router.put('/update-profile', authenticate,[
  body('fullName').isString().optional(),
  body('businessName').isString().optional(),
  body('address').isString().optional(),
  body('dob').isDate().optional(),
  body('cac').isString().optional().optional(),
  body('howDidYouFindUs').isString().optional(),
], updateUserProfileHandler);


router.post('/resend', [
  body('email').isEmail(),
],resendVerificationHandler);

router.post('/reset-password', [
  body('email').isEmail(),
], 
  resetPasswordHandler
)

router.get('/me', authenticate, userDetailsHandler)

export default router;
