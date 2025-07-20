import express from 'express';
import { 
  createEntityHandler,
  getAllEntitiesHandler,
  getEntityByIdHandler,
  getEntityByCodeHandler,
  updateEntityHandler,
  toggleEntityStatusHandler,
  deleteEntityHandler,
  getEntityStatisticsHandler,
  generateStellarKeysHandler
} from '../controllers/entity.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { 
  validateRequest,
  createEntitySchema,
  getEntitiesSchema,
  getEntityByIdSchema,
  getEntityByCodeSchema,
  updateEntitySchema,
  toggleEntityStatusSchema,
  deleteEntitySchema,
  generateStellarKeysSchema
} from '../validations/entity.validation';

const router = express.Router();

// Create new entity
// POST /api/entities
router.post('/entities', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(createEntitySchema), 
  createEntityHandler
);

// Get all entities with filtering and pagination
// GET /api/entities
router.get('/entities',
  validateRequest(getEntitiesSchema), 
  getAllEntitiesHandler
);

// Get entity statistics
// GET /api/entities/statistics
router.get('/entities/statistics',
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  getEntityStatisticsHandler
);

// Get entity details by code
// GET /api/entities/code/:code
router.get('/entities/code/:code', 
  validateRequest(getEntityByCodeSchema), 
  getEntityByCodeHandler
);

// Get entity details by ID
// GET /api/entities/:entityId
router.get('/entities/:entityId', 
  validateRequest(getEntityByIdSchema), 
  getEntityByIdHandler
);

// Update entity
// PUT /api/entities/:entityId
router.put('/entities/:entityId', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(updateEntitySchema), 
  updateEntityHandler
);

// Toggle entity active/inactive status
// PATCH /api/entities/:entityId/toggle-status
router.patch('/entities/:entityId/toggle-status', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(toggleEntityStatusSchema), 
  toggleEntityStatusHandler
);

// Generate new Stellar keypair for an entity
// POST /api/entities/:entityId/generate-keys
router.post('/entities/:entityId/generate-keys',  
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(generateStellarKeysSchema), 
  generateStellarKeysHandler
);

// Soft delete entity (deactivate)
// DELETE /api/entities/:entityId
router.delete('/entities/:entityId', 
  authenticateToken,
  requireRole(['superuser', 'devops-admin', 'qa-admin']),
  validateRequest(deleteEntitySchema), 
  deleteEntityHandler
);

export default router;
