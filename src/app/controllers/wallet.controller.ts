import { Request, Response } from 'express';
import { createTwoWallets, makeCustomPayment, makeBDPayment, createTrustlineForAccount, createAccountWithDetails, logTransaction, createTransactionRequest, getWalletAmounts, getAllServices, getAllTransactionsAndWalletDetails } from '../services/wallet.service';
import fetch from 'node-fetch';
import { supabase } from '../../config/supabase';
import * as StellarSdk from 'stellar-sdk';
import { v4 as uuidv4 } from 'uuid';

export const createWalletsHandler = async (_req: Request, res: Response) => {
  try {
    const result = await createTwoWallets();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createAccountHandler = async (req: Request, res: Response) => {
  try {
    const { username, email, role, entity_belongs, entity_admin_name } = req.body;
    
    // Validate required fields
    if (!username || !email || !role || !entity_belongs || !entity_admin_name) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, email, role, entity_belongs, entity_admin_name' 
      });
    }

    const result = await createAccountWithDetails({
      username,
      email,
      role,
      entity_belongs,
      entity_admin_name
    });
    
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const makePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { senderSecret, receiverPublic, amount } = req.body;
    if (!senderSecret || !receiverPublic || !amount) {
      return res.status(400).json({ error: 'Missing senderSecret, receiverPublic, or amount' });
    }

    const result = await makeCustomPayment(senderSecret, receiverPublic, amount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const makeBDPaymentHandler = async (req: Request, res: Response) => {
  try {
    const { senderSecret, receiverPublic, amount, product_id, user_id, table_admin_id } = req.body;
    if (!senderSecret || !receiverPublic || !amount || !product_id || !user_id || !table_admin_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentResult = await makeBDPayment(senderSecret, receiverPublic, amount);

    // Log the transaction as pending
    let transaction = await logTransaction({
      product_id,
      user_id,
      table_admin_id,
      amount,
      status: 'pending',
      stellar_transaction_hash: paymentResult.transactionHash
    });

    // Query Horizon API for transaction status
    const horizonUrl = `https://horizon-testnet.stellar.org/transactions/${paymentResult.transactionHash}`;
    let status = 'pending';
    try {
      const response = await fetch(horizonUrl);
      if (response.ok) {
        const txData: any = await response.json();
        if (txData.successful === true) {
          status = 'success';
          // Update transaction status in DB
          const { data, error } = await supabase
            .from('transactions')
            .update({ status: 'success', updated_at: new Date().toISOString() })
            .eq('id', transaction.id)
            .select();
          if (!error && data && data.length > 0) {
            transaction = data[0];
          }
        }
      }
    } catch (err) {
      // If Horizon fails, keep status as pending
      console.error('Error checking Horizon for transaction status:', err);
    }

    res.json({
      ...paymentResult,
      transaction
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createTrustlineHandler = async (req: Request, res: Response) => {
  try {
    const { secret } = req.body;
    if (!secret) {
      return res.status(400).json({ error: 'Missing secret key' });
    }

    const result = await createTrustlineForAccount(secret);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getTransactionsByUserHandler = async (req: Request, res: Response) => {
  try {
    const { user_id, status } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid user_id' });
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('sender_id', user_id)
      // .eq('status', status || "completed")
      .order('created_at', { ascending: false });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ transactions: data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getPersonsByAdminHandler = async (req: Request, res: Response) => {
  try {
    const { table_admin_id } = req.query;
    if (!table_admin_id || typeof table_admin_id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid table_admin_id' });
    }
    // Query the persons table for the given table_admin_id
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('entity_manager', table_admin_id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No users found for this table_admin_id' });
    }
    res.json({ users: data });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// API 1: Create Transaction Request
export const createStellarTransactionRequestHandler = async (req: Request, res: Response) => {
  try {
    const { sender_id, receiver_id, amount, currency, price, memo, multi_sig } = req.body;
    if (!sender_id || !receiver_id || !amount || !currency || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let xdr = null;
    if (multi_sig) {
      // Load sender account to get the correct sequence number
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const senderAccount = await server.loadAccount(sender_id);
      const tx = new StellarSdk.TransactionBuilder(
        senderAccount,
        {
          fee: '100',
          networkPassphrase: StellarSdk.Networks.TESTNET,
        }
      )
        .addOperation(StellarSdk.Operation.payment({
          destination: receiver_id,
          asset: currency === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(currency, sender_id),
          amount: amount.toString(),
        }))
        .addMemo(memo ? StellarSdk.Memo.text(memo) : StellarSdk.Memo.none())
        .setTimeout(86400) // 1 day
        .build();
      xdr = tx.toXDR();
    }

    // Use the service function to insert
    const request = await createTransactionRequest({
      sender_id,
      receiver_id,
      amount,
      currency,
      price,
      memo,
      xdr
    });
    res.status(201).json({ request });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// API 2: Accept Transaction Request (single or multi-sig)
export const acceptStellarTransactionRequestHandler = async (req: Request, res: Response) => {
  try {
    const { request_id, signer_secret, multi_sig } = req.body;
    if (!request_id || !signer_secret) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Fetch the transaction request from services table
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', request_id)
      .single();
    if (error || !data) {
      return res.status(404).json({ error: 'Transaction request not found' });
    }
    let tx;
    if (data.xdr) {
      // Multi-sig: add signature
      tx = new StellarSdk.Transaction(data.xdr, StellarSdk.Networks.TESTNET);
      const signerKeypair = StellarSdk.Keypair.fromSecret(signer_secret);
      // Debug: log transaction source and signing public key
      console.log('Transaction source account:', tx.source);
      console.log('Signing public key:', signerKeypair.publicKey());
      tx.sign(signerKeypair);
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      try {
        const result = await server.submitTransaction(tx);
        // Update status in DB
        await supabase
          .from('services')
          .update({ status: 'success', xdr: tx.toXDR() })
          .eq('id', request_id);
        return res.json({ message: 'Transaction submitted', hash: result.hash });
      } catch (err) {
        const errorObj = err as any;
        return res.status(400).json({ error: 'Stellar submission failed', details: errorObj.response?.data || errorObj.message });
      }
    }
    // Single-sig: build, sign, and submit
    const senderKeypair = StellarSdk.Keypair.fromSecret(signer_secret);
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const senderAccount = await server.loadAccount(senderKeypair.publicKey());
    tx = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: '100',
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: data.receiver_id,
        asset: data.currency === 'XLM' ? StellarSdk.Asset.native() : new StellarSdk.Asset(data.currency, senderKeypair.publicKey()),
        amount: data.amount.toString(),
      }))
      .addMemo(data.memo ? StellarSdk.Memo.text(data.memo) : StellarSdk.Memo.none())
      .setTimeout(86400) // 1 day
      .build();
    // Debug: log transaction source and signing public key
    console.log('Transaction source account:', tx.source);
    console.log('Signing public key:', senderKeypair.publicKey());
    tx.sign(senderKeypair);
    try {
      const result = await server.submitTransaction(tx);
      await supabase
        .from('services')
        .update({ status: 'success', xdr: tx.toXDR() })
        .eq('id', request_id);
      return res.json({ message: 'Transaction submitted', hash: result.hash });
    } catch (err) {
      const errorObj = err as any;
      return res.status(400).json({ error: 'Stellar submission failed', details: errorObj.response?.data || errorObj.message });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

// Get wallet amounts by user keypair
export const getWalletAmountsHandler = async (req: Request, res: Response) => {
  try {
    const { userSecret } = req.query;
    console.log('Get wallet amounts request received:', {
      userSecret: userSecret ? '***' : 'missing (query param)'
    });
    
    if (!userSecret) {
      return res.status(400).json({ 
        error: 'Missing required field: userSecret (as query parameter)' 
      });
    }

    // Validate userSecret format
    if (typeof userSecret !== 'string') {
      return res.status(400).json({ 
        error: 'userSecret must be a string' 
      });
    }

    if (!userSecret.startsWith('S')) {
      return res.status(400).json({ 
        error: 'Invalid userSecret format. Must be a valid Stellar secret key starting with S' 
      });
    }

    if (userSecret.length !== 56) {
      return res.status(400).json({ 
        error: 'Invalid userSecret length. Must be 56 characters' 
      });
    }

    console.log('Calling getWalletAmounts service...');
    const result = await getWalletAmounts(userSecret);
    console.log('Get wallet amounts successful');
    res.json(result);
  } catch (err) {
    console.error('Get wallet amounts error:', err);
    
    // Return appropriate HTTP status based on error type
    if (err instanceof Error) {
      if (err.message.includes('Invalid userSecret') || err.message.includes('Invalid Stellar secret key')) {
        return res.status(400).json({ error: err.message });
      } else if (err.message.includes('Account not found')) {
        return res.status(404).json({ error: err.message });
      } else if (err.message.includes('Network error')) {
        return res.status(503).json({ error: err.message });
      } else {
        return res.status(500).json({ error: err.message });
      }
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handler to fetch all services
export const getAllServicesHandler = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    const { data, count } = await getAllServices(limit, offset, status);
    res.json({ services: data, total: count, limit, offset, status });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getAllTransactionsAndWalletDetailsHandler = async (_req: Request, res: Response) => {
  try {
    const data = await getAllTransactionsAndWalletDetails();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const makeBDPaymentById = async (req: Request, res: Response) => {
  try {
    const { senderSecret, receiverPublic, amount } = req.body;
    if (!senderSecret || !receiverPublic || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const paymentResult = await makeBDPayment(senderSecret, receiverPublic, amount);
    const horizonUrl = `https://horizon-testnet.stellar.org/transactions/${paymentResult.transactionHash}`;
    try{
      const response = await fetch(horizonUrl);
      if (response.ok) {
        const txData: any = await response.json();
        if (txData.successful === true) {
          return res.json({ message: 'Payment successful', transactionHash: paymentResult.transactionHash });
        }
      }
      return res.status(400).json({ error: 'Payment not successful' });
    } catch (err) {
      console.error('Error checking Horizon for transaction status:', err);
      return res.status(500).json({ error: 'Failed to check transaction status' });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
