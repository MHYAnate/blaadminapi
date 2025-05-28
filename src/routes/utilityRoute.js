
import express from 'express';
import { contactUsHandler, earlyAccessHandler, getUpdatesHandler, newsletterHandler, suggestCityHandler } from '../controllers/utilityController.js';

const utilityRouter = express.Router();

// // Early Access Route
utilityRouter.post('/early-access', earlyAccessHandler);
utilityRouter.post('/newsletter', newsletterHandler);
utilityRouter.post('/suggest-city', suggestCityHandler);
utilityRouter.post('/contact-us', contactUsHandler);
utilityRouter.post('/get-updates', getUpdatesHandler);

export default utilityRouter;
