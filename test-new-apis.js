const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testNewAPIs() {
  console.log('Testing new API endpoint...\n');

  try {
    // Test 1: Get all transactions and wallet details
    console.log('1. Testing GET /transactions-and-wallets');
    try {
      const response = await axios.get(`${BASE_URL}/transactions-and-wallets`);
      console.log('✅ GET /transactions-and-wallets - Success');
      console.log('Response structure:');
      console.log('- Transactions count:', response.data.transactions.count);
      console.log('- Services count:', response.data.services.count);
      console.log('- Wallets count:', response.data.wallets.count);
      console.log('- Profiles count:', response.data.profiles.count);
      console.log('- Users count:', response.data.users.count);
      console.log('- Wallet balances count:', response.data.wallet_balances.count);
      console.log('- Summary:', response.data.summary);
      console.log('\nFull response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ GET /transactions-and-wallets - Error:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 2: Check server health
    console.log('2. Testing GET /health');
    try {
      const healthResponse = await axios.get('http://localhost:4000/health');
      console.log('✅ GET /health - Success');
      console.log('Response:', JSON.stringify(healthResponse.data, null, 2));
    } catch (error) {
      console.log('❌ GET /health - Error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('General error:', error.message);
  }
}

// Run the tests
testNewAPIs();
