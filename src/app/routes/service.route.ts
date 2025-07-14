import express from 'express';
import {
  createServiceRequest,
  proposeService,
  acceptProposal,
  payForService,
  getAllService,
  getAllproposal
} from '../controllers/service.controller';

const router = express.Router();

router.post('/services/request', createServiceRequest);
router.post('/services/propose', proposeService);
router.post('/services/accept-proposal', acceptProposal);
router.post('/services/pay', payForService);
router.get('/services/request', getAllService)
router.get('/services/get/propose', getAllproposal);
export default router;