const StellarSdk = require('stellar-sdk');

// Generate testnet keypairs
function generateTestnetKeys() {
  console.log('Generating Stellar Testnet Keypairs...\n');
  
  // Generate buyer keypair
  const buyerKeypair = StellarSdk.Keypair.random();
  console.log('Buyer Keypair:');
  console.log('Public Key:', buyerKeypair.publicKey());
  console.log('Secret Key:', buyerKeypair.secret());
  console.log('');
  
  // Generate seller keypair
  const sellerKeypair = StellarSdk.Keypair.random();
  console.log('Seller Keypair:');
  console.log('Public Key:', sellerKeypair.publicKey());
  console.log('Secret Key:', sellerKeypair.secret());
  console.log('');
  
  // Generate issuer keypair (if needed)
  const issuerKeypair = StellarSdk.Keypair.random();
  console.log('Issuer Keypair:');
  console.log('Public Key:', issuerKeypair.publicKey());
  console.log('Secret Key:', issuerKeypair.secret());
  console.log('');
  
  console.log('Next Steps:');
  console.log('1. Fund these accounts using Friendbot: https://laboratory.stellar.org/#account-creator?network=test');
  console.log('2. Create trustlines for BD asset');
  console.log('3. Use these keys in your API tests');
}

generateTestnetKeys(); 