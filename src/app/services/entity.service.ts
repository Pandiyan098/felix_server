import {
  EntityCreateData,
  EntityUpdateData,
  EntityRecord,
  EntityFilters,
  createEntityInDB,
  getAllEntitiesFromDB,
  getEntityByIdFromDB,
  getEntityByCodeFromDB,
  updateEntityInDB,
  updateEntityStatus,
  deleteEntityFromDB,
  getEntityStatistics
} from '../dao/entity.dao';
import { Keypair } from 'stellar-sdk';

/**
 * Create a new entity
 */
export const createEntity = async (entityData: Omit<EntityCreateData, 'stellar_public_key' | 'stellar_secret_key'> & {
  generate_stellar_keys?: boolean;
  stellar_public_key?: string;
  stellar_secret_key?: string;
}): Promise<EntityRecord> => {
  try {
    console.log('Creating entity:', entityData.code);

    // Validate required fields
    if (!entityData.name || !entityData.code || !entityData.created_by) {
      throw new Error('Missing required fields: name, code, and created_by are required');
    }

    // Check if entity with same code already exists
    const existingEntity = await getEntityByCodeFromDB(entityData.code);
    if (existingEntity) {
      throw new Error('Entity with this code already exists');
    }

    let stellar_public_key = entityData.stellar_public_key;
    let stellar_secret_key = entityData.stellar_secret_key;

    // Generate Stellar keys if requested and not provided
    if (entityData.generate_stellar_keys && (!stellar_public_key || !stellar_secret_key)) {
      console.log('Generating new Stellar keypair for entity');
      const keypair = Keypair.random();
      stellar_public_key = keypair.publicKey();
      stellar_secret_key = keypair.secret();
    }

    // Validate that we have required Stellar keys
    if (!stellar_public_key) {
      throw new Error('Stellar public key is required. Either provide it or set generate_stellar_keys=true');
    }

    // Validate Stellar public key format
    if (!stellar_public_key.startsWith('G') || stellar_public_key.length !== 56) {
      throw new Error('Invalid Stellar public key format');
    }

    // Validate Stellar secret key format if provided
    if (stellar_secret_key && (!stellar_secret_key.startsWith('S') || stellar_secret_key.length !== 56)) {
      throw new Error('Invalid Stellar secret key format');
    }

    const createData: EntityCreateData = {
      name: entityData.name,
      code: entityData.code,
      description: entityData.description,
      stellar_public_key,
      stellar_secret_key,
      asset_code: entityData.asset_code || 'BD',
      created_by: entityData.created_by,
      entity_manager_id: entityData.entity_manager_id
    };

    const entity = await createEntityInDB(createData);

    console.log('Entity created successfully:', entity.id);
    return entity;

  } catch (error) {
    console.error('Service createEntity error:', error);
    throw error;
  }
};

/**
 * Get all entities with filtering and pagination
 */
export const getAllEntities = async (
  page: number,
  limit: number,
  filters: EntityFilters
): Promise<{ entities: EntityRecord[]; total: number }> => {
  try {
    console.log('Fetching entities with filters:', { page, limit, filters });

    const offset = (page - 1) * limit;
    const result = await getAllEntitiesFromDB(limit, offset, filters);

    console.log(`Retrieved ${result.entities.length} entities`);
    return result;

  } catch (error) {
    console.error('Service getAllEntities error:', error);
    throw error;
  }
};

/**
 * Get entity by ID
 */
export const getEntityById = async (entityId: string): Promise<EntityRecord> => {
  try {
    console.log('Fetching entity by ID:', entityId);

    const entity = await getEntityByIdFromDB(entityId);

    if (!entity) {
      throw new Error('Entity not found');
    }

    console.log('Entity found:', entity.code);
    return entity;

  } catch (error) {
    console.error('Service getEntityById error:', error);
    throw error;
  }
};

/**
 * Get entity by code
 */
export const getEntityByCode = async (code: string): Promise<EntityRecord> => {
  try {
    console.log('Fetching entity by code:', code);

    const entity = await getEntityByCodeFromDB(code);

    if (!entity) {
      throw new Error('Entity not found');
    }

    console.log('Entity found:', entity.name);
    return entity;

  } catch (error) {
    console.error('Service getEntityByCode error:', error);
    throw error;
  }
};

