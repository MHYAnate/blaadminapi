import express from "express";
import { createOrder, generatePaymentLink, getAllOrder, getOrder, getOrderStatus, getPaymentLinkOrderDetails, getScheduledOrders, scheduleOrder, trackOrder, updateScheduledOrder } from "../controllers/orderController.js";
import authenticate from "../middlewares/authMiddleware.js";


const orderRouter = express.Router();

orderRouter.post("/",authenticate, createOrder);
orderRouter.get('/scheduled', authenticate, getScheduledOrders);
orderRouter.get("/",authenticate, getAllOrder);
orderRouter.get("/:orderId",authenticate, getOrder);
orderRouter.post("/:orderId/schedule",authenticate, scheduleOrder);
orderRouter.patch("/:orderId/update-schedule",authenticate, updateScheduledOrder);
orderRouter.get("/:orderId/track",authenticate, trackOrder);
orderRouter.get("/:orderId/status",authenticate, getOrderStatus);

// Pay for Me routes
orderRouter.post("/:orderId/payment-links", authenticate, generatePaymentLink);
// No auth - public endpoint
orderRouter.get("/payment-links/:token", getPaymentLinkOrderDetails); 

export default orderRouter;