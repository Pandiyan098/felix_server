const fetch = require('node-fetch');

async function testKeycloakToken() {
  const tokenUrl = 'https://iam-uat.cateina.com/realms/Cateina_Felix_Op/protocol/openid-connect/token';
  
  console.log('🔍 Testing with URL:', tokenUrl);
  
  const formData = new URLSearchParams();
  formData.append('grant_type', 'password');
  formData.append('client_id', 'felix-service-client');
  formData.append('username', 'pandiyan');
  formData.append('password', '1234');
  formData.append('client_secret', 'iUj84dYKd3q1sAzWj6YHxv1H6ruXienz');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const responseData = await response.json();
    console.log('🎯 Response status:', response.status);
    console.log('🎯 Response data:', responseData);

    if (!response.ok) {
      console.log('❌ Keycloak error:', responseData.error, responseData.error_description);
    } else {
      console.log('✅ Success! Got token:', responseData.access_token ? 'YES' : 'NO');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testKeycloakToken();
