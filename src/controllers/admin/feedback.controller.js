import prisma from "../../prismaClient.js";



  // Fetch all feedback for a user
  const adminGetFeedbackByUser = async (req, res) => {
    const { userId } = req.params;

    try {
      // Validate userId
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      // Fetch feedback for the user
      const feedback = await prisma.feedback.findMany({
        where: { userId: Number(userId) },
        orderBy: { createdAt: "desc" }, // Sort by most recent
      });

      // Return the feedback
      return res.status(200).json({
          message: "Feedback fetched successfully",
          count: feedback.length,
          data: feedback
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }
  };

  // Fetch all feedback (for admin purposes)
  const adminGetAllFeedback = async (req, res) => {
    try {
      // Fetch all feedback
      const feedback = await prisma.feedback.findMany({
        orderBy: { createdAt: "desc" }, // Sort by most recent
      });

      // Return the feedback
      return res.status(200).json({
          message: "Feedback fetched successfully",
          count: feedback.length,
          data: feedback
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return res.status(500).json({ error: "Failed to fetch feedback" });
    }
  };

export {  
    adminGetFeedbackByUser,
    adminGetAllFeedback
};