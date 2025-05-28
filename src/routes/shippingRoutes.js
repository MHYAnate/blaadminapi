import express from "express";
import { calculateShippingFee, getShippingDetails } from "../controllers/shippingController.js";
import authenticate from "../middlewares/authMiddleware.js";

const shippingRouter = express.Router();

shippingRouter.use(authenticate);
// Calculate shipping fee
shippingRouter.post("/calculate", calculateShippingFee);

// Fetch shipping details for an order
shippingRouter.get("/order/:orderId", getShippingDetails);

export default shippingRouter;