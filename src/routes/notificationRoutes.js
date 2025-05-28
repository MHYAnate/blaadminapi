import express from "express";
import { getNotificationsByUser, markNotificationAsRead } from "../controllers/notificationController.js";
import authenticate from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validateMiddleware.js";

const notificationRouter = express.Router();



notificationRouter.get("/user", authenticate, getNotificationsByUser);
notificationRouter.patch("/:notificationId/read", markNotificationAsRead);



export default notificationRouter;