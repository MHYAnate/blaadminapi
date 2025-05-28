import express from 'express';
import authenticate from "../middlewares/authMiddleware.js";
import { 
    createProductAndInventory, 
    createStockTransaction, 
    deleteProductAndInventory, 
    getInventoryDashboard, 
    getLowStockProducts, 
    getProductsInInventory, 
    getProductSummary, 
    updateProductAndInventory
} from '../controllers/businessInventoryController.js';


const businessInventoryRouter = express.Router();

businessInventoryRouter.get('/dashboard',authenticate, getInventoryDashboard);
businessInventoryRouter.get('/products/summary',authenticate, getProductSummary);
businessInventoryRouter.get('/products',authenticate, getProductsInInventory);
businessInventoryRouter.post('/products',authenticate, createProductAndInventory);
businessInventoryRouter.post('/transactions',authenticate, createStockTransaction);
businessInventoryRouter.get('/products/low-stock',authenticate, getLowStockProducts);
// Routes (add these to your router)
businessInventoryRouter.put('/products/:productId', authenticate, updateProductAndInventory);
businessInventoryRouter.delete('/products/:productId', authenticate, deleteProductAndInventory);

export default businessInventoryRouter