import { supabase } from '../../config/supabase';

// Define interfaces for entity data
export interface EntityCreateData {
  name: string;
  code: string;
  description?: string;
  stellar_public_key: string;
  stellar_secret_key?: string;
  asset_code?: string;
  created_by: string;
  entity_manager_id?: string;
}

export interface EntityUpdateData {
  name?: string;
  code?: string;
  description?: string;
  stellar_public_key?: string;
  stellar_secret_key?: string;
  asset_code?: string;
  entity_manager_id?: string;
  is_active?: boolean;
}

export interface EntityRecord extends EntityCreateData {
  id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EntityFilters {
  is_active?: boolean;
  asset_code?: string;
  entity_manager_id?: string;
  created_by?: string;
}

/**
 * Creates a new entity in the database
 */
export const createEntityInDB = async (entityData: EntityCreateData): Promise<EntityRecord> => {
  try {
    console.log('Creating entity in database:', entityData.code);

    const { data, error } = await supabase
      .from('entities')
      .insert([{
        name: entityData.name,
        code: entityData.code,
        description: entityData.description || null,
        stellar_public_key: entityData.stellar_public_key,
        stellar_secret_key: entityData.stellar_secret_key || null,
        asset_code: entityData.asset_code || 'BD',
        created_by: entityData.created_by,
        entity_manager_id: entityData.entity_manager_id || null,
        is_active: true, // New entities are active by default
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error creating entity:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from entity creation');
    }

    console.log('Entity created successfully in database with ID:', data.id);
    return data;

  } catch (error) {
    console.error('DAO createEntityInDB error:', error);
    throw error;
  }
};

/**
 * Gets all entities from database with filtering and pagination
 */
export const getAllEntitiesFromDB = async (
  limit: number, 
  offset: number, 
  filters: EntityFilters
): Promise<{ entities: EntityRecord[]; total: number }> => {
  try {
    console.log('Fetching entities from database:', { limit, offset, filters });

    let query = supabase
      .from('entities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.asset_code) {
      query = query.eq('asset_code', filters.asset_code);
    }

    if (filters.entity_manager_id) {
      query = query.eq('entity_manager_id', filters.entity_manager_id);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error fetching entities:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Retrieved ${data?.length || 0} entities from database (total: ${count})`);

    return {
      entities: data || [],
      total: count || 0
    };

  } catch (error) {
    console.error('DAO getAllEntitiesFromDB error:', error);
    throw error;
  }
};

/**
 * Gets entity by ID from database
 */
export const getEntityByIdFromDB = async (entityId: string): Promise<EntityRecord | null> => {
  try {
    console.log('Fetching entity by ID from database:', entityId);

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', entityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('Entity not found in database:', entityId);
        return null;
      }
      
      console.error('Database error fetching entity by ID:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Entity found in database:', data?.code);
    return data;

  } catch (error) {
    console.error('DAO getEntityByIdFromDB error:', error);
    throw error;
  }
};

/**
 * Gets entity by code from database
 */
export const getEntityByCodeFromDB = async (code: string): Promise<EntityRecord | null> => {
  try {
    console.log('Fetching entity by code from database:', code);

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('Entity not found in database:', code);
        return null;
      }
      
      console.error('Database error fetching entity by code:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Entity found in database:', data?.name);
    return data;

  } catch (error) {
    console.error('DAO getEntityByCodeFromDB error:', error);
    throw error;
  }
};

/**
 * Updates entity in database
 */
export const updateEntityInDB = async (
  entityId: string,
  updateData: EntityUpdateData
): Promise<EntityRecord> => {
  try {
    console.log('Updating entity in database:', { entityId, updateData });

    const { data, error } = await supabase
      .from('entities')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating entity:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Entity not found or update failed');
    }

    console.log('Entity updated successfully in database');
    return data;

  } catch (error) {
    console.error('DAO updateEntityInDB error:', error);
    throw error;
  }
};

/**
 * Updates entity status in database
 */
export const updateEntityStatus = async (
  entityId: string, 
  isActive: boolean
): Promise<EntityRecord> => {
  try {
    console.log('Updating entity status in database:', { entityId, isActive });

    const { data, error } = await supabase
      .from('entities')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', entityId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating entity status:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Entity not found or update failed');
    }

    console.log('Entity status updated successfully in database');
    return data;

  } catch (error) {
    console.error('DAO updateEntityStatus error:', error);
    throw error;
  }
};

/**
 * Soft deletes entity from database (sets is_active to false)
 */
export const deleteEntityFromDB = async (entityId: string): Promise<EntityRecord> => {
  try {
    console.log('Soft deleting entity from database:', entityId);

    return await updateEntityStatus(entityId, false);

  } catch (error) {
    console.error('DAO deleteEntityFromDB error:', error);
    throw error;
  }
};

/**
 * Gets entity statistics from database
 */
export const getEntityStatistics = async (): Promise<{
  total_entities: number;
  active_entities: number;
  inactive_entities: number;
  asset_codes: { asset_code: string; count: number }[];
  entities_by_manager: { entity_manager_id: string; count: number }[];
}> => {
  try {
    console.log('Fetching entity statistics from database');

    // Get total and status counts
    const { data: statusData, error: statusError } = await supabase
      .from('entities')
      .select('is_active');

    if (statusError) {
      throw new Error(`Database error: ${statusError.message}`);
    }

    // Get asset code counts
    const { data: assetCodeData, error: assetCodeError } = await supabase
      .from('entities')
      .select('asset_code')
      .not('asset_code', 'is', null);

    if (assetCodeError) {
      throw new Error(`Database error: ${assetCodeError.message}`);
    }

    // Get entities by manager counts
    const { data: managerData, error: managerError } = await supabase
      .from('entities')
      .select('entity_manager_id')
      .not('entity_manager_id', 'is', null);

    if (managerError) {
      throw new Error(`Database error: ${managerError.message}`);
    }

    const total_entities = statusData?.length || 0;
    const active_entities = statusData?.filter(item => item.is_active).length || 0;
    const inactive_entities = total_entities - active_entities;

    // Count asset codes
    const assetCodeCount: { [key: string]: number } = {};
    assetCodeData?.forEach(item => {
      if (item.asset_code) {
        assetCodeCount[item.asset_code] = (assetCodeCount[item.asset_code] || 0) + 1;
      }
    });

    const asset_codes = Object.entries(assetCodeCount).map(([asset_code, count]) => ({
      asset_code,
      count
    }));

    // Count entities by manager
    const managerCount: { [key: string]: number } = {};
    managerData?.forEach(item => {
      if (item.entity_manager_id) {
        managerCount[item.entity_manager_id] = (managerCount[item.entity_manager_id] || 0) + 1;
      }
    });

    const entities_by_manager = Object.entries(managerCount).map(([entity_manager_id, count]) => ({
      entity_manager_id,
      count
    }));

    console.log('Entity statistics retrieved successfully');

    return {
      total_entities,
      active_entities,
      inactive_entities,
      asset_codes,
      entities_by_manager
    };

  } catch (error) {
    console.error('DAO getEntityStatistics error:', error);
    throw error;
  }
};
