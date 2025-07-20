import express from 'express';
import { 
  createCustomAssetIssuerHandler, 
  getAllAssetsHandler, 
  getAssetByIdHandler, 
  toggleAssetStatusHandler,
  issueAssetToAccountHandler
} from '../controllers/asset.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { 
  validateRequest, 
  createAssetSchema,
  getAssetsSchema,
  getAssetByIdSchema,
  toggleAssetStatusSchema,
  issueAssetSchema
} from '../validations/asset.validation';

const router = express.Router();

// Create custom asset issuer
// POST /api/assets
router.post('/assets', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(createAssetSchema), 
  createCustomAssetIssuerHandler
);

// Get all assets with filtering and pagination
// GET /api/assets
router.get('/assets',
  authenticateToken,
  validateRequest(getAssetsSchema), 
  getAllAssetsHandler
);

// Get asset details by ID
// GET /api/assets/:assetId
router.get('/assets/:assetId',
  authenticateToken,
  validateRequest(getAssetByIdSchema), 
  getAssetByIdHandler
);

// Toggle asset active/inactive status
// PATCH /api/assets/:assetId/toggle-status
router.patch('/assets/:assetId/toggle-status', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(toggleAssetStatusSchema), 
  toggleAssetStatusHandler
);

// Issue asset to a Stellar account
// POST /api/assets/:assetId/issue
router.post('/assets/:assetId/issue',
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(issueAssetSchema), 
  issueAssetToAccountHandler
);

export default router;
