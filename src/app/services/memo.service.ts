import { v4 as uuidv4 } from 'uuid';
import * as StellarSdk from 'stellar-sdk';
import { saveMemo, getMemoById, updateMemoStatus, updateWalletBalancesAfterPayment } from '../dao/memo.dao';
import { STELLAR_CONFIG, getNetworkPassphrase } from '../../config/stellar';
import { logMemoTransaction } from './wallet.service';
import { supabase } from '../../config/supabase';

const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
// Use the same issuer public key as in wallet service
const blueDollar = new StellarSdk.Asset(STELLAR_CONFIG.CUSTOM_ASSET_CODE, STELLAR_CONFIG.ISSUER_PUBLIC_KEY);

// Helper function to get profile ID by public key
const getProfileIdByPublicKey = async (publicKey: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('public_key', publicKey)
      .single();
    
    if (error) {
      console.warn(`Profile not found for public key ${publicKey}:`, error.message);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error getting profile ID:', error);
    return null;
  }
};

// Helper function to get profile ID from users table by public key
const getUserIdByPublicKey = async (publicKey: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('public_key', publicKey)
      .single();
    
    if (error) {
      console.warn(`User not found for public key ${publicKey}:`, error.message);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Helper function to get a valid user ID (profile or user)
const getValidUserId = async (publicKey: string): Promise<string> => {
  // Try profiles table first
  let userId = await getProfileIdByPublicKey(publicKey);
  
  if (!userId) {
    // Try users table if not found in profiles
    userId = await getUserIdByPublicKey(publicKey);
  }
  
  if (!userId) {
    // If still not found, create a dummy UUID or use the public key as fallback
    console.warn(`No user ID found for public key ${publicKey}, using fallback`);
    return uuidv4(); // Create a new UUID as fallback
  }
  
  return userId;
};

export const createMemo = async (creatorKey: string, memo: string, bdAmount: number, assetId: string, description:string, rating: number) => {
  // Validate creatorKey format (should be a Stellar public key)
  if (!creatorKey || !creatorKey.startsWith('G')) {
    throw new Error('Invalid creatorKey: must be a valid Stellar public key starting with G');
  }
  
  // Validate and format the amount
  if (isNaN(bdAmount) || bdAmount <= 0) {
    throw new Error('Invalid amount: must be a positive number');
  }
  
  // Format amount to ensure it has max 7 decimal places
  const formattedAmount = parseFloat(bdAmount.toString()).toFixed(7);
  
  const memoId = uuidv4();
  const saved = await saveMemo({
    id: memoId,
    creatorKey, // This should be a valid Stellar public key
    memo,
    bdAmount: parseFloat(formattedAmount), // Store as number but formatted
    assetId,
    timestamp: new Date().toISOString(),
    description,
    rating
  });

  return { message: 'Memo created', memoId };
};

export const payForMemo = async (buyerSecret: string, memoId: string) => {
  try {
    console.log('Starting payForMemo with memoId:', memoId);
    
    const memoData = await getMemoById(memoId);
    if (!memoData) {
      throw new Error('Memo not found');
    }
    
    console.log('Memo data retrieved:', {
      sender_id: memoData.sender_id,
      amount: memoData.amount,
      memo: memoData.memo
    });

    // Ensure amount is properly formatted as a string with max 7 decimal places
    const amount = parseFloat(memoData.amount).toFixed(7);
    
    // Validate amount format
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    console.log('Creating buyer keypair...');
    const buyerKeypair = StellarSdk.Keypair.fromSecret(buyerSecret);
    console.log('Buyer public key:', buyerKeypair.publicKey());

    console.log('Loading buyer account...');
    const buyerAccount = await server.loadAccount(buyerKeypair.publicKey());
    console.log('Buyer account loaded successfully');

    // Check if buyer has trustline for BD asset
    const hasTrustline = buyerAccount.balances.some(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );

    if (!hasTrustline) {
      throw new Error('Buyer does not have trustline for BD asset. Create trustline first.');
    }

    // Check if buyer has enough BD balance
    const bdBalance = buyerAccount.balances.find(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );

    if (!bdBalance || parseFloat(bdBalance.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient BD balance. Available: ${bdBalance?.balance || '0'}, Required: ${amount}`);
    }

    // Validate that sender_id is a valid Stellar public key
    if (!memoData.sender_id || !memoData.sender_id.startsWith('G')) {
      throw new Error('Invalid memo sender_id: must be a valid Stellar public key');
    }

    console.log('Building transaction...');
    const tx = new StellarSdk.TransactionBuilder(buyerAccount, {
      fee: (await server.fetchBaseFee()).toString(),
      networkPassphrase: getNetworkPassphrase(),
    })
    .addOperation(StellarSdk.Operation.payment({
      destination: memoData.sender_id, // This should be a valid Stellar public key
      asset: blueDollar,
      amount: amount
    }))
    .addMemo(StellarSdk.Memo.text(memoData.memo))
    .setTimeout(STELLAR_CONFIG.TRANSACTION_TIMEOUT)
    .build();

    console.log('Signing transaction...');
    tx.sign(buyerKeypair);
    
    console.log('Submitting transaction...');
    const result = await server.submitTransaction(tx);
    console.log('Transaction successful:', result.hash);

    // Update memo status to completed
    console.log('Updating memo status to completed...');
    await updateMemoStatus(memoId, 'completed', result.hash);

    // Update wallet balances for both buyer and seller
    console.log('Updating wallet balances...');
    await updateWalletBalancesAfterPayment(buyerKeypair.publicKey(), memoData.sender_id, amount);

    // Log the transaction with debit and credit entries
    console.log('Logging memo transaction...');
    try {
      // Get user IDs for both buyer and seller
      const buyerUserId = await getValidUserId(buyerKeypair.publicKey());
      const sellerUserId = await getValidUserId(memoData.sender_id);
      
      // Use the first available user ID as table_admin_id (or seller as admin)
      const tableAdminId = sellerUserId;
      
      const transactionLog = await logMemoTransaction({
        service_id: memoId, // Use memo ID as service ID
        sender_public_key: buyerKeypair.publicKey(), // Buyer's Stellar public key
        receiver_public_key: memoData.sender_id, // Seller's Stellar public key
        sender_user_id: buyerUserId, // Buyer's user ID
        receiver_user_id: sellerUserId, // Seller's user ID
        amount: amount,
        currency: 'BLUEDOLLAR',
        status: 'completed',
        stellar_transaction_hash: result.hash,
        table_admin_id: tableAdminId
      });
      
      console.log('Transaction logged successfully:', {
        debit_entry_id: transactionLog.debit_entry?.id,
        credit_entry_id: transactionLog.credit_entry?.id
      });
      
      return {
        message: `Payment of ${amount} BD sent successfully`,
        receiver: memoData.sender_id,
        txHash: result.hash,
        status: 'completed',
        transaction_log: {
          debit_entry: transactionLog.debit_entry,
          credit_entry: transactionLog.credit_entry,
          memo_id: memoId
        }
      };
      
    } catch (logError) {
      console.error('Failed to log transaction, but payment was successful:', logError);
      
      // Return success response even if logging fails
      return {
        message: `Payment of ${amount} BD sent successfully`,
        receiver: memoData.sender_id,
        txHash: result.hash,
        status: 'completed',
        warning: 'Transaction completed but logging failed'
      };
    }
  } catch (error) {
    console.error('payForMemo error:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('tx_failed')) {
        throw new Error(`Transaction failed: ${error.message}`);
      } else if (error.message.includes('tx_bad_auth')) {
        throw new Error('Invalid secret key or insufficient authorization');
      } else if (error.message.includes('tx_insufficient_balance')) {
        throw new Error('Insufficient balance for transaction');
      } else if (error.message.includes('tx_no_source_account')) {
        throw new Error('Source account not found');
      } else {
        throw new Error(`Payment failed: ${error.message}`);
      }
    }
    
    throw error;
  }
};