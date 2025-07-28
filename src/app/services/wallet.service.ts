import * as StellarSdk from 'stellar-sdk';
import fetch from 'node-fetch';
import { saveWallet, getWallets, getWalletAmountsByKeypair, saveWalletAmounts, getAllServicesFromDB } from '../dao/wallet.dao';
import { supabase, Profile } from '../../config/supabase';
import { generatePassword } from '../../utils/passwordGenerator';
import { v4 as uuidv4 } from 'uuid';
import { STELLAR_CONFIG, getNetworkPassphrase, validateStellarConfig } from '../../config/stellar';

// Initialize Stellar server with configuration
const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

// Validate configuration on startup
validateStellarConfig();

// Define custom asset using configuration
const blueDollar = new StellarSdk.Asset(STELLAR_CONFIG.CUSTOM_ASSET_CODE, STELLAR_CONFIG.ISSUER_PUBLIC_KEY);

// Fund new account using Friendbot (testnet only)
const fundAccount = async (publicKey: string) => {
  const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Friendbot funding failed for ${publicKey}`);
  return res.json();
};

// Create trustline to BlueDollar asset
const createTrustline = async (secret: string) => {
  const keypair = StellarSdk.Keypair.fromSecret(secret);
  const account = await server.loadAccount(keypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(account, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(StellarSdk.Operation.changeTrust({
      asset: blueDollar,
    }))
    .setTimeout(30)
    .build();

  transaction.sign(keypair);
  await server.submitTransaction(transaction);
};

// Export the createTrustline function so it can be called from controllers
export const createTrustlineForAccount = async (secret: string) => {
  try {
    console.log("Creating trustline for BD asset...");
    await createTrustline(secret);
    console.log("Trustline created successfully");
    return { message: "Trustline created successfully" };
  } catch (error) {
    console.error("Error creating trustline:", error);
    throw error;
  }
};

// Send BlueDollar asset
const sendBlueDollar = async (senderSecret: string, receiverPublic: string, amount: string) => {
  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: receiverPublic,
      asset: blueDollar,
      amount,
    }))
    .setTimeout(30)
    .build();

  transaction.sign(senderKeypair);
  await server.submitTransaction(transaction);
};

// Check issuer account status
const checkIssuerAccount = async () => {
  try {
    const issuerKeypair = StellarSdk.Keypair.fromSecret(STELLAR_CONFIG.ISSUER_SECRET_KEY);
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
    console.log("Issuer account loaded successfully");
    
    // Check if issuer has enough XLM for fees
    const xlmBalance = issuerAccount.balances.find(balance => balance.asset_type === 'native');
    if (!xlmBalance || parseFloat(xlmBalance.balance) < 1) {
      throw new Error('Issuer account has insufficient XLM for fees');
    }
    
    return true;
  } catch (error) {
    console.error("Issuer account check failed:", error);
    throw new Error('Issuer account not found or not funded');
  }
};

// Create account with user details and store in Supabase
export const createAccountWithDetails = async (userData: {
  username: string;
  email: string;
  role: string;
  entity_belongs: string;
  entity_admin_name: string;
}) => {
  try {
    // Check issuer account first
    await checkIssuerAccount();
    
    // Generate Stellar keypair
    const keypair = StellarSdk.Keypair.random();
    const publicKey = keypair.publicKey();
    const secretKey = keypair.secret();
    
    // Generate auto password
    const password = generatePassword();
    
    console.log("Funding account:", publicKey);
    await fundAccount(publicKey);
    
    console.log("Creating trustline for BD asset");
    await createTrustline(secretKey);
    
    console.log("Sending 500 BD to account");
    await sendBlueDollar(STELLAR_CONFIG.ISSUER_SECRET_KEY, publicKey, '500');
    
    // Prepare profile data for Supabase
    const now = new Date().toISOString();
    const profileData: Profile = {
      id: uuidv4(),
      username: userData.username,
      email: userData.email,
      password: password,
      public_key: publicKey,
      secret_key: secretKey,
      role: userData.role,
      entity_belongs: userData.entity_belongs,
      entity_admin_name: userData.entity_admin_name,
      created_at: now,
      updated_at: now,
    };
    
    // Insert into Supabase profiles table
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select();
    
    if (error) {
      console.error("Supabase error:", error);
      throw new Error(`Failed to save profile: ${error.message}`);
    }
    
    console.log("Profile saved to Supabase successfully");
    
    return {
      message: 'Account created successfully with 10 XLM and 500 BD',
      profile: {
        ...profileData,
        password: password, // Return password for user
        id: data?.[0]?.id
      },
      stellar_info: {
        public_key: publicKey,
        xlm_balance: '10',
        bd_balance: '500',
        trustline_created: true
      }
    };
  } catch (error) {
    console.error("Error creating account:", error);
    throw error;
  }
};

// Create two wallets, trust BlueDollar, and fund each with 500 BD
export const createTwoWallets = async () => {
  try {
    // Check issuer account first
    await checkIssuerAccount();
    
    const sender = StellarSdk.Keypair.random();
    const receiver = StellarSdk.Keypair.random();

    console.log("Funding sender account:", sender.publicKey());
    await fundAccount(sender.publicKey());
    
    console.log("Funding receiver account:", receiver.publicKey());
    await fundAccount(receiver.publicKey());

    console.log("Creating trustline for sender");
    await createTrustline(sender.secret());
    
    console.log("Creating trustline for receiver");
    await createTrustline(receiver.secret());

    console.log("Sending 500 BD to sender");
    await sendBlueDollar(STELLAR_CONFIG.ISSUER_SECRET_KEY, sender.publicKey(), '500');
    
    console.log("Sending 500 BD to receiver");
    await sendBlueDollar(STELLAR_CONFIG.ISSUER_SECRET_KEY, receiver.publicKey(), '500');

    const savedSender = await saveWallet('sender', sender.publicKey(), sender.secret());
    const savedReceiver = await saveWallet('receiver', receiver.publicKey(), receiver.secret());

    return {
      message: 'Two wallets created, funded, trustlined, and loaded with 500 BD',
      sender: savedSender,
      receiver: savedReceiver
    };
  } catch (error) {
    console.error("Error creating wallets:", error);
    throw error;
  }
};

// Send native XLM from saved sender to receiver (used in default payment flow)
export const makePaymentBetweenWallets = async () => {
  const { sender, receiver } = getWallets();

  const senderKeypair = StellarSdk.Keypair.fromSecret(sender.secret);
  const senderAccount = await server.loadAccount(sender.publicKey);

  const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: receiver.publicKey,
      asset: StellarSdk.Asset.native(),
      amount: '10'
    }))
    .setTimeout(30)
    .build();

  transaction.sign(senderKeypair);

  const txResult = await server.submitTransaction(transaction);

  return {
    message: 'Payment sent from sender to receiver',
    transactionHash: txResult.hash
  };
};

// Custom native XLM payment with sender secret and receiver public key
export const makeCustomPayment = async (
  senderSecret: string,
  receiverPublic: string,
  amount: string
) => {
  const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
  const senderAccount = await server.loadAccount(senderKeypair.publicKey());

  const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: getNetworkPassphrase(),
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: receiverPublic,
      asset: StellarSdk.Asset.native(),
      amount
    }))
    .setTimeout(30)
    .build();

  transaction.sign(senderKeypair);

  const txResult = await server.submitTransaction(transaction);

  return {
    message: `Sent ${amount} XLM from sender to receiver`,
    transactionHash: txResult.hash
  };
};

export const makeBDPayment = async (
  senderSecret: string,
  receiverPublic: string,
  amount: string
) => {
  try {
    const senderKeypair = StellarSdk.Keypair.fromSecret(senderSecret);
    console.log("senderKeypair", senderKeypair.publicKey());
    
    // Load sender account
    const senderAccount = await server.loadAccount(senderKeypair.publicKey());
    console.log("senderAccount loaded successfully");

    // Check if sender has trustline for BD asset
    const hasTrustline = senderAccount.balances.some(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );

    if (!hasTrustline) {
      throw new Error('Sender does not have trustline for BD asset. Create trustline first.');
    }

    // Check if sender has enough BD balance
    const bdBalance = senderAccount.balances.find(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );

    if (!bdBalance || parseFloat(bdBalance.balance) < parseFloat(amount)) {
      throw new Error(`Insufficient BD balance. Available: ${bdBalance?.balance || '0'}, Required: ${amount}`);
    }

    const transaction = new StellarSdk.TransactionBuilder(senderAccount, {
      fee: String(await server.fetchBaseFee()),
      networkPassphrase: getNetworkPassphrase(),
    })
      .addOperation(StellarSdk.Operation.payment({
        destination: receiverPublic,
        asset: blueDollar,
        amount,
      }))
      .setTimeout(30)
      .build();

    transaction.sign(senderKeypair);
    const txResult = await server.submitTransaction(transaction);
    console.log("Transaction successful:", txResult.hash);

    return {
      message: `Sent ${amount} BD from sender to receiver`,
      transactionHash: txResult.hash
    };
  } catch (error) {
    console.error("BD Payment Error:", error);
    throw error;
  }
};

export const logTransaction = async ({
  product_id,
  user_id,
  table_admin_id,
  amount,
  currency,
  status,
  stellar_transaction_hash
}: {
  product_id: string,
  user_id: string,
  table_admin_id: string,
  amount: string,
  currency?: string,
  status?: string,
  stellar_transaction_hash?: string
}) => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      product_id,
      user_id,
      table_admin_id,
      amount,
      currency: currency || 'BLUEDOLLAR',
      status: status || 'pending',
      stellar_transaction_hash,
      created_at: now,
      updated_at: now
    }])
    .select();

  if (error) throw new Error(`Failed to log transaction: ${error.message}`);
  return data?.[0];
};

// Enhanced transaction logging for memo payments with debit/credit entries
export const logMemoTransaction = async ({
  service_id,
  sender_public_key,
  receiver_public_key,
  sender_user_id,
  receiver_user_id,
  amount,
  currency,
  status,
  stellar_transaction_hash,
  table_admin_id
}: {
  service_id: string,
  sender_public_key: string,
  receiver_public_key: string,
  sender_user_id: string,
  receiver_user_id: string,
  amount: string,
  currency?: string,
  status?: string,
  stellar_transaction_hash?: string,
  table_admin_id: string
}) => {
  const now = new Date().toISOString();
  const formattedAmount = parseFloat(amount).toFixed(7);
  const transactionCurrency = currency || 'BLUEDOLLAR';
  const transactionStatus = status || 'pending';
  
  // Create two transaction entries: one debit (sender) and one credit (receiver)
  const transactionEntries = [
    {
      product_id: service_id,
      user_id: sender_user_id,
      sender_id: sender_public_key, // Store Stellar public key
      receiver_id: receiver_public_key, // Store Stellar public key
      table_admin_id,
      amount: `-${formattedAmount}`, // Debit entry with minus sign
      currency: transactionCurrency,
      status: transactionStatus,
      stellar_transaction_hash,
      created_at: now,
      updated_at: now
    },
    {
      product_id: service_id,
      user_id: receiver_user_id,
      sender_id: receiver_public_key, // Credit entry: receiver is the sender from their perspective
      receiver_id: sender_public_key, // Credit entry: sender becomes the receiver from their perspective
      table_admin_id,
      amount: `+${formattedAmount}`, // Credit entry with plus sign
      currency: transactionCurrency,
      status: transactionStatus,
      stellar_transaction_hash,
      created_at: now,
      updated_at: now
    }
  ];
  
  // Insert both debit/credit entries
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionEntries)
    .select();

  if (error) {
    console.error('Failed to log debit/credit memo transaction:', error);
    throw new Error(`Failed to log memo transaction: ${error.message}`);
  }
  
  return {
    debit_entry: data?.[0],
    credit_entry: data?.[1],
    transaction_hash: stellar_transaction_hash
  };
};

export const createTransactionRequest = async ({
  sender_id,
  receiver_id,
  amount,
  currency,
  price,
  memo,
  xdr
}: {
  sender_id: string,
  receiver_id: string,
  amount: string,
  currency: string,
  price: string,
  memo?: string,
  xdr?: string | null
}) => {
  const { data, error } = await supabase
    .from('services')
    .insert([
      {
        id: uuidv4(),
        sender_id,
        receiver_id,
        amount,
        currency,
        price,
        memo,
        xdr,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select();
  if (error) throw new Error(error.message);
  return data?.[0];
};

// Fetch all services from the 'services' table
export const getAllServices = async (limit: number, offset: number, status?: string) => {
  return await getAllServicesFromDB(limit, offset, status);
};

// Get wallet amounts by user keypair
export const getWalletAmounts = async (userSecret: string) => {
  try {
    console.log('Starting getWalletAmounts with userSecret:', userSecret ? '***' : 'missing');
    
    // Validate secret key format
    if (!userSecret || typeof userSecret !== 'string') {
      throw new Error('Invalid userSecret: must be a non-empty string');
    }
    
    if (!userSecret.startsWith('S')) {
      throw new Error('Invalid userSecret format: must be a valid Stellar secret key starting with S');
    }
    
    if (userSecret.length !== 56) {
      throw new Error('Invalid userSecret length: must be 56 characters');
    }
    
    // First, get user data from DAO
    console.log('Getting user data from DAO...');
    const userData = await getWalletAmountsByKeypair(userSecret);
    console.log('User data retrieved:', {
      found_in_database: userData.found_in_database,
      username: userData.username
    });
    
    // Get Stellar account data
    console.log('Creating Stellar keypair...');
    const userKeypair = StellarSdk.Keypair.fromSecret(userSecret);
    console.log('User public key:', userKeypair.publicKey());
    
    console.log('Loading Stellar account...');
    const userAccount = await server.loadAccount(userKeypair.publicKey());
    console.log('Stellar account loaded successfully');
    
    // Get XLM balance
    const xlmBalance = userAccount.balances.find(balance => balance.asset_type === 'native');
    const xlmAmount = xlmBalance ? xlmBalance.balance : '0';
    console.log('XLM balance:', xlmAmount);
    
    // Get BD balance
    const bdBalance = userAccount.balances.find(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );
    const bdAmount = bdBalance ? bdBalance.balance : '0';
    console.log('BD balance:', bdAmount);
    
    // Check if user has trustline for BD
    const hasTrustline = userAccount.balances.some(balance => 
      balance.asset_type === 'credit_alphanum4' && 
      balance.asset_code === STELLAR_CONFIG.CUSTOM_ASSET_CODE && 
      balance.asset_issuer === STELLAR_CONFIG.ISSUER_PUBLIC_KEY
    );
    console.log('Has BD trustline:', hasTrustline);
    
    // Save wallet amounts to database for tracking
    const walletBalanceData = {
      public_key: userKeypair.publicKey(),
      xlm_balance: xlmAmount,
      bd_balance: bdAmount,
      has_bd_trustline: hasTrustline
    };
    
    console.log('Saving wallet amounts to database...');
    await saveWalletAmounts(walletBalanceData);
    console.log('Wallet amounts saved successfully');
    
    return {
      public_key: userKeypair.publicKey(),
      balances: {
        xlm: xlmAmount,
        bd: bdAmount
      },
      has_bd_trustline: hasTrustline,
      account_id: userAccount.id,
      user_info: {
        found_in_database: userData.found_in_database,
        username: userData.username,
        email: userData.email
      }
    };
  } catch (error) {
    console.error("Error getting wallet amounts:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('invalid encoded string')) {
        throw new Error('Invalid Stellar secret key format. Please provide a valid secret key starting with S');
      } else if (error.message.includes('Account not found')) {
        throw new Error('Stellar account not found. The account may not exist or may not be funded');
      } else if (error.message.includes('Network error')) {
        throw new Error('Network error connecting to Stellar. Please try again later');
      } else {
        throw new Error(`Failed to get wallet amounts: ${error.message}`);
      }
    }
    
    throw error;
  }
};

// Get all transactions and wallet details in a single comprehensive response
export const getAllTransactionsAndWalletDetails = async () => {
  try {
    // Get all transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.warn('Could not fetch transactions:', transactionsError.message);
    }

    // Get services data (which also contains transaction-like data)
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.warn('Could not fetch services:', servicesError.message);
    }

    // Get wallet data from the wallets table
    const { data: walletData, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: false });

    if (walletError) {
      console.warn('Could not fetch wallet details:', walletError.message);
    }

    // Get user profile data (which includes wallet info)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, email, public_key, role, entity_belongs, entity_admin_name, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (profileError) {
      console.warn('Could not fetch profile data:', profileError.message);
    }

    // Get users data (alternative user storage)
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.warn('Could not fetch users data:', usersError.message);
    }

    // Get wallet balance data
    const { data: balanceData, error: balanceError } = await supabase
      .from('wallet_balances')
      .select('*')
      .order('updated_at', { ascending: false });

    if (balanceError) {
      console.warn('Could not fetch wallet balance data:', balanceError.message);
    }

    return {
      transactions: {
        count: transactionsData?.length || 0,
        data: transactionsData || []
      },
      services: {
        count: servicesData?.length || 0,
        data: servicesData || []
      },
      wallets: {
        count: walletData?.length || 0,
        data: walletData || []
      },
      profiles: {
        count: profileData?.length || 0,
        data: profileData || []
      },
      users: {
        count: usersData?.length || 0,
        data: usersData || []
      },
      wallet_balances: {
        count: balanceData?.length || 0,
        data: balanceData || []
      },
      summary: {
        total_transactions: (transactionsData?.length || 0) + (servicesData?.length || 0),
        total_wallets: (walletData?.length || 0) + (profileData?.length || 0) + (usersData?.length || 0),
        total_tracked_balances: balanceData?.length || 0,
        last_updated: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error fetching all transactions and wallet details:', error);
    throw error;
  }
};
