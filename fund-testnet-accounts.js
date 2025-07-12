const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fundTestnetAccounts() {
  const accounts = [
    {
      name: 'Buyer',
      publicKey: 'GDT4QASJZEYYTLKAL3ZRVXAQOSCEKTJ67VK3FFLHXTKVA2HPF3L6BKOA',
      secretKey: 'SACBON63QHIZAJQMWISSJ7IFFJLBDKLKLBEJNDDTOEJ2B6FHDYWYPTIZ'
    },
    {
      name: 'Seller',
      publicKey: 'GD3EP55BKP7HUGTV7TGGOS3XS3SBATQBPZFNWBZYSZOH2TDTQLUIUOE4',
      secretKey: 'SD7M2WQUJDYZZXVEY7CWIMBXRHC7VPOCSJOCKFTCZEH27PWN6C3E5RCL'
    }
  ];

  console.log('Funding Stellar Testnet Accounts...\n');

  for (const account of accounts) {
    try {
      console.log(`Funding ${account.name} account: ${account.publicKey}`);
      
      const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(account.publicKey)}`);
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${account.name} account funded successfully!`);
        console.log(`   Public Key: ${account.publicKey}`);
        console.log(`   Secret Key: ${account.secretKey}`);
        console.log(`   Transaction: ${result.hash}\n`);
      } else {
        console.log(`❌ Failed to fund ${account.name} account:`, result);
      }
    } catch (error) {
      console.error(`❌ Error funding ${account.name} account:`, error.message);
    }
  }

  console.log('Next Steps:');
  console.log('1. Create trustlines for BD asset');
  console.log('2. Run the memo payment test again');
}

fundTestnetAccounts(); 