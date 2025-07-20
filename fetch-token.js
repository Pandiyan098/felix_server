#!/usr/bin/env node

/**
 * Keycloak Token Fetcher
 * This script fetches an access token from Keycloak using your credentials
 */

const https = require('https');
const { URLSearchParams } = require('url');

// Your Keycloak configuration
const KEYCLOAK_CONFIG = {
  BASE_URL: 'https://iam-uat.cateina.com',
  REALM: 'Cateina_Felix_Op',
  CLIENT_ID: 'felix-service-client',
  CLIENT_SECRET: 'iUj84dYKd3q1sAzWj6YHxv1H6ruXienz',
  USERNAME: 'pandiyan',
  PASSWORD: '1234'
};

/**
 * Fetch token from Keycloak
 */
async function fetchKeycloakToken() {
  const tokenEndpoint = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`;
  
  console.log('🔐 Fetching Keycloak Token...');
  console.log('📍 Endpoint:', tokenEndpoint);
  console.log('👤 Username:', KEYCLOAK_CONFIG.USERNAME);
  console.log('🔑 Client ID:', KEYCLOAK_CONFIG.CLIENT_ID);
  console.log('---');

  const postData = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CONFIG.CLIENT_ID,
    client_secret: KEYCLOAK_CONFIG.CLIENT_SECRET,
    username: KEYCLOAK_CONFIG.USERNAME,
    password: KEYCLOAK_CONFIG.PASSWORD
  }).toString();

  return new Promise((resolve, reject) => {
    const url = new URL(tokenEndpoint);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Response Status:', res.statusCode);
        console.log('📊 Response Headers:', res.headers);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS: Token retrieved successfully!');
            console.log('---');
            console.log('🎫 Access Token:', response.access_token);
            console.log('🔄 Refresh Token:', response.refresh_token);
            console.log('⏱️  Token Type:', response.token_type);
            console.log('⏳ Expires In:', response.expires_in, 'seconds');
            console.log('🔒 Scope:', response.scope);
            
            // Decode token to see user info
            if (response.access_token) {
              try {
                const tokenParts = response.access_token.split('.');
                const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
                console.log('---');
                console.log('👤 Token Payload:');
                console.log('   - Username:', payload.preferred_username);
                console.log('   - Email:', payload.email);
                console.log('   - Roles:', payload.realm_access?.roles || []);
                console.log('   - Client Roles:', payload.resource_access?.[KEYCLOAK_CONFIG.CLIENT_ID]?.roles || []);
                console.log('   - Issued At:', new Date(payload.iat * 1000));
                console.log('   - Expires At:', new Date(payload.exp * 1000));
              } catch (e) {
                console.log('⚠️  Could not decode token payload:', e.message);
              }
            }
            
            resolve(response);
          } else {
            console.log('❌ FAILED: Authentication failed');
            console.log('📄 Error Details:', response);
            reject(new Error(`Authentication failed: ${response.error} - ${response.error_description}`));
          }
        } catch (e) {
          console.log('❌ FAILED: Invalid JSON response');
          console.log('📄 Raw Response:', data);
          reject(new Error(`Invalid response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ FAILED: Network error');
      console.log('📄 Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test the Felix API token endpoint
 */
async function testFelixAPI() {
  console.log('\n🧪 Testing Felix API Token Endpoint...');
  
  const http = require('http');
  
  const postData = JSON.stringify({
    username: KEYCLOAK_CONFIG.USERNAME,
    password: KEYCLOAK_CONFIG.PASSWORD
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/fetch/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Felix API Response Status:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ SUCCESS: Felix API working!');
            console.log('📄 Response:', response);
            resolve(response);
          } else {
            console.log('❌ FAILED: Felix API error');
            console.log('📄 Response:', response);
            reject(new Error(`Felix API failed: ${response.message}`));
          }
        } catch (e) {
          console.log('❌ FAILED: Invalid JSON from Felix API');
          console.log('📄 Raw Response:', data);
          reject(new Error(`Invalid Felix API response: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ FAILED: Cannot connect to Felix API (is server running?)');
      console.log('📄 Error:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Keycloak Token Fetcher');
  console.log('=' .repeat(50));
  
  try {
    // Test direct Keycloak
    await fetchKeycloakToken();
    
    // Test Felix API
    await testFelixAPI();
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Copy the access token from above');
    console.log('   2. Use it in Postman: Authorization → Bearer Token');
    console.log('   3. Test your protected endpoints');
    
  } catch (error) {
    console.log('\n💥 Error occurred:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if the user account is fully set up in Keycloak');
    console.log('   2. Verify the user has completed all required actions');
    console.log('   3. Ensure the user is enabled and not locked');
    console.log('   4. Check if the user has appropriate roles assigned');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fetchKeycloakToken, testFelixAPI };
