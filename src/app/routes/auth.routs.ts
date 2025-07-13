import express from 'express';
import { emailLoginHandler } from '../controllers/auth.controller';

const router = express.Router();

router.post('/profile', emailLoginHandler);

export default router;
