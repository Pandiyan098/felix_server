import {
  createRequest,
  createProposal,
  updateProposalStatus,
  updateRequestStatus,
  getProposalById,
  getRequestById,
  getServicesDao,
  getAllProposalsByRequestId
} from '../dao/service.dao';
import StellarSdk from 'stellar-sdk';
import { logMemoTransaction } from './wallet.service';
import { supabase } from '../../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import { STELLAR_CONFIG } from '../../config/stellar';

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');

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

// Helper function to update wallet balances after payment
const updateWalletBalancesAfterServicePayment = async (
  buyerPublicKey: string, 
  sellerPublicKey: string, 
  amount: string
) => {
  try {
    // Get buyer's updated balance
    const buyerAccount = await server.loadAccount(buyerPublicKey);
    const buyerBdBalance = buyerAccount.balances.find((balance: any) => 
      balance.asset_type === 'credit_alphanum4' &&
      balance.asset_code === 'BD'
    );
    
    // Get seller's updated balance
    const sellerAccount = await server.loadAccount(sellerPublicKey);
    const sellerBdBalance = sellerAccount.balances.find((balance: any) => 
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
    console.error('Error updating wallet balances after service payment:', error);
    throw error;
  }
};

export const createServiceRequest = async ({ clientKey, description, budget, title, requirements }: { clientKey: string, description: string, budget: number, title: string, requirements: string }) => {
  return await createRequest(clientKey, description, budget, title, requirements);
};

export const proposeService = async ({ requestId, providerKey, proposalText, bidAmount }: { requestId: string, providerKey: string, proposalText: string, bidAmount: number }) => {
  return await createProposal(requestId, providerKey, proposalText, bidAmount);
};

export const acceptProposal = async ({ proposalId }: { proposalId: string }) => {
  const proposal = await getProposalById(proposalId);
  await updateProposalStatus(proposalId, 'accepted');
  await updateRequestStatus(proposal.request_id, 'accepted');
  return { message: 'Proposal accepted' };
};

export const payForService = async ({
  proposalId,
  clientSecret,
  bdIssuer
}: {
  proposalId: string;
  clientSecret: string;
  bdIssuer: string;
}) => {
  try {
    console.log('Starting payForService with proposalId:', proposalId);
    
    const proposal = await getProposalById(proposalId);
    const request = await getRequestById(proposal.request_id);

    if (proposal.status !== 'accepted' || request.status !== 'accepted') {
      throw new Error('Proposal not accepted or already paid');
    }

    console.log('Proposal and request validated:', {
      proposalId,
      requestId: proposal.request_id,
      bidAmount: proposal.bid_amount,
      providerKey: proposal.provider_key,
      clientKey: request.client_key
    });

    // Format amount with proper precision
    const amount = parseFloat(proposal.bid_amount.toString()).toFixed(7);
    
    // Validate amount format
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }

    const asset = new StellarSdk.Asset('BD', bdIssuer);
    const source = StellarSdk.Keypair.fromSecret(clientSecret);
    const sourcePublicKey = source.publicKey();
    const destinationPublicKey = proposal.provider_key;

    console.log('Payment details:', {
      from: sourcePublicKey,
      to: destinationPublicKey,
      amount: amount,
      asset: 'BD'
    });

    const [sourceAccount, destinationAccount] = await Promise.all([
      server.loadAccount(sourcePublicKey),
      server.loadAccount(destinationPublicKey)
    ]);

    console.log('Accounts loaded successfully');

    // Check if source has sufficient balance
    const sourceBdBalance = sourceAccount.balances.find((balance: any) => 
      balance.asset_type === 'credit_alphanum4' &&
      balance.asset_code === 'BD' &&
      balance.asset_issuer === bdIssuer
    );

    if (!sourceBdBalance || parseFloat(sourceBdBalance.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient BD balance. Available: ${sourceBdBalance?.balance || '0'}, Required: ${amount}`);
    }

    // Check if destination has trustline for BD asset
    const destinationTrustsAsset = destinationAccount.balances.some(
      (b: any) =>
        b.asset_type !== 'native' &&
        b.asset_code === 'BD' &&
        b.asset_issuer === bdIssuer
    );

    console.log('Destination trustline check:', destinationTrustsAsset);

    if (!destinationTrustsAsset) {
      throw new Error('Provider does not have a trustline to the BD asset');
    }

    // Build and submit transaction
    console.log('Building transaction...');
    const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: StellarSdk.Networks.TESTNET
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset,
          amount: amount
        })
      )
      .addMemo(StellarSdk.Memo.text('Service Payment'))
      .setTimeout(30)
      .build();

    console.log('Signing transaction...');
    tx.sign(source);
    
    console.log('Submitting transaction...');
    const result = await server.submitTransaction(tx);
    console.log('Transaction successful:', result.hash);

    // Update request status
    console.log('Updating request status to paid...');
    await updateRequestStatus(request.id, 'paid');
    
    // Update proposal status
    console.log('Updating proposal status to paid...');
    await updateProposalStatus(proposalId, 'paid');

    // Update wallet balances
    console.log('Updating wallet balances...');
    await updateWalletBalancesAfterServicePayment(sourcePublicKey, destinationPublicKey, amount);

    // Log the transaction with debit and credit entries
    console.log('Logging service transaction...');
    try {
      // Get user IDs for both client and provider
      const clientUserId = await getValidUserId(sourcePublicKey);
      const providerUserId = await getValidUserId(destinationPublicKey);
      
      // Use the provider as table_admin_id (or client as fallback)
      const tableAdminId = providerUserId;
      
      const transactionLog = await logMemoTransaction({
        service_id: proposalId, // Use proposal ID as service ID
        sender_public_key: sourcePublicKey, // Client's Stellar public key
        receiver_public_key: destinationPublicKey, // Provider's Stellar public key
        sender_user_id: clientUserId, // Client's user ID
        receiver_user_id: providerUserId, // Provider's user ID
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
        message: `Service payment of ${amount} BD sent successfully`,
        transactionHash: result.hash,
        status: 'completed',
        proposal_id: proposalId,
        request_id: request.id,
        amount: amount,
        currency: 'BLUEDOLLAR',
        transaction_log: {
          debit_entry: transactionLog.debit_entry,
          credit_entry: transactionLog.credit_entry,
          proposal_id: proposalId
        }
      };
      
    } catch (logError) {
      console.error('Failed to log transaction, but payment was successful:', logError);
      
      // Return success response even if logging fails
      return {
        message: `Service payment of ${amount} BD sent successfully`,
        transactionHash: result.hash,
        status: 'completed',
        proposal_id: proposalId,
        request_id: request.id,
        amount: amount,
        currency: 'BLUEDOLLAR',
        warning: 'Payment completed but transaction logging failed'
      };
    }
    
  } catch (error) {
    console.error('payForService error:', error);
    
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
      } else if (error.message.includes('Proposal not accepted')) {
        throw new Error('Proposal must be accepted before payment');
      } else {
        throw new Error(`Service payment failed: ${error.message}`);
      }
    }
    
    throw error;
  }
};


export const getAllService = async () => {
  try {
    const services = await getServicesDao();
    return services;
  } catch (error) {
    throw new Error('Failed to retrieve services');
  }
}

export const getAllproposal = async (requestId:string) => {
  try {
    console.log('Fetching proposals for requestId service:', requestId);
    
    const proposals = await getAllProposalsByRequestId(requestId);
    
    return proposals;
  } catch (error) {
    throw new Error('Failed to retrieve proposals');
  }
};