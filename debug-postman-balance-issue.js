// Use built-in fetch (Node.js 18+)

async function debugPostmanBalanceIssue() {
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
    console.log('=== Debugging Postman Balance Issue ===\n');
    
    // Step 1: Check initial balances
    console.log('1. Checking initial balances...');
    
    const account1Before = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    }).then(res => res.json());
    
    const account2Before = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    }).then(res => res.json());
    
    console.log('Account 1 (Seller) BD before:', account1Before.balances?.bd || '0');
    console.log('Account 2 (Buyer) BD before:', account2Before.balances?.bd || '0');
    
    // Step 2: Create memo
    console.log('\n2. Creating memo...');
    const createMemoResponse = await fetch(`${baseUrl}/memos/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorKey: account1.publicKey,
        memo: 'Postman test',
        bdAmount: 5,
        assetId: 'BD'
      })
    });
    
    const createResult = await createMemoResponse.json();
    console.log('Memo created with ID:', createResult.memoId);
    
    // Step 3: Pay for memo
    console.log('\n3. Paying for memo...');
    const payResponse = await fetch(`${baseUrl}/memos/pay-for-memo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerSecret: account2.secretKey,
        memoId: createResult.memoId
      })
    });
    
    const payResult = await payResponse.json();
    console.log('Payment result:', payResult);
    
    if (payResult.error) {
      console.error('Payment failed:', payResult.error);
      return;
    }
    
    // Step 4: Wait a moment for transaction to settle
    console.log('\n4. Waiting 2 seconds for transaction to settle...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Check balances immediately after payment
    console.log('\n5. Checking balances immediately after payment...');
    
    const account1After = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    }).then(res => res.json());
    
    const account2After = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    }).then(res => res.json());
    
    console.log('Account 1 (Seller) BD after:', account1After.balances?.bd || '0');
    console.log('Account 2 (Buyer) BD after:', account2After.balances?.bd || '0');
    
    // Step 6: Wait another moment and check again
    console.log('\n6. Waiting 3 more seconds and checking again...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const account1Final = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    }).then(res => res.json());
    
    const account2Final = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    }).then(res => res.json());
    
    console.log('Account 1 (Seller) BD final:', account1Final.balances?.bd || '0');
    console.log('Account 2 (Buyer) BD final:', account2Final.balances?.bd || '0');
    
    // Step 7: Analysis
    console.log('\n=== Analysis ===');
    const account1BeforeBD = parseFloat(account1Before.balances?.bd || '0');
    const account1AfterBD = parseFloat(account1After.balances?.bd || '0');
    const account1FinalBD = parseFloat(account1Final.balances?.bd || '0');
    
    const account2BeforeBD = parseFloat(account2Before.balances?.bd || '0');
    const account2AfterBD = parseFloat(account2After.balances?.bd || '0');
    const account2FinalBD = parseFloat(account2Final.balances?.bd || '0');
    
    console.log(`Account 1 change: ${account1BeforeBD} → ${account1AfterBD} → ${account1FinalBD}`);
    console.log(`Account 2 change: ${account2BeforeBD} → ${account2AfterBD} → ${account2FinalBD}`);
    
    const account1Diff = account1FinalBD - account1BeforeBD;
    const account2Diff = account2FinalBD - account2BeforeBD;
    
    console.log(`\nFinal changes:`);
    console.log(`Account 1 (Seller): ${account1Diff > 0 ? '+' : ''}${account1Diff} BD`);
    console.log(`Account 2 (Buyer): ${account2Diff > 0 ? '+' : ''}${account2Diff} BD`);
    
    if (account1Diff === 5 && account2Diff === -5) {
      console.log('✅ SUCCESS: Balances updated correctly!');
    } else {
      console.log('❌ ISSUE: Balances did not update as expected');
      console.log('Expected: Account 1 +5 BD, Account 2 -5 BD');
    }
    
    // Step 8: Test direct BD transfer for comparison
    console.log('\n=== Testing Direct BD Transfer for Comparison ===');
    
    const transferResponse = await fetch(`${baseUrl}/wallets/bd-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderSecret: account2.secretKey,
        receiverPublic: account1.publicKey,
        amount: '3',
        product_id: 'test-product',
        user_id: 'test-user',
        table_admin_id: 'test-admin'
      })
    });
    
    const transferResult = await transferResponse.json();
    console.log('Direct transfer result:', transferResult);
    
    // Wait and check balances after direct transfer
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const account1AfterTransfer = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account1.secretKey })
    }).then(res => res.json());
    
    const account2AfterTransfer = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userSecret: account2.secretKey })
    }).then(res => res.json());
    
    console.log('\nAfter direct transfer:');
    console.log('Account 1 BD:', account1AfterTransfer.balances?.bd || '0');
    console.log('Account 2 BD:', account2AfterTransfer.balances?.bd || '0');
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Run the debug
debugPostmanBalanceIssue(); 