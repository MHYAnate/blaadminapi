import express from 'express';
import {uploadController } from '../controllers/uploadController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { upload } from '../utils.js';


const uploadRouter = express.Router();

uploadRouter.post('/', authenticate, upload.array('images'), uploadController);

export default uploadRouter
