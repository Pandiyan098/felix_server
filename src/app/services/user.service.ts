import * as StellarSdk from 'stellar-sdk';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../config/supabase';
import { STELLAR_CONFIG } from '../../config/stellar';
import fetch from 'node-fetch';
import { createKeycloakUser } from './keycloak.service';

const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
const BD_ASSET = new StellarSdk.Asset(STELLAR_CONFIG.CUSTOM_ASSET_CODE, STELLAR_CONFIG.ISSUER_PUBLIC_KEY);

// export const createUserWithKeypair = async (userData: any) => {
//   const keypair = StellarSdk.Keypair.random();

//   const profile = {
//     id: uuidv4(),
//     username: userData.username,
//     email: userData.email,
//     role: userData.role,
//     password: userData.password,
//     entity_belongs_to: userData.entity_belongs_to,
//     entity_manager: userData.entity_manager,
//     public_key: keypair.publicKey(),
//     secret_key: keypair.secret(),
//     is_wallet_funded: false,
//     is_trustline_added: false,
//     is_bd_received: false,
//     created_at: new Date().toISOString(),
//   };

//   const { error } = await supabase.from('users').insert([profile]);
//   if (error) throw new Error('Failed to save user profile');

//   return {
//     message: 'User created with keypair. Wallet, trustline, and asset funding pending.',
//     profile,
//   };
// };

export const createUserWithKeypair = async (userData: any) => {
  // 1. Attempt to create the user in Keycloak first.
  // This ensures Keycloak authentication is set up before proceeding with other data.
  try {
    await createKeycloakUser(userData.username, userData.email, userData.password);
  } catch (error: any) {
    // If Keycloak user creation fails, log the error and re-throw to stop the process.
    console.error('Failed to create user in Keycloak, aborting user creation:', error.message);
    throw new Error(`User creation failed: ${error.message}`);
  }

  // 2. If Keycloak user creation is successful, proceed to generate a Stellar keypair.
  const keypair = StellarSdk.Keypair.random();

  // Construct the user profile object to be stored in Supabase.
  const profile = {
    id: uuidv4(), // Generate a unique UUID for the user's database entry
    username: userData.username,
    email: userData.email,
    role: userData.role,
    password: userData.password, // IMPORTANT: In a production app, hash passwords before storing!
    entity_belongs_to: userData.entity_belongs_to,
    entity_manager: userData.entity_manager,
    public_key: keypair.publicKey(), // Store the Stellar public key
    secret_key: keypair.secret(), // Store the Stellar secret key (handle with extreme care in production, consider encryption or not storing directly)
    is_wallet_funded: false, // Initial status: Stellar wallet not funded
    is_trustline_added: false, // Initial status: Trustline for BD asset not added
    is_bd_received: false, // Initial status: Blue Dollar asset not received
    created_at: new Date().toISOString(), // Timestamp of creation
  };

  // 3. Save the user profile to the Supabase database.
  const { error } = await supabase.from('users').insert([profile]);
  if (error) {
    // If saving to Supabase fails, log the error and throw.
    console.error('Error saving user profile to Supabase:', error.message);
    throw new Error('Failed to save user profile to database: ' + error.message);
  }

  // Return a success message and the created profile.
  return {
    message: 'User created in Keycloak and profile saved with keypair. Wallet, trustline, and asset funding pending.',
    profile,
  };
};

export const fundWallet = async (publicKey: string) => {
  const url = `${STELLAR_CONFIG.FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Funding failed via friendbot');

  await supabase.from('users').update({ is_wallet_funded: true }).eq('public_key', publicKey);

  return { message: 'Wallet funded successfully' };
};

export const addTrustline = async (secretKey: string) => {
  const keypair = StellarSdk.Keypair.fromSecret(secretKey);
  const account = await server.loadAccount(keypair.publicKey());

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset: BD_ASSET }))
    .setTimeout(30)
    .build();

  tx.sign(keypair);
  await server.submitTransaction(tx);

  await supabase.from('users').update({ is_trustline_added: true }).eq('public_key', keypair.publicKey());

  return { message: 'Trustline added successfully' };
};

export const sendBlueDollarToUser = async (toPublicKey: string, assetCode: string) => {
  const issuerKeypair = StellarSdk.Keypair.fromSecret(STELLAR_CONFIG.ISSUER_SECRET_KEY);
  const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());
  const CUSTOM_ASSET_CODE = new StellarSdk.Asset(assetCode, STELLAR_CONFIG.ISSUER_PUBLIC_KEY);

  const tx = new StellarSdk.TransactionBuilder(issuerAccount, {
    fee: String(await server.fetchBaseFee()),
    networkPassphrase: StellarSdk.Networks.TESTNET,
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: toPublicKey,
      asset: CUSTOM_ASSET_CODE,
      amount: '500'
    }))
    .setTimeout(30)
    .build();

  tx.sign(issuerKeypair);
  await server.submitTransaction(tx);

  await supabase.from('users').update({ is_bd_received: true }).eq('public_key', toPublicKey);

  return { message: '500 BD sent successfully' };
};