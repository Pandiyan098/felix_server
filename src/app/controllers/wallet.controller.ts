import { Request, Response } from 'express';
import { createTwoWallets, makeCustomPayment, makeBDPayment, createTrustlineForAccount, createAccountWithDetails, logTransaction } from '../services/wallet.service';
import fetch from 'node-fetch';
import { supabase } from '../../config/supabase';

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
    const { user_id } = req.query;
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid user_id' });
    }
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user_id)
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
      .from('profiles')
      .select('*')
      .eq('entity_admin_name', table_admin_id)
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