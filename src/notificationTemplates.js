const notificationTemplates = {
    WELCOME: ({ email }) => ({
        title: 'Welcome to Our Platform',
        message: `Welcome, ${email}! Thank you for joining us.`,
    }),
    LOGIN_SUCCESS: ({ email }) => ({
        title: 'Login Successful',
        message: `You have successfully logged in as ${email}.`,
    }),
    EMAIL_VERIFIED: ({ email }) => ({
        title: 'Email Verified',
        message: `Your email ${email} has been successfully verified.`,
    }),
    PROFILE_UPDATE: ({ fields }) => ({
        title: 'Profile Updated',
        message: `Your profile has been updated. Updated fields: ${fields}.`,
    }),
    ORDER: (data) => {
      const { orderId, status, scheduledDate } = data;
      let title, message;
  
      switch (status) {
        case "created":
          title = "Order Created";
          message = `Your order #${orderId} has been successfully created.`;
          break;
        case "scheduled":
          title = "Order Scheduled";
          message = `Your order #${orderId} has been scheduled for ${new Date(
            scheduledDate
          ).toLocaleString()}.`;
          break;
        case "scheduled_updated":
          title = "Order Rescheduled";
          message = `Your order #${orderId} has been rescheduled for ${new Date(
            scheduledDate
          ).toLocaleString()}.`;
          break;
        case "shipped":
          title = "Order Shipped";
          message = `Your order #${orderId} has been shipped.`;
          break;
        case "delivered":
          title = "Order Delivered";
          message = `Your order #${orderId} has been delivered.`;
          break;
        default:
          title = "Order Update";
          message = `Your order #${orderId} has been updated.`;
      }
  
      return { title, message };
    },
    LOW_STOCK: (productName, quantity) => ({
      title: "Low Stock Alert",
      message: `Your product ${productName} is running low. Current stock: ${quantity} units.`,
    }),
    NEW_USER: (name) => ({
      title: "New User",
      message: `Welcome, ${name}! Thanks for signing up.`,
    }),
    CART: (data) => {
        const { action, productName, quantity, note } = data;
        let title, message;
    
        switch (action) {
          case "item_added":
            title = "Item Added to Cart";
            message = `${quantity} x ${productName} has been added to your cart.`;
            break;
          case "item_updated":
            title = "Cart Item Updated";
            message = `The quantity of ${productName} in your cart has been updated to ${quantity}.`;
            break;
          case "item_removed":
            title = "Item Removed from Cart";
            message = `${productName} has been removed from your cart.`;
            break;
          case "note_added":
            title = "Note Added";
            message = `A note has been added for ${productName}: "${note}".`;
            break;
          case "note_updated":
            title = "Note Updated";
            message = `The note for ${productName} has been updated: "${note}".`;
            break;
          default:
            title = "Cart Update";
            message = "Your cart has been updated.";
        }
    
        return { title, message };
    },
    
  };
  
  export default notificationTemplates;