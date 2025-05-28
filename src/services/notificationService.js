import notificationTemplates from "../notificationTemplates.js";
import prisma from "../prismaClient.js";


// Send a notification to a user
const sendNotification = async (userId, type, data) => {
  try {
    // Get the notification template
    const template = notificationTemplates[type];
    if (!template) {
      throw new Error(`Notification template not found for type: ${type}`);
    }

    // Generate the notification title and message
    const { title, message } = template(data);

    // Prepare metadata (if applicable)
    let metadata = null;
    if (type === "ORDER") {
      metadata = { orderId: data.orderId }; // Include orderId in metadata
    }

    // Create the notification in the database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        metadata, // Include metadata
      },
    });

    // Optionally, send the notification via email, SMS, or push notification
    // Example: sendEmailNotification(userId, title, message);

    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};


// Send email notification (optional)
const sendEmailNotification = async (userId, title, message) => {
  // Fetch user details (e.g., email)
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Send email using an email service (e.g., SendGrid, Mailgun)
  // Example:
  // await emailService.send({
  //   to: user.email,
  //   subject: title,
  //   text: message,
  // });

  console.log(`Email sent to ${user.email}: ${title} - ${message}`);
};

export { sendNotification, sendEmailNotification };