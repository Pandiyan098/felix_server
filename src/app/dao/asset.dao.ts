import { supabase } from '../../config/supabase';

// Define interfaces for asset data
export interface AssetCreateData {
  asset_code: string;
  asset_name: string;
  asset_provider?: string;
  asset_provider_public_key?: string;
  asset_provider_secret_key?: string;
  description?: string;
  total_supply?: number;
  category?: string;
  icon_url?: string;
  website?: string;
  created_by?: string;
}

export interface AssetRecord extends AssetCreateData {
  asset_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssetFilters {
  is_active?: boolean;
  category?: string;
}

/**
 * Creates a new asset in the database
 */
export const createAssetInDB = async (assetData: AssetCreateData & {
  asset_provider: string;
  asset_provider_public_key: string;
  asset_provider_secret_key: string;
}): Promise<AssetRecord> => {
  try {
    console.log('Creating asset in database:', assetData.asset_code);

    const { data, error } = await supabase
      .from('assets')
      .insert([{
        asset_code: assetData.asset_code,
        asset_name: assetData.asset_name,
        asset_provider: assetData.asset_provider,
        asset_provider_public_key: assetData.asset_provider_public_key,
        asset_provider_secret_key: assetData.asset_provider_secret_key,
        description: assetData.description || null,
        total_supply: assetData.total_supply ?? null,
        category: assetData.category || null,
        icon_url: assetData.icon_url || null,
        website: assetData.website || null,
        is_active: true, // New assets are active by default
        created_by: assetData.created_by || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error creating asset:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from asset creation');
    }

    console.log('Asset created successfully in database with ID:', data.asset_id);
    return data;

  } catch (error) {
    console.error('DAO createAssetInDB error:', error);
    throw error;
  }
};

/**
 * Gets all assets from database with filtering and pagination
 */
export const getAllAssetsFromDB = async (
  limit: number, 
  offset: number, 
  filters: AssetFilters
): Promise<{ assets: AssetRecord[]; total: number }> => {
  try {
    console.log('Fetching assets from database:', { limit, offset, filters });

    let query = supabase
      .from('assets')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error fetching assets:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`Retrieved ${data?.length || 0} assets from database (total: ${count})`);

    return {
      assets: data || [],
      total: count || 0
    };

  } catch (error) {
    console.error('DAO getAllAssetsFromDB error:', error);
    throw error;
  }
};

/**
 * Gets asset by ID from database
 */
export const getAssetByIdFromDB = async (assetId: string): Promise<AssetRecord | null> => {
  try {
    console.log('Fetching asset by ID from database:', assetId);

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('asset_id', assetId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('Asset not found in database:', assetId);
        return null;
      }
      
      console.error('Database error fetching asset by ID:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Asset found in database:', data?.asset_code);
    return data;

  } catch (error) {
    console.error('DAO getAssetByIdFromDB error:', error);
    throw error;
  }
};

/**
 * Updates asset status in database
 */
export const updateAssetStatus = async (
  assetId: string, 
  isActive: boolean, 
  updatedBy?: string
): Promise<AssetRecord> => {
  try {
    console.log('Updating asset status in database:', { assetId, isActive });

    const { data, error } = await supabase
      .from('assets')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('asset_id', assetId)
      .select()
      .single();

    if (error) {
      console.error('Database error updating asset status:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      throw new Error('Asset not found or update failed');
    }

    console.log('Asset status updated successfully in database');
    return data;

  } catch (error) {
    console.error('DAO updateAssetStatus error:', error);
    throw error;
  }
};

/**
 * Gets asset statistics from database
 */
export const getAssetStatistics = async (): Promise<{
  total_assets: number;
  active_assets: number;
  inactive_assets: number;
  categories: { category: string; count: number }[];
}> => {
  try {
    console.log('Fetching asset statistics from database');

    // Get total and status counts
    const { data: statusData, error: statusError } = await supabase
      .from('assets')
      .select('is_active');

    if (statusError) {
      throw new Error(`Database error: ${statusError.message}`);
    }

    // Get category counts
    const { data: categoryData, error: categoryError } = await supabase
      .from('assets')
      .select('category')
      .not('category', 'is', null);

    if (categoryError) {
      throw new Error(`Database error: ${categoryError.message}`);
    }

    const total_assets = statusData?.length || 0;
    const active_assets = statusData?.filter(item => item.is_active).length || 0;
    const inactive_assets = total_assets - active_assets;

    // Count categories
    const categoryCount: { [key: string]: number } = {};
    categoryData?.forEach(item => {
      if (item.category) {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      }
    });

    const categories = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));

    console.log('Asset statistics retrieved successfully');

    return {
      total_assets,
      active_assets,
      inactive_assets,
      categories
    };

  } catch (error) {
    console.error('DAO getAssetStatistics error:', error);
    throw error;
  }
};
