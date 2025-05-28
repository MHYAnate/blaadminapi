import prisma from "../prismaClient.js";

  // Create a new notification
  const createNotification = async (req, res) => {
    const { userId, title, message, type } = req.body;

    try {
      // Validate required fields
      if (!userId || !title || !message || !type) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Create the notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type, 
        },
      });

      // Return the created notification
      return res.status(201).json({
          message: "Notification created successfully",
          data: notification
      });
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ error: "Failed to create notification" });
    }
  };

  // Fetch all notifications for a user
  const getNotificationsByUser = async (req, res) => {
    const userId = req.user.id;
    const { type, page = 1, limit = 10 } = req.query; // Pagination parameters
  
    try {
      // Validate userId
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
  
      // Validate pagination parameters
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
  
      if (isNaN(pageNumber) || pageNumber < 1 || isNaN(limitNumber) || limitNumber < 1) {
        return res.status(400).json({ error: "Invalid pagination parameters" });
      }
  
      // Calculate skip and take
      const skip = (pageNumber - 1) * limitNumber;
      const take = limitNumber;
  
      // Fetch notifications for the user
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: {
            userId: Number(userId),
            ...(type && { type }), // Filter by type if provided
          },
          orderBy: { createdAt: "desc" }, // Sort by most recent
          skip, // Skip the first N notifications
          take, // Fetch N notifications
        }),
        prisma.notification.count({
          where: {
            userId: Number(userId),
            ...(type && { type }), // Filter by type if provided
          },
        }),
      ]);
  
      // Calculate total pages
      const totalPages = Math.ceil(total / limitNumber);
  
      // Return the notifications with pagination metadata
      return res.status(200).json({
        message: "Notifications fetched successfully",
        data: notifications,
        pagination: {
          total,
          page: pageNumber,
          limit: limitNumber,
          totalPages,
        },
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ error: "Failed to fetch notifications" });
    }
  };

  // Mark a notification as read
  const markNotificationAsRead = async (req, res) => {
    const { notificationId } = req.params;

    try {
      // Validate notificationId
      if (!notificationId || isNaN(Number(notificationId))) {
        return res.status(400).json({ error: "Invalid notification ID" });
      }

      // Update the notification
      const updatedNotification = await prisma.notification.update({
        where: { id: Number(notificationId) },
        data: { isRead: true },
      });

      // Return the updated notification
      return res.status(200).json({
        message: "Notification marked as read",
        data: updatedNotification,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ error: "Failed to mark notification as read" });
    }
  };

export { createNotification, getNotificationsByUser, markNotificationAsRead };