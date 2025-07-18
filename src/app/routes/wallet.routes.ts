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
  getAllServicesHandler,
  makeBDPaymentById,
  getAllTransactionsAndWalletDetailsHandler
} from '../controllers/wallet.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { 
  validateRequest, 
  createWalletSchema, 
  createAccountSchema, 
  makePaymentSchema, 
  makeBDPaymentSchema, 
  createTrustlineSchema, 
  getTransactionsByUserSchema, 
  getPersonsByAdminSchema,
  createStellarTransactionRequestSchema,
  acceptStellarTransactionRequestSchema,
  getWalletAmountsSchema,
  getAllServicesSchema
} from '../validations/validation.schemas';

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

router.post('/wallets/create', authenticateToken, validateRequest(createWalletSchema), createWalletsHandler);
router.post('/accounts/create', createAccountHandler);
router.post('/wallets/pay', makePaymentHandler);
router.post('/wallets/pay-bd', makeBDPaymentHandler);
router.post('/wallets/create-trustline', createTrustlineHandler);
router.get('/transactions/by-user', getTransactionsByUserHandler);
router.get('/persons/by-admin', getPersonsByAdminHandler);
router.get('/test',authenticateToken, (req, res) => res.send('Test route works!'));
router.get('/wallets/amounts', getWalletAmountsHandler);
router.get('/services/all', getAllServicesHandler);

router.post('/wallets/BdPayment', makeBDPaymentById);
router.get('/transactions-and-wallets', getAllTransactionsAndWalletDetailsHandler);

export default router;