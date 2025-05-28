import { createDeal, getCategoryWithDeals, getDeals, getProductWithDeals } from "../controllers/dealController.js";
import express from 'express';


const dealRouter = express.Router();

dealRouter.post("/", createDeal);
dealRouter.get("/", getDeals);
dealRouter.get("/products/:productId", getProductWithDeals);
dealRouter.get("/category/:categoryId", getCategoryWithDeals);


export default dealRouter;