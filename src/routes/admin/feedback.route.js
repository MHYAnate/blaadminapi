import express from "express";
import { adminAuth } from "../../middlewares/adminAuth.js";
import authenticate from "../../middlewares/authMiddleware.js";
import { adminGetAllFeedback, adminGetFeedbackByUser } from "../../controllers/admin/feedback.controller.js";


const adminFeedbackRouter = express.Router();

adminFeedbackRouter.use(authenticate);
adminFeedbackRouter.use(adminAuth)

// Fetch all feedback for a user
adminFeedbackRouter.get("/user/:userId", adminGetFeedbackByUser);

// Fetch all feedback (for admin purposes)
adminFeedbackRouter.get("/", adminGetAllFeedback);

export default adminFeedbackRouter;