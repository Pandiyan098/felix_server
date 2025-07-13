import { v4 as uuidv4 } from 'uuid';
import * as StellarSdk from 'stellar-sdk';
import { saveMemo, getMemoById, updateMemoStatus, updateWalletBalancesAfterPayment } from '../dao/memo.dao';
import { STELLAR_CONFIG, getNetworkPassphrase } from '../../config/stellar';

const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
// Use the same issuer public key as in wallet service
const blueDollar = new StellarSdk.Asset(STELLAR_CONFIG.CUSTOM_ASSET_CODE, STELLAR_CONFIG.ISSUER_PUBLIC_KEY);

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

    return {
      message: `Payment of ${amount} BD sent successfully`,
      receiver: memoData.sender_id,
      txHash: result.hash,
      status: 'completed'
    };
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
