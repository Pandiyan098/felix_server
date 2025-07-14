import express from 'express';
import {
  createServiceRequest,
  proposeService,
  acceptProposal,
  payForService
} from '../controllers/service.controller';

const router = express.Router();

router.post('/services/request', createServiceRequest);
router.post('/services/propose', proposeService);
router.post('/services/accept-proposal', acceptProposal);
router.post('/services/pay', payForService);

export default router;