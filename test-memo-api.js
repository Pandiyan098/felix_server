const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testMemoAPI() {
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    // First, create a memo
    console.log('1. Creating a memo...');
    const createMemoResponse = await fetch(`${baseUrl}/memos/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creatorKey: 'GABC1234567890ABCDEF', // Replace with actual public key
        memo: 'Test memo for payment',
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
    
    // Now try to pay for the memo
    console.log('\n2. Paying for memo...');
    const payResponse = await fetch(`${baseUrl}/memos/pay-for-memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyerSecret: 'SABC1234567890ABCDEF', // Replace with actual secret key
        memoId: memoId
      })
    });
    
    const payResult = await payResponse.json();
    console.log('Pay for memo result:', payResult);
    
    if (payResult.error) {
      console.error('Failed to pay for memo:', payResult.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMemoAPI(); 