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
  getWalletAmountsHandler,
  getAllServicesHandler
} from '../controllers/wallet.controller';

const router = express.Router();

// router.post('/wallets/create', createWalletsHandler);
// router.post('/accounts/create', createAccountHandler);
// router.post('/wallets/pay', makePaymentHandler);
// router.post('/wallets/pay-bd', makeBDPaymentHandler);
// router.post('/wallets/trustline', createTrustlineHandler);
// router.get('/wallets/transactions', getTransactionsByUserHandler);
// router.get('/wallets/persons', getPersonsByAdminHandler);
// router.post('/wallets/transaction-request', createStellarTransactionRequestHandler);
// router.post('/wallets/accept-transaction', acceptStellarTransactionRequestHandler);
// router.post('/wallets/amounts', getWalletAmountsHandler);



// export default router;

router.post('/wallets/create', createWalletsHandler);
router.post('/accounts/create', createAccountHandler);
router.post('/wallets/pay', makePaymentHandler);
router.post('/wallets/pay-bd', makeBDPaymentHandler);
router.post('/wallets/create-trustline', createTrustlineHandler);
router.get('/transactions/by-user', getTransactionsByUserHandler);
router.get('/persons/by-admin', getPersonsByAdminHandler);
router.get('/test', (req, res) => res.send('Test route works!'));
router.post('/wallets/amounts', getWalletAmountsHandler);
router.get('/services/all', getAllServicesHandler);

export default router;

