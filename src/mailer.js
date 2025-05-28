
// import { Resend } from 'resend';
// import handlebars from 'handlebars';
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// // Get the directory name using import.meta.url
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Initialize Resend with your API key
// const resend = new Resend(process.env.RESEND_API_KEY); 

// // Function to send email using Resend
// const sendEmail = async (to, subject, templateName, data) => {
//   try {
//     // Load the email template
//     const templatePath = path.join(__dirname, `../emails/${templateName}.html`);
//     const templateSource = fs.readFileSync(templatePath, 'utf8');
//     const template = handlebars.compile(templateSource);
//     const html = template(data);

//     // Send the email using Resend
//     const { data: emailData, error } = await resend.emails.send({
//       from: 'BuyLocal <onboarding@resend.dev>',
//       to,
//       subject,
//       html,
//     });

//     if (error) {
//       console.error('Resend API error:', error);
//       throw error;
//     }

//     console.log('Email sent with Resend:', emailData.id);
//     return emailData;
//   } catch (error) {
//     console.error('Error sending email:', error);
//     throw error;
//   }
// };

// export default sendEmail;
import { Resend } from 'resend';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates directory
const TEMPLATES_DIR = path.join(__dirname, '../emails/templates');

// Verify templates directory exists
if (!fs.existsSync(TEMPLATES_DIR)) {
  throw new Error(`Templates directory not found: ${TEMPLATES_DIR}`);
}

// Improved setVar helper that works with Handlebars' data pipeline
handlebars.registerHelper('setVar', function(varName, varValue, options) {
  options.data.root[varName] = varValue;
  return ''; // Return empty string as we're only setting variables
});

// Pre-load layout template
const layoutTemplatePath = path.join(TEMPLATES_DIR, 'layout.html');
if (!fs.existsSync(layoutTemplatePath)) {
  throw new Error(`Layout template not found: ${layoutTemplatePath}`);
}
const layoutTemplateSource = fs.readFileSync(layoutTemplatePath, 'utf8');

// Function to send email
const sendEmail = async (to, templateName, data = {}) => {
  try {
    // Load content template
    const contentTemplatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
    if (!fs.existsSync(contentTemplatePath)) {
      throw new Error(`Content template not found: ${contentTemplatePath}`);
    }
    
    const contentTemplateSource = fs.readFileSync(contentTemplatePath, 'utf8');
    
    // Create a shared data context that will persist through both renders
    const templateData = {
      ...data,
      subject: data.subject || templateName
    };
    
    // Create a data object for Handlebars that will track our variables
    const handlebarsData = { data: { root: templateData } };
    
    // Compile both templates
    const contentTemplate = handlebars.compile(contentTemplateSource);
    const layoutTemplate = handlebars.compile(layoutTemplateSource);
    
    // First render the content template to set variables
    const contentHtml = contentTemplate(templateData, handlebarsData);
    
    // Now render the layout with all variables set
    const finalHtml = layoutTemplate({
      ...templateData, // Includes all set variables
      body: contentHtml // The rendered content
    });

    // Verify the compiled content
    if (!finalHtml || finalHtml.trim().length === 0) {
      throw new Error(`Compiled template is empty for: ${templateName}`);
    }

    // Send email
    const { data: emailData, error } = await resend.emails.send({
      from: 'BuyLocal <account@buylocalafrica.com>',
      to: Array.isArray(to) ? to : [to],
      subject: templateData.subject, // Use the possibly updated subject
      html: finalHtml,
    });

    if (error) throw error;
    
    console.log(`Email sent (${templateName}) to ${to}:`, emailData.id);
    return emailData;
  } catch (error) {
    console.error(`Failed to send email (${templateName}) to ${to}:`, error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};
// Specific email functions


export const sendWelcomeEmail = (to, name) => 
  sendEmail(to, 'welcome', { 
    name, 
    subject: 'Welcome to BuyLocal!',
    year: new Date().getFullYear()
  });


export const sendVerificationEmail = (to, name, otp) =>
  sendEmail(to, 'verify', { 
    name, 
    otp, 
    subject: 'Verify Your Email',
    expiry: '10 minutes'
  });


export const sendOrderConfirmation = (to, orderData) =>
  sendEmail(to, 'order-confirmation', { 
    ...orderData,
    subject: `Order Confirmation #${orderData.orderNumber}`,
    contactEmail: 'support@buylocal.example.com'
  });

/**
 * Send admin invitation
 * @param {string|string[]} to - Recipient email address(es)
 * @param {string} role - Admin role being assigned
 * @param {string} inviteLink - Unique invitation link
 * @param {string} adminEmail - Admin contact email
 * @returns {Promise} Resend API response
 */
export const sendAdminInvite = (to, role, inviteLink, adminEmail) =>
  sendEmail(to, 'admin-invite', {
    role,
    inviteLink,
    adminEmail,
    subject: `You've Been Invited to BuyLocal Admin`
  });

/**
 * Send new order notification to admin
 * @param {string|string[]} to - Recipient email address(es)
 * @param {object} orderData - Order details
 * @param {string} orderData.orderNumber - Order reference number
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.orderTotal - Formatted order total
 * @param {number} orderData.itemCount - Number of items ordered
 * @param {string} adminLink - Link to admin order view
 * @returns {Promise} Resend API response
 */
export const sendAdminOrderNotice = (to, orderData, adminLink) =>
  sendEmail(to, 'admin-order-notice', {
    ...orderData,
    adminLink,
    subject: `New Order Notification #${orderData.orderNumber}`
  });

/**
 * Send cart reminder email
 * @param {string|string[]} to - Recipient email address(es)
 * @param {string} name - Customer name
 * @param {array} items - Array of cart items
 * @param {string} cartLink - Link to recover cart
 * @returns {Promise} Resend API response
 */
export const sendCartReminder = (to, name, items, cartLink) =>
  sendEmail(to, 'cart-reminder', {
    name,
    items,
    cartLink,
    subject: 'Your Cart Is Waiting!'
  });

/**
 * Send delivery notification
 * @param {string|string[]} to - Recipient email address(es)
 * @param {object} deliveryData - Delivery details
 * @param {string} deliveryData.orderNumber - Order reference number
 * @param {string} deliveryData.name - Customer name
 * @param {string} deliveryData.deliveryDate - Estimated delivery date
 * @param {string} deliveryData.trackingNumber - Shipping tracking number
 * @param {string} deliveryData.carrier - Shipping carrier name
 * @param {string} trackingLink - Full tracking URL
 * @returns {Promise} Resend API response
 */
export const sendDeliveryNotice = (to, deliveryData, trackingLink) =>
  sendEmail(to, 'delivery-notice', {
    ...deliveryData,
    trackingLink,
    subject: `Your Order #${deliveryData.orderNumber} Is On Its Way!`
  });

/**
 * Send password change confirmation
 * @param {string|string[]} to - Recipient email address(es)
 * @param {string} name - User's name
 * @param {string} date - Formatted change date
 * @returns {Promise} Resend API response
 */
export const sendPasswordChange = (to, name, date) =>
  sendEmail(to, 'password-change', {
    name,
    date,
    subject: 'Your Password Has Been Changed'
  });

export default {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendOrderConfirmation,
  sendAdminInvite,
  sendAdminOrderNotice,
  sendCartReminder,
  sendDeliveryNotice,
  sendPasswordChange,
  sendEmail
};