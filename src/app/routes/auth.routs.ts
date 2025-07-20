import express from 'express';
import { emailLoginHandler, getTokenHandler } from '../controllers/auth.controller';

const router = express.Router();

router.post('/profile', emailLoginHandler);
router.post('/token', getTokenHandler);

export default router;
