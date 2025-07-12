import 'dotenv/config';

// Stellar Network Configuration
export const STELLAR_CONFIG = {
  // Network settings
  NETWORK: process.env.STELLAR_NETWORK || 'TESTNET',
  HORIZON_URL: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  
  // Issuer account configuration
  ISSUER_PUBLIC_KEY: process.env.STELLAR_ISSUER_PUBLIC_KEY || 'GCJEZGVNCFA5756AMGYPDLBBAXJXQ2GEROQPGEK67VNYU6ADF5R5M7G5',
  ISSUER_SECRET_KEY: process.env.STELLAR_ISSUER_SECRET_KEY || 'SBJDMLMT5BLBVRZTMY4LXUVKP3Y26Z3HTBI5TJCNJWT7YRFIIQXFOICS',
  
  // Custom asset configuration
  CUSTOM_ASSET_CODE: process.env.STELLAR_CUSTOM_ASSET_CODE || 'BD',
  
  // Transaction settings
  DEFAULT_TIMEOUT: parseInt(process.env.STELLAR_DEFAULT_TIMEOUT || '30'),
  TRANSACTION_TIMEOUT: parseInt(process.env.STELLAR_TRANSACTION_TIMEOUT || '86400'), // 1 day
  
  // Friendbot URL for testnet funding
  FRIENDBOT_URL: process.env.STELLAR_FRIENDBOT_URL || 'https://friendbot.stellar.org'
};

// Get network passphrase based on network setting
export const getNetworkPassphrase = () => {
  switch (STELLAR_CONFIG.NETWORK.toUpperCase()) {
    case 'MAINNET':
      return 'Public Global Stellar Network ; September 2015';
    case 'TESTNET':
      return 'Test SDF Network ; September 2015';
    case 'FUTURENET':
      return 'Test SDF Future Network ; October 2022';
    default:
      return 'Test SDF Network ; September 2015';
  }
};

// Validate configuration
export const validateStellarConfig = () => {
  const requiredFields = [
    'ISSUER_PUBLIC_KEY',
    'ISSUER_SECRET_KEY',
    'HORIZON_URL'
  ];
  
  const missingFields = requiredFields.filter(field => !STELLAR_CONFIG[field as keyof typeof STELLAR_CONFIG]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required Stellar configuration: ${missingFields.join(', ')}`);
  }
  
  console.log('Stellar configuration validated successfully');
  console.log(`Network: ${STELLAR_CONFIG.NETWORK}`);
  console.log(`Horizon URL: ${STELLAR_CONFIG.HORIZON_URL}`);
  console.log(`Issuer Public Key: ${STELLAR_CONFIG.ISSUER_PUBLIC_KEY}`);
}; 