// Use built-in fetch (Node.js 18+)

async function testMemoWithRealAccounts() {
  const baseUrl = 'http://localhost:3000/api';
  
  // User's real accounts
  const account1 = {
    publicKey: 'GDVSLJFVO5OXHTHGOFLD6MXZUVWIWHSCIRM2JFFOAHEIQEIB3XOA72KS',
    secretKey: 'SD6EKVNFQE4LIPEJMB2DCPL4JAXBB5XC7PTARJIQQNEVDVM7OXFA5P2I'
  };
  
  const account2 = {
    publicKey: 'GAYSV4BKRFCSNQRXH3ZZZP4UIITYV3GHKBIUF4ZJB7CQCAD4NUGMX4RK',
    secretKey: 'SCLCQUPTQA35H2G5GV2DOIWVLSMWQ3LQYAGUCU7OOENLCOIRQQTL3WRX'
  };
  
  try {
    console.log('=== Testing Memo Payment with Real Accounts ===\n');
    
    // Step 1: Check both account balances before any transaction
    console.log('1. Checking initial balances...');
    
    // Check account 1 (seller) balance
    console.log('\n--- Account 1 (Seller) Initial Balance ---');
    const account1BalanceBefore = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    });
    const account1Before = await account1BalanceBefore.json();
    console.log('Account 1 balance before:', account1Before);
    
    // Check account 2 (buyer) balance
    console.log('\n--- Account 2 (Buyer) Initial Balance ---');
    const account2BalanceBefore = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    });
    const account2Before = await account2BalanceBefore.json();
    console.log('Account 2 balance before:', account2Before);
    
    // Step 2: Create a memo using account 1 as seller
    console.log('\n2. Creating memo with account 1 as seller...');
    const createMemoResponse = await fetch(`${baseUrl}/memos/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorKey: account1.publicKey, // Account 1 is the seller
        memo: 'Test memo payment',
        bdAmount: 10,
        assetId: 'BD'
      })
    });
    
    const createResult = await createMemoResponse.json();
    console.log('Create memo result:', createResult);
    
    if (createResult.error) {
      console.error('Failed to create memo:', createResult.error);
      return;
    }
    
    const memoId = createResult.memoId;
    console.log('Memo ID:', memoId);
    
    // Step 3: Pay for the memo using account 2 as buyer
    console.log('\n3. Paying for memo with account 2 as buyer...');
    const payResponse = await fetch(`${baseUrl}/memos/pay-for-memo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerSecret: account2.secretKey, // Account 2 is the buyer
        memoId: memoId
      })
    });
    
    const payResult = await payResponse.json();
    console.log('Pay for memo result:', payResult);
    
    if (payResult.error) {
      console.error('Failed to pay for memo:', payResult.error);
      console.log('\nNote: If the error is "Insufficient BD balance", the buyer account needs BD tokens.');
      console.log('You can use the BD transfer API to send BD from issuer to account 2.');
      return;
    }
    
    // Step 4: Check both account balances after payment
    console.log('\n4. Checking balances after payment...');
    
    // Check account 1 (seller) balance after
    console.log('\n--- Account 1 (Seller) Balance After ---');
    const account1BalanceAfter = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    });
    const account1After = await account1BalanceAfter.json();
    console.log('Account 1 balance after:', account1After);
    
    // Check account 2 (buyer) balance after
    console.log('\n--- Account 2 (Buyer) Balance After ---');
    const account2BalanceAfter = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    });
    const account2After = await account2BalanceAfter.json();
    console.log('Account 2 balance after:', account2After);
    
    // Step 5: Calculate and display the differences
    console.log('\n=== Balance Analysis ===');
    
    const account1BeforeBD = account1Before.balances?.bd || '0';
    const account1AfterBD = account1After.balances?.bd || '0';
    const account2BeforeBD = account2Before.balances?.bd || '0';
    const account2AfterBD = account2After.balances?.bd || '0';
    
    const account1Diff = parseFloat(account1AfterBD) - parseFloat(account1BeforeBD);
    const account2Diff = parseFloat(account2AfterBD) - parseFloat(account2BeforeBD);
    
    console.log(`Account 1 (Seller) BD change: ${account1Diff}`);
    console.log(`Account 2 (Buyer) BD change: ${account2Diff}`);
    console.log(`Expected: Account 1 +10 BD, Account 2 -10 BD`);
    
    if (account1Diff === 10 && account2Diff === -10) {
      console.log('✅ SUCCESS: Balances changed correctly!');
    } else {
      console.log('❌ FAILURE: Balances did not change as expected');
    }
    
    console.log('\n=== Test Summary ===');
    console.log(`Account 1 BD before: ${account1BeforeBD}`);
    console.log(`Account 1 BD after: ${account1AfterBD}`);
    console.log(`Account 2 BD before: ${account2BeforeBD}`);
    console.log(`Account 2 BD after: ${account2AfterBD}`);
    console.log(`Transaction hash: ${payResult.txHash}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMemoWithRealAccounts(); 