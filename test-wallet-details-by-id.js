// Use built-in fetch (Node.js 18+)

async function testWalletDetailsById() {
  const baseUrl = 'http://localhost:3000/api';
  
  try {
    console.log('=== Testing Get Wallet Details by ID API ===\n');
    
    // First, let's get a list of users to find a valid wallet ID
    console.log('1. Getting list of users to find a valid wallet ID...');
    const usersResponse = await fetch(`${baseUrl}/wallets/persons?table_admin_id=admin`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const usersResult = await usersResponse.json();
    console.log('Users result:', usersResult);
    
    if (usersResult.error) {
      console.error('Failed to get users:', usersResult.error);
      return;
    }
    
    if (!usersResult.users || usersResult.users.length === 0) {
      console.log('No users found. Creating a test account first...');
      
      // Create a test account
      const createAccountResponse = await fetch(`${baseUrl}/wallets/create-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Test User',
          email: 'test@example.com',
          role: 'user',
          entity_belongs: 'test-entity',
          entity_admin_name: 'admin'
        })
      });
      
      const createResult = await createAccountResponse.json();
      console.log('Create account result:', createResult);
      
      if (createResult.error) {
        console.error('Failed to create account:', createResult.error);
        return;
      }
      
      const walletId = createResult.profile.id;
      console.log('Created wallet ID:', walletId);
      
      // Test the new API with the created wallet ID
      console.log('\n2. Testing get wallet details by ID...');
      const detailsResponse = await fetch(`${baseUrl}/wallets/${walletId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const detailsResult = await detailsResponse.json();
      console.log('Wallet details result:', detailsResult);
      
      if (detailsResult.error) {
        console.error('Failed to get wallet details:', detailsResult.error);
      } else {
        console.log('✅ SUCCESS: Wallet details retrieved successfully!');
        console.log('Wallet ID:', detailsResult.id);
        console.log('Username:', detailsResult.username);
        console.log('Email:', detailsResult.email);
        console.log('Public Key:', detailsResult.public_key);
        console.log('XLM Balance:', detailsResult.balances.xlm);
        console.log('BD Balance:', detailsResult.balances.bd);
        console.log('Has BD Trustline:', detailsResult.has_bd_trustline);
      }
    } else {
      // Use the first user's ID
      const walletId = usersResult.users[0].id;
      console.log('Using existing wallet ID:', walletId);
      
      // Test the new API
      console.log('\n2. Testing get wallet details by ID...');
      const detailsResponse = await fetch(`${baseUrl}/wallets/${walletId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const detailsResult = await detailsResponse.json();
      console.log('Wallet details result:', detailsResult);
      
      if (detailsResult.error) {
        console.error('Failed to get wallet details:', detailsResult.error);
      } else {
        console.log('✅ SUCCESS: Wallet details retrieved successfully!');
        console.log('Wallet ID:', detailsResult.id);
        console.log('Username:', detailsResult.username);
        console.log('Email:', detailsResult.email);
        console.log('Public Key:', detailsResult.public_key);
        console.log('XLM Balance:', detailsResult.balances.xlm);
        console.log('BD Balance:', detailsResult.balances.bd);
        console.log('Has BD Trustline:', detailsResult.has_bd_trustline);
      }
    }
    
    // Test with invalid UUID
    console.log('\n3. Testing with invalid UUID...');
    const invalidResponse = await fetch(`${baseUrl}/wallets/invalid-uuid`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const invalidResult = await invalidResponse.json();
    console.log('Invalid UUID result:', invalidResult);
    
    // Test with non-existent UUID
    console.log('\n4. Testing with non-existent UUID...');
    const nonExistentResponse = await fetch(`${baseUrl}/wallets/00000000-0000-0000-0000-000000000000`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const nonExistentResult = await nonExistentResponse.json();
    console.log('Non-existent UUID result:', nonExistentResult);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testWalletDetailsById(); 