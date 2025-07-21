import { supabase } from '../../config/supabase';

export interface UserAsset {
  id: string;
  user_id: string;
  asset_id: string;
  asset_code: string;
  asset_issuer: string;
  balance: number;
  trustline_limit: number;
  has_trustline: boolean;
  is_authorized: boolean;
  created_at: string;
  updated_at: string;
}

export class UserAssetService {
  /**
   * Get all assets for a user
   */
  static async getUserAssets(userId: string): Promise<UserAsset[]> {
    const { data, error } = await supabase
      .from('user_assets')
      .select(`
        *,
        assets:asset_id (
          asset_name,
          description,
          icon_url,
          website,
          is_active
        )
      `)
      .eq('user_id', userId)
      .eq('has_trustline', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user assets: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add asset to user (create trustline tracking)
   */
  static async addAssetToUser(
    userId: string, 
    assetId: string, 
    assetCode: string, 
    assetIssuer: string,
    trustlineLimit: number = 1000000000
  ): Promise<UserAsset> {
    const { data, error } = await supabase
      .from('user_assets')
      .insert({
        user_id: userId,
        asset_id: assetId,
        asset_code: assetCode,
        asset_issuer: assetIssuer,
        trustline_limit: trustlineLimit,
        has_trustline: true
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add asset to user: ${error.message}`);
    }

    return data;
  }

  /**
   * Update user asset balance
   */
  static async updateAssetBalance(
    userId: string, 
    assetCode: string, 
    newBalance: number
  ): Promise<void> {
    const { error } = await supabase
      .from('user_assets')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('asset_code', assetCode);

    if (error) {
      throw new Error(`Failed to update asset balance: ${error.message}`);
    }
  }

  /**
   * Check if user has trustline for asset
   */
  static async hasAssetTrustline(userId: string, assetCode: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_assets')
      .select('has_trustline')
      .eq('user_id', userId)
      .eq('asset_code', assetCode)
      .single();

    if (error) {
      return false;
    }

    return data?.has_trustline || false;
  }

  /**
   * Get user's preferred asset for transactions
   */
  static async getUserPreferredAsset(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('users')
      .select('preferred_asset_code')
      .eq('id', userId)
      .single();

    if (error) {
      return 'XLM'; // Default to XLM
    }

    return data?.preferred_asset_code || 'XLM';
  }

  /**
   * Set user's preferred asset
   */
  static async setUserPreferredAsset(userId: string, assetCode: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ preferred_asset_code: assetCode })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to set preferred asset: ${error.message}`);
    }
  }
}
