import express from 'express';
import { createMemoHandler, payForMemoHandler } from '../controllers/memo.controller';

const router = express.Router();

router.post('/create', createMemoHandler);
router.post('/pay-for-memo', payForMemoHandler);

export default router;
