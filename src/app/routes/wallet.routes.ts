import express from 'express';
import { 
  createWalletsHandler, 
  createAccountHandler, 
  makePaymentHandler, 
  makeBDPaymentHandler, 
  createTrustlineHandler, 
  getTransactionsByUserHandler, 
  getPersonsByAdminHandler,
  createStellarTransactionRequestHandler,
  acceptStellarTransactionRequestHandler,
  getWalletAmountsHandler
} from '../controllers/wallet.controller';

const router = express.Router();

router.post('/wallets/create', createWalletsHandler);
router.post('/wallets/create-account', createAccountHandler);
router.post('/wallets/pay', makePaymentHandler);
router.post('/wallets/pay-bd', makeBDPaymentHandler);
router.post('/wallets/trustline', createTrustlineHandler);
router.get('/wallets/transactions', getTransactionsByUserHandler);
router.get('/wallets/persons', getPersonsByAdminHandler);
router.post('/wallets/transaction-request', createStellarTransactionRequestHandler);
router.post('/wallets/accept-transaction', acceptStellarTransactionRequestHandler);
router.post('/wallets/amounts', getWalletAmountsHandler);

export default router;