/**
 * Update entity
 */
export const updateEntity = async (
  entityId: string,
  updateData: EntityUpdateData
): Promise<EntityRecord> => {
  try {
    console.log('Updating entity:', entityId);

    // Check if entity exists
    const existingEntity = await getEntityByIdFromDB(entityId);
    if (!existingEntity) {
      throw new Error('Entity not found');
    }

    // If updating code, check if new code is already taken by another entity
    if (updateData.code && updateData.code !== existingEntity.code) {
      const entityWithSameCode = await getEntityByCodeFromDB(updateData.code);
      if (entityWithSameCode && entityWithSameCode.id !== entityId) {
        throw new Error('Another entity with this code already exists');
      }
    }

    // Validate Stellar keys if provided
    if (updateData.stellar_public_key) {
      if (!updateData.stellar_public_key.startsWith('G') || updateData.stellar_public_key.length !== 56) {
        throw new Error('Invalid Stellar public key format');
      }
    }

    if (updateData.stellar_secret_key) {
      if (!updateData.stellar_secret_key.startsWith('S') || updateData.stellar_secret_key.length !== 56) {
        throw new Error('Invalid Stellar secret key format');
      }
    }

    const updatedEntity = await updateEntityInDB(entityId, updateData);

    console.log('Entity updated successfully:', updatedEntity.code);
    return updatedEntity;

  } catch (error) {
    console.error('Service updateEntity error:', error);
    throw error;
  }
};

/**
 * Toggle entity active/inactive status
 */
export const toggleEntityStatus = async (
  entityId: string
): Promise<EntityRecord> => {
  try {
    console.log('Toggling entity status:', entityId);

    // Get current entity to determine new status
    const currentEntity = await getEntityByIdFromDB(entityId);
    if (!currentEntity) {
      throw new Error('Entity not found');
    }

    const newStatus = !currentEntity.is_active;
    const updatedEntity = await updateEntityStatus(entityId, newStatus);

    console.log(`Entity status toggled to ${newStatus ? 'active' : 'inactive'}`);
    return updatedEntity;

  } catch (error) {
    console.error('Service toggleEntityStatus error:', error);
    throw error;
  }
};

/**
 * Soft delete entity (deactivate)
 */
export const deleteEntity = async (entityId: string): Promise<EntityRecord> => {
  try {
    console.log('Deleting entity:', entityId);

    // Check if entity exists
    const existingEntity = await getEntityByIdFromDB(entityId);
    if (!existingEntity) {
      throw new Error('Entity not found');
    }

    if (!existingEntity.is_active) {
      throw new Error('Entity is already inactive');
    }

    const deletedEntity = await deleteEntityFromDB(entityId);

    console.log('Entity soft deleted successfully');
    return deletedEntity;

  } catch (error) {
    console.error('Service deleteEntity error:', error);
    throw error;
  }
};

/**
 * Get entity statistics
 */
export const getEntityStats = async () => {
  try {
    console.log('Fetching entity statistics');

    const stats = await getEntityStatistics();

    console.log('Entity statistics retrieved successfully');
    return stats;

  } catch (error) {
    console.error('Service getEntityStats error:', error);
    throw error;
  }
};

/**
 * Generate new Stellar keypair for an entity
 */
export const generateStellarKeysForEntity = async (entityId: string): Promise<{
  stellar_public_key: string;
  stellar_secret_key: string;
  entity: EntityRecord;
}> => {
  try {
    console.log('Generating new Stellar keypair for entity:', entityId);

    // Check if entity exists
    const existingEntity = await getEntityByIdFromDB(entityId);
    if (!existingEntity) {
      throw new Error('Entity not found');
    }

    // Generate new Stellar keypair
    const keypair = Keypair.random();
    const stellar_public_key = keypair.publicKey();
    const stellar_secret_key = keypair.secret();

    // Update entity with new keys
    const updatedEntity = await updateEntityInDB(entityId, {
      stellar_public_key,
      stellar_secret_key
    });

    console.log('New Stellar keypair generated and saved for entity');
    
    return {
      stellar_public_key,
      stellar_secret_key,
      entity: updatedEntity
    };

  } catch (error) {
    console.error('Service generateStellarKeysForEntity error:', error);
    throw error;
  }
};
