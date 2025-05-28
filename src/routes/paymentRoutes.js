import express from "express";
import authenticate from "../middlewares/authMiddleware.js";
import { initializePayment, processPaymentLinkPayment, verifyPayment } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/initialize", authenticate, initializePayment);
paymentRouter.post("/verify", verifyPayment);
// Pay for Me payment processing
paymentRouter.post("/payment-links/:token/process", processPaymentLinkPayment); // No auth - payer doesn't need to be authenticated

export default paymentRouter;