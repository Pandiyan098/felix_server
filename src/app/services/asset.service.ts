import * as StellarSdk from 'stellar-sdk';
import { STELLAR_CONFIG, getNetworkPassphrase } from '../../config/stellar';
import { 
  createAssetInDB, 
  getAllAssetsFromDB, 
  getAssetByIdFromDB, 
  updateAssetStatus,
  AssetCreateData,
  AssetFilters
} from '../dao/asset.dao';

/**
 * Creates a new custom asset issuer with Stellar keypair
 */
export const createCustomAssetIssuer = async (assetData: AssetCreateData) => {
  try {
    console.log('Creating custom asset issuer:', assetData.asset_code);

    // Generate new Stellar keypair for the asset issuer
    const issuerKeypair = StellarSdk.Keypair.random();
    const issuerPublicKey = issuerKeypair.publicKey();
    const issuerSecretKey = issuerKeypair.secret();

    console.log('Generated issuer keypair:', { 
      publicKey: issuerPublicKey,
      secretKey: '***' // Never log secret keys in production
    });

    // Create the asset in database with generated keys
    const assetRecord = await createAssetInDB({
      ...assetData,
      asset_provider: 'Stellar Network',
      asset_provider_public_key: issuerPublicKey,
      asset_provider_secret_key: issuerSecretKey
    });

    console.log('Asset created in database with ID:', assetRecord.asset_id);

    // Fund the issuer account on testnet (for production, this would be done differently)
    if (STELLAR_CONFIG.NETWORK.toUpperCase() === 'TESTNET') {
      try {
        console.log('Funding issuer account on testnet...');
        const fundingResponse = await fetch(`${STELLAR_CONFIG.FRIENDBOT_URL}?addr=${issuerPublicKey}`);
        
        if (!fundingResponse.ok) {
          console.warn('Failed to fund issuer account, but continuing...');
        } else {
          console.log('Issuer account funded successfully');
        }
      } catch (fundError) {
        console.warn('Friendbot funding failed:', fundError);
        // Continue anyway as the asset creation in DB was successful
      }
    }

    // Return asset data without exposing secret key
    const { asset_provider_secret_key, ...safeAssetData } = assetRecord;
    
    return {
      ...safeAssetData,
      message: 'Asset issuer created successfully. The issuer account has been generated and funded (testnet only).',
      stellar_info: {
        issuer_public_key: issuerPublicKey,
        network: STELLAR_CONFIG.NETWORK
      }
    };

  } catch (error) {
    console.error('Create custom asset issuer error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('duplicate key value')) {
        throw new Error(`Asset code '${assetData.asset_code}' already exists. Please choose a different asset code.`);
      }
    }
    
    throw new Error(`Failed to create custom asset issuer: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets all assets with filtering and pagination
 */
export const getAllAssets = async (page: number, limit: number, filters: AssetFilters) => {
  try {
    console.log('Fetching all assets with filters:', { page, limit, filters });

    const offset = (page - 1) * limit;
    const result = await getAllAssetsFromDB(limit, offset, filters);

    console.log(`Found ${result.total} assets, returning ${result.assets.length} for page ${page}`);

    return {
      assets: result.assets.map(asset => ({
        ...asset,
        // Don't expose secret key in API responses
        asset_provider_secret_key: undefined
      })),
      total: result.total || 0
    };

  } catch (error) {
    console.error('Get all assets error:', error);
    throw new Error(`Failed to fetch assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Gets asset details by ID
 */
export const getAssetById = async (assetId: string) => {
  try {
    console.log('Fetching asset by ID:', assetId);

    const asset = await getAssetByIdFromDB(assetId);

    if (!asset) {
      throw new Error('Asset not found');
    }

    console.log('Asset found:', asset.asset_code);

    // Don't expose secret key in API response
    const { asset_provider_secret_key, ...safeAssetData } = asset;

    return safeAssetData;

  } catch (error) {
    console.error('Get asset by ID error:', error);
    
    if (error instanceof Error && error.message === 'Asset not found') {
      throw error;
    }
    
    throw new Error(`Failed to fetch asset: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Toggles asset active/inactive status
 */
export const toggleAssetStatus = async (assetId: string, updatedBy?: string) => {
  try {
    console.log('Toggling asset status for ID:', assetId);

    // First check if asset exists
    const existingAsset = await getAssetByIdFromDB(assetId);
    if (!existingAsset) {
      throw new Error('Asset not found');
    }

    const newStatus = !existingAsset.is_active;
    console.log(`Changing asset status from ${existingAsset.is_active} to ${newStatus}`);

    const updatedAsset = await updateAssetStatus(assetId, newStatus, updatedBy);

    console.log('Asset status updated successfully');

    // Don't expose secret key in API response
    const { asset_provider_secret_key, ...safeAssetData } = updatedAsset;

    return safeAssetData;

  } catch (error) {
    console.error('Toggle asset status error:', error);
    
    if (error instanceof Error && error.message === 'Asset not found') {
      throw error;
    }
    
    throw new Error(`Failed to update asset status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Issues custom asset to a Stellar account
 */
export const issueAssetToAccount = async (assetId: string, recipientPublicKey: string, amount: number) => {
  try {
    console.log('Issuing asset to account:', { assetId, recipientPublicKey, amount });

    // Get asset details
    const asset = await getAssetByIdFromDB(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }

    if (!asset.is_active) {
      throw new Error('Asset is not active and cannot be issued');
    }

    console.log('Asset found:', asset.asset_code, 'Issuer:', asset.asset_provider_public_key);

    // Initialize Stellar server
    const server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.HORIZON_URL);
    const networkPassphrase = getNetworkPassphrase();

    // Create asset object
    const stellarAsset = new StellarSdk.Asset(asset.asset_code, asset.asset_provider_public_key);

    // Create issuer keypair
    const issuerKeypair = StellarSdk.Keypair.fromSecret(asset.asset_provider_secret_key!);

    // Load issuer account
    console.log('Loading issuer account...');
    const issuerAccount = await server.loadAccount(issuerKeypair.publicKey());

    // Build and submit payment transaction
    console.log('Building payment transaction...');
    const transaction = new StellarSdk.TransactionBuilder(issuerAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: recipientPublicKey,
          asset: stellarAsset,
          amount: amount.toString(),
        })
      )
      .addMemo(StellarSdk.Memo.text(`Issue ${asset.asset_code}`))
      .setTimeout(STELLAR_CONFIG.TRANSACTION_TIMEOUT)
      .build();

    // Sign transaction
    transaction.sign(issuerKeypair);

    console.log('Submitting transaction to Stellar network...');
    const result = await server.submitTransaction(transaction);

    console.log('Asset issued successfully, transaction hash:', result.hash);

    return {
      transaction_hash: result.hash,
      asset_code: asset.asset_code,
      issuer: asset.asset_provider_public_key,
      recipient: recipientPublicKey,
      amount: amount.toString(),
      ledger: result.ledger,
      status: 'success'
    };

  } catch (error) {
    console.error('Issue asset to account error:', error);

    if (error instanceof Error) {
      if (error.message === 'Asset not found' || error.message === 'Asset is not active and cannot be issued') {
        throw error;
      }

      // Handle Stellar-specific errors
      if (error.message.includes('op_no_destination')) {
        throw new Error('Recipient account does not exist on Stellar network');
      }

      if (error.message.includes('op_no_trust')) {
        throw new Error('Recipient account has not established trustline for this asset');
      }

      if (error.message.includes('op_underfunded')) {
        throw new Error('Issuer account has insufficient XLM for transaction fees');
      }
    }

    throw new Error(`Stellar network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
