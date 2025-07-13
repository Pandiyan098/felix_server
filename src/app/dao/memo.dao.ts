import { supabase } from '../../config/supabase';

export const saveMemo = async (memo: any) => {
  console.log("saved memo:", memo);
  
  // Ensure amount is properly formatted as a string with max 7 decimal places
  const formattedAmount = parseFloat(memo.bdAmount).toFixed(7);
  
  // Use the services table instead of memos table
  const { data, error } = await supabase.from('services').insert([{
    id: memo.id,
    sender_id: memo.creatorKey,
    receiver_id: memo.creatorKey,
    amount: formattedAmount,
    currency: memo.assetId,
    price: formattedAmount,
    memo: memo.memo,
    status: 'pending',
    created_at: memo.timestamp,
    updated_at: memo.timestamp,
    description: memo.description,
    rating: memo.rating
  }]).select();
  if (error) {
    console.error('Supabase save memo error:', error);
    throw new Error(`Failed to save memo: ${error.message || error.details || 'Unknown error'}`);
  }
  console.log("data", data);
  
  return data;
};

export const getMemoById = async (id: string) => {
  // Get memo from services table
  const { data, error } = await supabase.from('services').select('*').eq('id', id).single();
  if (error) {
    console.error('Supabase get memo error:', error);
    throw new Error(`Failed to get memo: ${error.message || error.details || 'Unknown error'}`);
  }
  return data;
};

// Update memo status after payment
export const updateMemoStatus = async (memoId: string, status: string, txHash?: string) => {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (txHash) {
      updateData.stellar_transaction_hash = txHash;
    }
    
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', memoId)
      .select();
    
    if (error) {
      console.error('Supabase update memo status error:', error);
      throw new Error(`Failed to update memo status: ${error.message}`);
    }
    
    return data?.[0];
  } catch (error) {
    console.error('DAO updateMemoStatus error:', error);
    throw error;
  }
};

// Update wallet balances after payment
export const updateWalletBalancesAfterPayment = async (
  buyerPublicKey: string, 
  sellerPublicKey: string, 
  amount: string
) => {
  try {
    // Get current balances from Stellar network
    const server = new (await import('stellar-sdk')).Horizon.Server('https://horizon-testnet.stellar.org');
    
    // Get buyer's updated balance
    const buyerAccount = await server.loadAccount(buyerPublicKey);
    const buyerBdBalance = buyerAccount.balances.find(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === 'BD'
    );
    
    // Get seller's updated balance
    const sellerAccount = await server.loadAccount(sellerPublicKey);
    const sellerBdBalance = sellerAccount.balances.find(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === 'BD'
    );
    
    // Check if buyer and seller are the same (self-payment)
    const isSelfPayment = buyerPublicKey === sellerPublicKey;
    
    if (isSelfPayment) {
      // If it's a self-payment, only update one record
      const { data, error } = await supabase
        .from('wallet_balances')
        .upsert([{
          public_key: buyerPublicKey,
          bd_balance: buyerBdBalance ? buyerBdBalance.balance : '0',
          updated_at: new Date().toISOString()
        }], {
          onConflict: 'public_key'
        })
        .select();
      
      if (error) {
        console.error('Supabase update wallet balances error (self-payment):', error);
        throw new Error(`Failed to update wallet balances: ${error.message}`);
      }
      
      return data;
    } else {
      // If it's a payment between different accounts, update both
      const { data, error } = await supabase
        .from('wallet_balances')
        .upsert([
          {
            public_key: buyerPublicKey,
            bd_balance: buyerBdBalance ? buyerBdBalance.balance : '0',
            updated_at: new Date().toISOString()
          },
          {
            public_key: sellerPublicKey,
            bd_balance: sellerBdBalance ? sellerBdBalance.balance : '0',
            updated_at: new Date().toISOString()
          }
        ], {
          onConflict: 'public_key'
        })
        .select();
      
      if (error) {
        console.error('Supabase update wallet balances error:', error);
        throw new Error(`Failed to update wallet balances: ${error.message}`);
      }
      
      return data;
    }
  } catch (error) {
    console.error('DAO updateWalletBalancesAfterPayment error:', error);
    throw error;
  }
};
