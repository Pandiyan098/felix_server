import express from 'express';
import { 
  createCustomAssetIssuerHandler, 
  getAllAssetsHandler, 
  getAssetByIdHandler, 
  toggleAssetStatusHandler,
  issueAssetToAccountHandler
} from '../controllers/asset.controller';
import { 
  validateRequest, 
  createAssetSchema,
  getAssetsSchema,
  getAssetByIdSchema,
  toggleAssetStatusSchema,
  issueAssetSchema
} from '../validations/asset.validation';

const router = express.Router();

// ⚠️  WARNING: These routes are for testing only and bypass authentication
// DO NOT USE IN PRODUCTION

// Simple test route to verify routing is working
router.get('/test/hello', (req, res) => {
  res.json({ message: 'Hello from test routes!', timestamp: new Date().toISOString() });
});

// Create custom asset issuer (NO AUTH)
// POST /api/test/assets
router.post('/test/assets', 
  validateRequest(createAssetSchema), 
  createCustomAssetIssuerHandler
);

// Get all assets with filtering and pagination (NO AUTH)
// GET /api/test/assets
router.get('/test/assets', 
  validateRequest(getAssetsSchema), 
  getAllAssetsHandler
);

// Get asset details by ID (NO AUTH)
// GET /api/test/assets/:assetId
router.get('/test/assets/:assetId', 
  validateRequest(getAssetByIdSchema), 
  getAssetByIdHandler
);

// Toggle asset active/inactive status (NO AUTH)
// PATCH /api/test/assets/:assetId/toggle-status
router.patch('/test/assets/:assetId/toggle-status', 
  validateRequest(toggleAssetStatusSchema), 
  toggleAssetStatusHandler
);

// Issue asset to a Stellar account (NO AUTH)
// POST /api/test/assets/:assetId/issue
router.post('/test/assets/:assetId/issue', 
  validateRequest(issueAssetSchema), 
  issueAssetToAccountHandler
);

export default router;
