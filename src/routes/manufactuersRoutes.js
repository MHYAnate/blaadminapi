
import express from 'express';
import { createManufacturesHandler, getManufacturesHandler } from '../controllers/manufacturerController.js';

const manufacturesRouter = express.Router();

manufacturesRouter.get('/',  getManufacturesHandler);
manufacturesRouter.post('/', createManufacturesHandler);

export default manufacturesRouter;