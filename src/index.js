import express from 'express';
import router from './routes/authRoutes.js';
import cors from 'cors'; 
import treblle from '@treblle/express';

import productRouter from './routes/productRoutes.js';
import manufacturesRouter from './routes/manufactuersRoutes.js';
import utilityRouter from './routes/utilityRoute.js';
import cartRouter from './routes/cartRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import orderRouter from './routes/orderRoutes.js';
import testRouter from './routes/testRoutes.js';
import dealRouter from './routes/dealRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import feedbackRouter from './routes/feedbackRoutes.js';
import shippingRouter from './routes/shippingRoutes.js';
import adminRouter from './routes/admin/dashboard.routes.js';
import businessInventoryRouter from './routes/businessInventoryRoutes.js';
import uploadRouter from './routes/uploadRoute.js';
import OrderRouter from './routes/admin/order.routes.js';
import adminOrderRouter from './routes/admin/order.routes.js';
import customerRouter from './routes/admin/customer.routes.js';
import swaggerSetup from './config/swagger.js';
import { schemas } from './config/schemas.js';
import adminManufacturesRouter from './routes/admin/manufacturers.routes.js';
import adminProductRouter from './routes/admin/product.routes.js';
import reportsRouter from './routes/admin/reports.routes.js';
import addressRouter from './routes/address.routes.js';
import adminInventoryrouter from './routes/admin/inventory.routes.js';
import adminFeedbackRouter from './routes/admin/feedback.route.js';
import { useTreblle } from 'treblle';
// import sendEmail from './mailer.js';
// import { sendVerificationEmail } from './mailer.js';
// import { Server } from 'socket.io';
import { createServer } from 'http';
// import { orderStatusStream } from './controllers/orderController.js';
import adminManagementRouter from './routes/admin/admin.routes.js';
import admin, { adminRouter as adminJsRouter } from './adminjs.config.js';
import referalRouter from './routes/referalRoute.js';
import dotenv from 'dotenv';
dotenv.config();


const app = express();

app.use(cors());
app.use(express.json());
app.use(admin.options.rootPath, adminJsRouter);

useTreblle(app, {
  apiKey: process.env.TREBLLE_API_KEY,
  projectId: process.env.TREBLLE_PROJECT_ID,
})

const httpServer = createServer(app);


app.use('/api/auth', router);
app.use('/api/product', productRouter);
app.use('/api/manufactures', manufacturesRouter);
app.use('/api/utility', utilityRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/users', addressRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/deals', dealRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/test', testRouter);
app.use('/api/inventory', businessInventoryRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/referal', referalRouter);


app.use('/api/admin/manage', adminManagementRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/products', adminProductRouter);
app.use('/api/admin/manufacturers', adminManufacturesRouter);
app.use('/api/admin/customers', customerRouter);
app.use('/api/admin/orders', adminOrderRouter);
app.use('/api/admin/reports', reportsRouter);
app.use('/api/admin/inventory', adminInventoryrouter);
app.use('/api/admin/feedback', adminFeedbackRouter);


swaggerSetup(app);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

const PORT = process.env.PORT || 3130;


// Change from app.listen to httpServer.listen
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}/socket.io`);
});

// export { io };