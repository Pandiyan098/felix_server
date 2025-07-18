const axios = require('axios');

const BASE_URL = 'http://localhost:4000/api';

async function testEnhancedMemoPayment() {
  console.log('Testing Enhanced Memo Payment with Transaction Logging...\n');

  try {
    // Test 1: Check if server is running
    console.log('1. Checking server health...');
    try {
      const healthResponse = await axios.get('http://localhost:4000/health');
      console.log('✅ Server is running:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server is not running. Please start the server first.');
      return;
    }

    console.log('\n---\n');

    // Test 2: Create a memo (this should already exist in your system)
    console.log('2. Creating a test memo...');
    try {
      const memoResponse = await axios.post(`${BASE_URL}/memos`, {
        creatorKey: 'GAMW223GHFZOFXAXWYZYI6BCNFAANGI4XBTCQY6DJPZMCZVCUUHN6PS5', // Replace with a valid creator public key
        memo: 'Test memo for enhanced payment',
        bdAmount: 50,
        assetId: 'BLUEDOLLAR',
        description: 'Test memo description',
        rating: 5
      });
      
      console.log('✅ Memo created successfully:', memoResponse.data);
      
      // Test 3: Pay for the memo
      console.log('\n3. Paying for the memo...');
      const paymentResponse = await axios.post(`${BASE_URL}/memos/pay`, {
        buyerSecret: 'SCDQTVDJFOVQR7DPJSNGP5RLXQW3IDXQJ7MIVXM4XZXFR7TKMFJHNMRR', // Replace with a valid buyer secret key
        memoId: memoResponse.data.memoId
      });
      
      console.log('✅ Payment successful:', paymentResponse.data);
      
      if (paymentResponse.data.transaction_log) {
        console.log('\n📊 Transaction Log Details:');
        console.log('- Debit Entry:', paymentResponse.data.transaction_log.debit_entry);
        console.log('- Credit Entry:', paymentResponse.data.transaction_log.credit_entry);
        console.log('- Memo ID:', paymentResponse.data.transaction_log.memo_id);
      }
      
    } catch (error) {
      console.log('❌ Error creating memo or payment:', error.response?.data || error.message);
    }

    console.log('\n---\n');

    // Test 4: Check all transactions and wallet details
    console.log('4. Checking all transactions and wallet details...');
    try {
      const allDataResponse = await axios.get(`${BASE_URL}/transactions-and-wallets`);
      console.log('✅ All transactions and wallets retrieved successfully');
      
      console.log('\n📈 Summary:');
      console.log('- Total transactions:', allDataResponse.data.transactions.count);
      console.log('- Total services:', allDataResponse.data.services.count);
      console.log('- Total wallets:', allDataResponse.data.wallets.count);
      console.log('- Total profiles:', allDataResponse.data.profiles.count);
      console.log('- Total users:', allDataResponse.data.users.count);
      console.log('- Total wallet balances:', allDataResponse.data.wallet_balances.count);
      
      // Show recent transactions
      if (allDataResponse.data.transactions.data && allDataResponse.data.transactions.data.length > 0) {
        console.log('\n🔍 Recent Transactions:');
        allDataResponse.data.transactions.data.slice(0, 5).forEach((tx, index) => {
          console.log(`${index + 1}. ID: ${tx.id}, Amount: ${tx.amount}, Status: ${tx.status}, Hash: ${tx.stellar_transaction_hash}`);
        });
      }
      
    } catch (error) {
      console.log('❌ Error retrieving all data:', error.response?.data || error.message);
    }

  } catch (error) {
    console.log('❌ General error:', error.message);
  }
}

// Instructions for running the test
console.log('='.repeat(80));
console.log('ENHANCED MEMO PAYMENT TEST');
console.log('='.repeat(80));
console.log('');
console.log('IMPORTANT: Before running this test, make sure you have:');
console.log('1. A running server (npm start)');
console.log('2. Valid Stellar public keys for creator');
console.log('3. Valid Stellar secret keys for buyer');
console.log('4. Both accounts should have BD trustlines and sufficient balance');
console.log('');
console.log('The test will:');
console.log('- Create a memo');
console.log('- Pay for the memo');
console.log('- Log debit/credit entries in the transactions table');
console.log('- Show transaction details with +/- amounts');
console.log('');
console.log('Starting test...');
console.log('='.repeat(80));

// Run the test
testEnhancedMemoPayment();
