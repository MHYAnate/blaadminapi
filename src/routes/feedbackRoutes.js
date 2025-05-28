import express from "express";
import { createFeedback, getAllFeedback, getFeedbackByUser } from "../controllers/feedbackController.js";
import authenticate from "../middlewares/authMiddleware.js";


const feedbackRouter = express.Router();

// Create a new feedback
feedbackRouter.post("/", authenticate, createFeedback);

// Fetch all feedback for a user
feedbackRouter.get("/user/:userId", getFeedbackByUser);

// Fetch all feedback (for admin purposes)
feedbackRouter.get("/", getAllFeedback);

export default feedbackRouter;