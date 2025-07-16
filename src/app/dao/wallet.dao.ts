import { supabase } from '../../config/supabase';

export const saveWallet = async (name: string, publicKey: string, secret: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .insert([{ name, public_key: publicKey, secret_key: secret }])
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
};

export const getWallets = () => {
  return {
    sender: {
      publicKey: 'GABC1234567890ABCDEF',
      secret: 'SABC1234567890ABCDEF'
    },
    receiver: {
      publicKey: 'GDEF1234567890ABCDEF',
      secret: 'SDEF1234567890ABCDEF'
    }
  };
};

// Get wallet amounts by user keypair
export const getWalletAmountsByKeypair = async (userSecret: string) => {
  try {
    // First, check if the user exists in our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('public_key, secret_key, username, email')
      .eq('secret_key', userSecret)
      .single();

    if (profileError) {
      console.error('Profile lookup error:', profileError);
      // If not found in users, we'll still try to get balances from Stellar
      return {
        found_in_database: false,
        public_key: null,
        username: null,
        email: null
      };
    }

    return {
      found_in_database: true,
      public_key: profileData.public_key,
      secret_key: profileData.secret_key,
      username: profileData.username,
      email: profileData.email
    };
  } catch (error) {
    console.error('DAO getWalletAmountsByKeypair error:', error);
    throw error;
  }
};

// Save wallet amounts to database for tracking
export const saveWalletAmounts = async (userData: {
  public_key: string,
  xlm_balance: string,
  bd_balance: string,
  has_bd_trustline: boolean
}) => {
  try {
    const { data, error } = await supabase
      .from('wallet_balances')
      .upsert([{
        public_key: userData.public_key,
        xlm_balance: userData.xlm_balance,
        bd_balance: userData.bd_balance,
        has_bd_trustline: userData.has_bd_trustline,
        updated_at: new Date().toISOString()
      }], {
        onConflict: 'public_key'
      })
      .select();

    if (error) {
      console.error('Save wallet amounts error:', error);
      throw new Error(`Failed to save wallet amounts: ${error.message}`);
    }

    return data?.[0];
  } catch (error) {
    console.error('DAO saveWalletAmounts error:', error);
    throw error;
  }
};

// Fetch all services from the 'services' table with pagination and optional status filter
export const getAllServicesFromDB = async (limit: number, offset: number, status?: string) => {
  let query = supabase
    .from('services')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (true) {
    query = query.eq('status', status || "pending");
  }
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, count };
};
