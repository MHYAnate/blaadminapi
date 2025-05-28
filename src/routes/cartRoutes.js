import express from 'express';
import { addNote, addToCart, getCart, removeFromCart, updateCartItem, updateNote } from "../controllers/cartController.js";
import authenticate from "../middlewares/authMiddleware.js";


const cartRouter = express.Router();

cartRouter.use(authenticate);

cartRouter.post('/', addToCart);
cartRouter.get('/', getCart);
cartRouter.put('/', updateCartItem);
cartRouter.delete('/', removeFromCart);
cartRouter.patch('/note', addNote);
cartRouter.put('/note', updateNote);

export default cartRouter