import { Request, Response } from 'express';
import { 
  createCustomAssetIssuer, 
  getAllAssets, 
  getAssetById, 
  toggleAssetStatus,
  issueAssetToAccount
} from '../services/asset.service';
import { validateUuid } from '../utils/validation';

/**
 * Create a custom asset issuer
 * POST /api/assets/create
 */
export const createCustomAssetIssuerHandler = async (req: Request, res: Response) => {
  try {
    const { 
      asset_code, 
      asset_name, 
      description, 
      total_supply, 
      category, 
      icon_url, 
      website 
    } = req.body;

    // Validate required fields
    if (!asset_code || !asset_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: asset_code and asset_name are required' 
      });
    }

    // Validate asset_code format (max 12 characters for Stellar)
    if (asset_code.length > 12) {
      return res.status(400).json({ 
        error: 'Asset code must be 12 characters or less' 
      });
    }

    // Validate asset_name length
    if (asset_name.length > 50) {
      return res.status(400).json({ 
        error: 'Asset name must be 50 characters or less' 
      });
    }

    // Extract user ID from authenticated request (assuming middleware sets req.user)
    const created_by = (req as any).user?.id || null;

    const result = await createCustomAssetIssuer({
      asset_code,
      asset_name,
      description,
      total_supply: total_supply ? parseFloat(total_supply) : undefined,
      category,
      icon_url,
      website,
      created_by
    });

    res.status(201).json({
      success: true,
      message: 'Custom asset issuer created successfully',
      asset: result
    });

  } catch (error) {
    console.error('Create asset issuer error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('duplicate key value')) {
        return res.status(409).json({ 
          error: 'Asset code already exists. Please choose a different asset code.' 
        });
      }
      
      if (error.message.includes('Stellar network error')) {
        return res.status(503).json({ 
          error: 'Failed to create Stellar issuer account. Please try again later.' 
        });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while creating asset issuer' });
  }
};

/**
 * Get all assets with optional filtering and pagination
 * GET /api/assets?page=1&limit=10&is_active=true&category=utility
 */
export const getAllAssetsHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const is_active = req.query.is_active as string;
    const category = req.query.category as string;

    // Validate pagination parameters
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be 1 or greater' });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({ error: 'Limit must be between 1 and 100' });
    }

    const filters = {
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      category: category || undefined
    };

    const result = await getAllAssets(page, limit, filters);

    res.json({
      success: true,
      data: {
        assets: result.assets,
        pagination: {
          page,
          limit,
          total: result.total,
          total_pages: Math.ceil(result.total / limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        },
        filters: filters
      }
    });

  } catch (error) {
    console.error('Get all assets error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching assets' 
    });
  }
};

/**
 * Get asset details by asset ID
 * GET /api/assets/:assetId
 */
export const getAssetByIdHandler = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    // Validate UUID format
    if (!validateUuid(assetId)) {
      return res.status(400).json({ 
        error: 'Invalid asset ID format. Must be a valid UUID.' 
      });
    }

    const asset = await getAssetById(assetId);

    if (!asset) {
      return res.status(404).json({ 
        error: 'Asset not found' 
      });
    }

    res.json({
      success: true,
      asset: asset
    });

  } catch (error) {
    console.error('Get asset by ID error:', error);
    
    if (error instanceof Error && error.message.includes('Asset not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching asset' 
    });
  }
};

/**
 * Toggle asset active/inactive status
 * PATCH /api/assets/:assetId/toggle-status
 */
export const toggleAssetStatusHandler = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;

    // Validate UUID format
    if (!validateUuid(assetId)) {
      return res.status(400).json({ 
        error: 'Invalid asset ID format. Must be a valid UUID.' 
      });
    }

    // Extract user ID from authenticated request for audit trail
    const updated_by = (req as any).user?.id || null;

    const result = await toggleAssetStatus(assetId, updated_by);

    res.json({
      success: true,
      message: `Asset status updated to ${result.is_active ? 'active' : 'inactive'}`,
      asset: result
    });

  } catch (error) {
    console.error('Toggle asset status error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Asset not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while updating asset status' });
  }
};

/**
 * Issue asset to a Stellar account
 * POST /api/assets/:assetId/issue
 */
export const issueAssetToAccountHandler = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const { recipient_public_key, amount } = req.body;

    // Validate UUID format
    if (!validateUuid(assetId)) {
      return res.status(400).json({ 
        error: 'Invalid asset ID format. Must be a valid UUID.' 
      });
    }

    // Validate required fields
    if (!recipient_public_key || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: recipient_public_key and amount' 
      });
    }

    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    // Validate Stellar public key format
    if (!recipient_public_key.startsWith('G') || recipient_public_key.length !== 56) {
      return res.status(400).json({ 
        error: 'Invalid recipient public key format' 
      });
    }

    const result = await issueAssetToAccount(assetId, recipient_public_key, numericAmount);

    res.json({
      success: true,
      message: 'Asset issued successfully',
      transaction: result
    });

  } catch (error) {
    console.error('Issue asset error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Asset not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('Asset is not active')) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error.message.includes('Stellar network error')) {
        return res.status(503).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while issuing asset' });
  }
};
