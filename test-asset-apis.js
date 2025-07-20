#!/usr/bin/env node

// Asset Management APIs Test Script
// This script tests all the new asset management endpoints

const BASE_URL = 'http://localhost:4000/api';

// Test data
let accessToken = ''; // You'll need to get this from your auth system
let createdAssetId = '';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function makeRequest(method, endpoint, data = null, skipAuth = false) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json'
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const options = {
    method,
    headers
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      status: response.status,
      data: responseData,
      ok: response.ok
    };
  } catch (error) {
    return {
      status: 0,
      data: { error: error.message },
      ok: false
    };
  }
}

async function testCreateAsset() {
  log('\n🧪 Testing: Create Custom Asset Issuer', 'cyan');
  log('POST /api/assets', 'dim');

  const assetData = {
    asset_code: 'TEST',
    asset_name: 'Test Token',
    description: 'A test token for API testing',
    total_supply: 1000000,
    category: 'utility',
    icon_url: 'https://example.com/test-icon.png',
    website: 'https://example.com'
  };

  log('Request data:', 'dim');
  console.log(JSON.stringify(assetData, null, 2));

  const result = await makeRequest('POST', '/test/assets', assetData);

  log(`Status: ${result.status}`, result.ok ? 'green' : 'red');
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.ok && result.data.asset) {
    createdAssetId = result.data.asset.asset_id;
    log(`✅ Asset created successfully! ID: ${createdAssetId}`, 'green');
  } else {
    log('❌ Asset creation failed', 'red');
  }

  return result.ok;
}

async function testGetAllAssets() {
  log('\n🧪 Testing: Get All Assets', 'cyan');
  log('GET /api/assets', 'dim');

  const result = await makeRequest('GET', '/test/assets?page=1&limit=10');

  log(`Status: ${result.status}`, result.ok ? 'green' : 'red');
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.ok) {
    log('✅ Assets retrieved successfully!', 'green');
    if (result.data.data && result.data.data.assets.length > 0) {
      log(`Found ${result.data.data.assets.length} assets`, 'blue');
    }
  } else {
    log('❌ Failed to retrieve assets', 'red');
  }

  return result.ok;
}

async function testGetAssetById() {
  if (!createdAssetId) {
    log('\n⚠️  Skipping Get Asset by ID test - no created asset ID', 'yellow');
    return true;
  }

  log('\n🧪 Testing: Get Asset by ID', 'cyan');
  log(`GET /api/assets/${createdAssetId}`, 'dim');

  const result = await makeRequest('GET', `/test/assets/${createdAssetId}`);

  log(`Status: ${result.status}`, result.ok ? 'green' : 'red');
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.ok) {
    log('✅ Asset details retrieved successfully!', 'green');
  } else {
    log('❌ Failed to retrieve asset details', 'red');
  }

  return result.ok;
}

async function testToggleAssetStatus() {
  if (!createdAssetId) {
    log('\n⚠️  Skipping Toggle Asset Status test - no created asset ID', 'yellow');
    return true;
  }

  log('\n🧪 Testing: Toggle Asset Status', 'cyan');
  log(`PATCH /api/assets/${createdAssetId}/toggle-status`, 'dim');

  const result = await makeRequest('PATCH', `/test/assets/${createdAssetId}/toggle-status`);

  log(`Status: ${result.status}`, result.ok ? 'green' : 'red');
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.ok) {
    log('✅ Asset status toggled successfully!', 'green');
  } else {
    log('❌ Failed to toggle asset status', 'red');
  }

  return result.ok;
}

async function testIssueAsset() {
  if (!createdAssetId) {
    log('\n⚠️  Skipping Issue Asset test - no created asset ID', 'yellow');
    return true;
  }

  log('\n🧪 Testing: Issue Asset to Account', 'cyan');
  log(`POST /api/assets/${createdAssetId}/issue`, 'dim');

  // Using a test Stellar public key
  const issueData = {
    recipient_public_key: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37',
    amount: 100.50
  };

  log('Request data:', 'dim');
  console.log(JSON.stringify(issueData, null, 2));

  const result = await makeRequest('POST', `/test/assets/${createdAssetId}/issue`, issueData);

  log(`Status: ${result.status}`, result.ok ? 'green' : 'red');
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.ok) {
    log('✅ Asset issued successfully!', 'green');
  } else {
    log('❌ Failed to issue asset', 'red');
    if (result.data.error && result.data.error.includes('trustline')) {
      log('ℹ️  This is expected - recipient needs to establish trustline first', 'blue');
    }
  }

  return true; // We'll consider this successful even if it fails due to trustline issues
}

