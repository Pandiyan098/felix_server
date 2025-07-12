const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createTrustlines() {
  const accounts = [
    {
      name: 'Buyer',
      secretKey: 'SACBON63QHIZAJQMWISSJ7IFFJLBDKLKLBEJNDDTOEJ2B6FHDYWYPTIZ'
    },
    {
      name: 'Seller',
      secretKey: 'SD7M2WQUJDYZZXVEY7CWIMBXRHC7VPOCSJOCKFTCZEH27PWN6C3E5RCL'
    }
  ];

  console.log('Creating Trustlines for BD Asset...\n');

  for (const account of accounts) {
    try {
      console.log(`Creating trustline for ${account.name}...`);
      
      const response = await fetch('http://localhost:3000/api/wallets/trustline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secret: account.secretKey
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${account.name} trustline created successfully!`);
        console.log(`   Result: ${result.message}\n`);
      } else {
        console.log(`❌ Failed to create trustline for ${account.name}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Error creating trustline for ${account.name}:`, error.message);
    }
  }

  console.log('Next Steps:');
  console.log('1. Run the memo payment test again');
}

createTrustlines(); 