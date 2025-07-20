import { Request, Response } from 'express';
import { 
  createEntity,
  getAllEntities, 
  getEntityById,
  getEntityByCode,
  updateEntity,
  toggleEntityStatus,
  deleteEntity,
  getEntityStats,
  generateStellarKeysForEntity
} from '../services/entity.service';
import { validateUuid } from '../utils/validation';

/**
 * Create a new entity
 * POST /api/entities
 */
export const createEntityHandler = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      code, 
      description, 
      stellar_public_key,
      stellar_secret_key,
      asset_code, 
      entity_manager_id,
      generate_stellar_keys
    } = req.body;

    // Extract user ID from authenticated request
    const created_by = (req as any).user?.id;

    if (!created_by) {
      return res.status(401).json({ 
        error: 'Authentication required. User ID not found in request.' 
      });
    }

    const result = await createEntity({
      name,
      code,
      description,
      stellar_public_key,
      stellar_secret_key,
      asset_code,
      entity_manager_id,
      created_by,
      generate_stellar_keys
    });

    res.status(201).json({
      success: true,
      message: 'Entity created successfully',
      entity: result
    });

  } catch (error) {
    console.error('Create entity error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Entity with this code already exists')) {
        return res.status(409).json({ 
          error: 'Entity code already exists. Please choose a different entity code.' 
        });
      }
      
      if (error.message.includes('duplicate key value')) {
        return res.status(409).json({ 
          error: 'Entity code already exists. Please choose a different entity code.' 
        });
      }
      
      if (error.message.includes('Missing required fields')) {
        return res.status(400).json({ error: error.message });
      }
      
      if (error.message.includes('Invalid Stellar')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while creating entity' });
  }
};

/**
 * Get all entities with optional filtering and pagination
 * GET /api/entities?page=1&limit=10&is_active=true&asset_code=BD
 */
export const getAllEntitiesHandler = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const is_active = req.query.is_active as string;
    const asset_code = req.query.asset_code as string;
    const entity_manager_id = req.query.entity_manager_id as string;
    const created_by = req.query.created_by as string;

    const filters = {
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      asset_code: asset_code || undefined,
      entity_manager_id: entity_manager_id || undefined,
      created_by: created_by || undefined
    };

    const result = await getAllEntities(page, limit, filters);

    res.json({
      success: true,
      data: {
        entities: result.entities,
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
    console.error('Get all entities error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching entities' 
    });
  }
};

/**
 * Get entity details by entity ID
 * GET /api/entities/:entityId
 */
export const getEntityByIdHandler = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;

    // Validate UUID format
    if (!validateUuid(entityId)) {
      return res.status(400).json({ 
        error: 'Invalid entity ID format. Must be a valid UUID.' 
      });
    }

    const entity = await getEntityById(entityId);

    res.json({
      success: true,
      entity: entity
    });

  } catch (error) {
    console.error('Get entity by ID error:', error);
    
    if (error instanceof Error && error.message.includes('Entity not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching entity' 
    });
  }
};

/**
 * Get entity details by entity code
 * GET /api/entities/code/:code
 */
export const getEntityByCodeHandler = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const entity = await getEntityByCode(code);

    res.json({
      success: true,
      entity: entity
    });

  } catch (error) {
    console.error('Get entity by code error:', error);
    
    if (error instanceof Error && error.message.includes('Entity not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching entity' 
    });
  }
};

/**
 * Update entity
 * PUT /api/entities/:entityId
 */
export const updateEntityHandler = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;
    const updateData = req.body;

    // Validate UUID format
    if (!validateUuid(entityId)) {
      return res.status(400).json({ 
        error: 'Invalid entity ID format. Must be a valid UUID.' 
      });
    }

    const result = await updateEntity(entityId, updateData);

    res.json({
      success: true,
      message: 'Entity updated successfully',
      entity: result
    });

  } catch (error) {
    console.error('Update entity error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Entity not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('Another entity with this code already exists')) {
        return res.status(409).json({ error: error.message });
      }
      
      if (error.message.includes('Invalid Stellar')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while updating entity' });
  }
};

/**
 * Toggle entity active/inactive status
 * PATCH /api/entities/:entityId/toggle-status
 */
export const toggleEntityStatusHandler = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;

    // Validate UUID format
    if (!validateUuid(entityId)) {
      return res.status(400).json({ 
        error: 'Invalid entity ID format. Must be a valid UUID.' 
      });
    }

    const result = await toggleEntityStatus(entityId);

    res.json({
      success: true,
      message: `Entity status updated to ${result.is_active ? 'active' : 'inactive'}`,
      entity: result
    });

  } catch (error) {
    console.error('Toggle entity status error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Entity not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while updating entity status' });
  }
};

/**
 * Soft delete entity (deactivate)
 * DELETE /api/entities/:entityId
 */
export const deleteEntityHandler = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;

    // Validate UUID format
    if (!validateUuid(entityId)) {
      return res.status(400).json({ 
        error: 'Invalid entity ID format. Must be a valid UUID.' 
      });
    }

    const result = await deleteEntity(entityId);

    res.json({
      success: true,
      message: 'Entity deactivated successfully',
      entity: result
    });

  } catch (error) {
    console.error('Delete entity error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Entity not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      if (error.message.includes('Entity is already inactive')) {
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while deleting entity' });
  }
};

/**
 * Get entity statistics
 * GET /api/entities/statistics
 */
export const getEntityStatisticsHandler = async (req: Request, res: Response) => {
  try {
    const stats = await getEntityStats();

    res.json({
      success: true,
      statistics: stats
    });

  } catch (error) {
    console.error('Get entity statistics error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error while fetching entity statistics' 
    });
  }
};

/**
 * Generate new Stellar keypair for an entity
 * POST /api/entities/:entityId/generate-keys
 */
export const generateStellarKeysHandler = async (req: Request, res: Response) => {
  try {
    const { entityId } = req.params;

    // Validate UUID format
    if (!validateUuid(entityId)) {
      return res.status(400).json({ 
        error: 'Invalid entity ID format. Must be a valid UUID.' 
      });
    }

    const result = await generateStellarKeysForEntity(entityId);

    res.json({
      success: true,
      message: 'New Stellar keypair generated successfully',
      data: {
        stellar_public_key: result.stellar_public_key,
        stellar_secret_key: result.stellar_secret_key,
        entity: result.entity
      }
    });

  } catch (error) {
    console.error('Generate stellar keys error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Entity not found')) {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error while generating stellar keys' });
  }
};