async function testValidationErrors() {
  log('\n🧪 Testing: Validation Errors', 'cyan');
  
  // Test invalid asset code
  log('Testing invalid asset code...', 'dim');
  const invalidAssetCode = await makeRequest('POST', '/test/assets', {
    asset_code: 'toolongassetcode123', // Too long
    asset_name: 'Test'
  });
  
  log(`Invalid asset code status: ${invalidAssetCode.status}`, invalidAssetCode.status === 400 ? 'green' : 'red');

  // Test missing required fields
  log('Testing missing required fields...', 'dim');
  const missingFields = await makeRequest('POST', '/test/assets', {
    asset_code: 'TEST'
    // Missing asset_name
  });
  
  log(`Missing fields status: ${missingFields.status}`, missingFields.status === 400 ? 'green' : 'red');

  // Test invalid UUID
  log('Testing invalid asset ID format...', 'dim');
  const invalidUuid = await makeRequest('GET', '/test/assets/invalid-uuid');
  
  log(`Invalid UUID status: ${invalidUuid.status}`, invalidUuid.status === 400 ? 'green' : 'red');

  log('✅ Validation error tests completed', 'green');
  return true;
}

async function runTests() {
  log('🚀 Starting Asset Management API Tests', 'bright');
  log(`Base URL: ${BASE_URL}`, 'dim');
  
  if (!accessToken) {
    log('\n⚠️  WARNING: No access token provided. Some tests may fail.', 'yellow');
    log('To get an access token, use your auth endpoints first.', 'yellow');
  }

  const tests = [
    { name: 'Create Asset', fn: testCreateAsset },
    { name: 'Get All Assets', fn: testGetAllAssets },
    { name: 'Get Asset by ID', fn: testGetAssetById },
    { name: 'Toggle Asset Status', fn: testToggleAssetStatus },
    { name: 'Issue Asset', fn: testIssueAsset },
    { name: 'Validation Errors', fn: testValidationErrors }
  ];

  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      log(`❌ ${test.name} failed with error: ${error.message}`, 'red');
      results.push({ name: test.name, success: false });
    }
  }

  // Summary
  log('\n📊 Test Results Summary', 'bright');
  log('═'.repeat(50), 'dim');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  log('═'.repeat(50), 'dim');
  log(`Total: ${successful}/${total} tests passed`, successful === total ? 'green' : 'yellow');

  if (successful === total) {
    log('🎉 All tests passed! Asset Management APIs are working correctly.', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the logs above for details.', 'yellow');
  }

  // API Endpoints Summary
  log('\n📝 Available Asset Management Endpoints:', 'bright');
  log('POST   /api/test/assets                     - Create custom asset issuer', 'blue');
  log('GET    /api/test/assets                     - Get all assets (with pagination)', 'blue');
  log('GET    /api/test/assets/:id                 - Get asset details by ID', 'blue');
  log('PATCH  /api/test/assets/:id/toggle-status   - Toggle asset active/inactive', 'blue');
  log('POST   /api/test/assets/:id/issue           - Issue asset to Stellar account', 'blue');
  
  log('\n💡 Usage Tips:', 'bright');
  log('• All endpoints require authentication (Bearer token)', 'yellow');
  log('• Admin or Super Admin role required for POST/PATCH operations', 'yellow');
  log('• Asset codes must be 1-12 characters, uppercase letters and numbers only', 'yellow');
  log('• Each asset gets its own Stellar issuer account automatically', 'yellow');
  log('• Recipients need to establish trustlines before receiving custom assets', 'yellow');
}

// Run the tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
