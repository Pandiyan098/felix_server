// Use built-in fetch (Node.js 18+)

async function testMemoBalanceFix() {
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    console.log('=== Testing Memo Payment Balance Fix ===\n');
    
    // Step 1: Create a memo with a real Stellar public key
    console.log('1. Creating a memo...');
    const createMemoResponse = await fetch(`${baseUrl}/memos/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorKey: 'GD3EP55BKP7HUGTV7TGGOS3XS3SBATQBPZFNWBZYSZOH2TDTQLUIUOE4', // Seller's public key
        memo: 'Test memo for balance fix',
        bdAmount: 5,
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
    
    // Step 2: Check buyer's balance before payment
    console.log('\n2. Checking buyer balance before payment...');
    const buyerSecret = 'SACBON63QHIZAJQMWISSJ7IFFJLBDKLKLBEJNDDTOEJ2B6FHDYWYPTIZ'; // Buyer's secret key
    const balanceBeforeResponse = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userSecret: buyerSecret
      })
    });
    
    const balanceBefore = await balanceBeforeResponse.json();
    console.log('Balance before payment:', balanceBefore);
    
    if (balanceBefore.error) {
      console.error('Failed to get balance before payment:', balanceBefore.error);
      return;
    }
    
    const balanceBeforeBD = balanceBefore.balances?.bd || '0';
    console.log('BD balance before payment:', balanceBeforeBD);
    
    // Step 3: Pay for the memo
    console.log('\n3. Paying for memo...');
    const payResponse = await fetch(`${baseUrl}/memos/pay-for-memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyerSecret: buyerSecret,
        memoId: memoId
      })
    });
    
    const payResult = await payResponse.json();
    console.log('Pay for memo result:', payResult);
    
    if (payResult.error) {
      console.error('Failed to pay for memo:', payResult.error);
      return;
    }
    
    // Step 4: Check buyer's balance after payment
    console.log('\n4. Checking buyer balance after payment...');
    const balanceAfterResponse = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userSecret: buyerSecret
      })
    });
    
    const balanceAfter = await balanceAfterResponse.json();
    console.log('Balance after payment:', balanceAfter);
    
    if (balanceAfter.error) {
      console.error('Failed to get balance after payment:', balanceAfter.error);
      return;
    }
    
    const balanceAfterBD = balanceAfter.balances?.bd || '0';
    console.log('BD balance after payment:', balanceAfterBD);
    
    // Step 5: Check seller's balance
    console.log('\n5. Checking seller balance...');
    const sellerSecret = 'SD7M2WQUJDYZZXVEY7CWIMBXRHC7VPOCSJOCKFTCZEH27PWN6C3E5RCL'; // Seller's secret key
    const sellerBalanceResponse = await fetch(`${baseUrl}/wallets/amounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userSecret: sellerSecret
      })
    });
    
    const sellerBalance = await sellerBalanceResponse.json();
    console.log('Seller balance:', sellerBalance);
    
    if (sellerBalance.error) {
      console.error('Failed to get seller balance:', sellerBalance.error);
      return;
    }
    
    const sellerBalanceBD = sellerBalance.balances?.bd || '0';
    console.log('Seller BD balance:', sellerBalanceBD);
    
    // Step 6: Calculate and display the difference
    console.log('\n=== Balance Analysis ===');
    const buyerBalanceDiff = parseFloat(balanceAfterBD) - parseFloat(balanceBeforeBD);
    console.log(`Buyer BD balance change: ${buyerBalanceDiff}`);
    console.log(`Expected change: -5 BD`);
    
    if (buyerBalanceDiff === -5) {
      console.log('✅ SUCCESS: Buyer balance decreased by exactly 5 BD as expected!');
    } else {
      console.log('❌ FAILURE: Buyer balance did not change as expected');
    }
    
    console.log('\n=== Test Summary ===');
    console.log(`Buyer BD before: ${balanceBeforeBD}`);
    console.log(`Buyer BD after: ${balanceAfterBD}`);
    console.log(`Seller BD: ${sellerBalanceBD}`);
    console.log(`Transaction hash: ${payResult.txHash}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testMemoBalanceFix(); 