import express from 'express';
import authenticate from '../middlewares/authMiddleware.js';
import { getReferralHistory, getReferralInfo, validateReferralCode } from '../controllers/referalController.js';

const referalRouter = express.Router();

referalRouter.use(authenticate);

referalRouter.get('/info', getReferralInfo);
referalRouter.get('/history', getReferralHistory);
referalRouter.get('/validate/:code', validateReferralCode);

export default referalRouter;