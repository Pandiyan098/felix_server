import express from 'express';
import { emailLoginHandler } from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', emailLoginHandler);

export default router;
