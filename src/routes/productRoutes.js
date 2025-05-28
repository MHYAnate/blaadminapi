import express from 'express';
import { body } from 'express-validator';
import authenticate from '../middlewares/authMiddleware.js';

import { ProductHandler, ProductCategories, searchProducts, createProduct, saveProduct, getSavedProducts, removeSavedProduct, updateProduct } from '../controllers/productController.js';
import { createCategoryHandler } from '../controllers/categoryController.js';
import validate from '../middlewares/validateMiddleware.js';
import { createProductSchema, updateProductSchema } from '../schema.js';

const productRouter = express.Router();


productRouter.get('/',  ProductHandler);
productRouter.post('/', validate(createProductSchema), createProduct);
productRouter.put('/:id', validate(updateProductSchema), updateProduct);
productRouter.get('/search', searchProducts);
productRouter.get('/categories', ProductCategories);
productRouter.post('/categories', createCategoryHandler);
productRouter.post('/save', authenticate, saveProduct);
productRouter.get('/save', authenticate, getSavedProducts);
productRouter.delete('/save/:productId', authenticate, removeSavedProduct);

export default productRouter;