#!/bin/bash

BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test data - using real Stellar testnet keys
TEST_SECRET_KEY="SDRW6X46IBYKIWABH6EAXUEXOS2O6FNIZYKO3FFLHXTKVA2HPF3L6BKOA"
TEST_PUBLIC_KEY="GDT4QASJZEYYTLKAL3ZRVXAQOSCEKTJ67VK3FFLHXTKVA2HPF3L6BKOA"
TEST_WALLET_ID="12345678-1234-1234-1234-123456789012"

echo -e "${BLUE}🚀 Starting API tests (excluding memo and get wallet details APIs)...${NC}\n"

# Function to test an API endpoint
test_api() {
    local description="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    
    echo -e "${YELLOW}🧪 Testing: $description${NC}"
    echo -e "${BLUE}📍 Endpoint: $method $BASE_URL$endpoint${NC}"
    
    if [ ! -z "$data" ]; then
        echo -e "${BLUE}📦 Request body: $data${NC}"
    fi
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all lines except last)
    response_body=$(echo "$response" | head -n -1)
    
    echo -e "${BLUE}📊 Status: $status_code${NC}"
    echo -e "${BLUE}📄 Response: $response_body${NC}"
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
    fi
    
    echo ""
}

# 1. Create Wallets (POST /wallets/create)
test_api "Create two wallets" "POST" "/wallets/create" ""

# 2. Create Account with Details (POST /wallets/create-account)
test_api "Create account with user details" "POST" "/wallets/create-account" '{
  "username": "Test User API",
  "email": "testapi@example.com",
  "role": "user",
  "entity_belongs": "Test Entity API",
  "entity_admin_name": "Test Admin API"
}'

# 3. Create Trustline (POST /wallets/trustline)
test_api "Create trustline for BD asset" "POST" "/wallets/trustline" "{
  \"secret\": \"$TEST_SECRET_KEY\"
}"

# 4. Make XLM Payment (POST /wallets/pay)
test_api "Make XLM payment" "POST" "/wallets/pay" "{
  \"senderSecret\": \"$TEST_SECRET_KEY\",
  \"receiverPublic\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"1\"
}"

# 5. Make BD Payment (POST /wallets/pay-bd)
test_api "Make BD payment with transaction logging" "POST" "/wallets/pay-bd" "{
  \"senderSecret\": \"$TEST_SECRET_KEY\",
  \"receiverPublic\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"5\",
  \"product_id\": \"test-product-api-123\",
  \"user_id\": \"test-user-api-123\",
  \"table_admin_id\": \"test-admin-api-123\"
}"

# 6. Get Transactions by User (GET /wallets/transactions?user_id=test)
test_api "Get transactions by user" "GET" "/wallets/transactions?user_id=test-user-api-123" ""

# 7. Get Persons by Admin (GET /wallets/persons?table_admin_id=test)
test_api "Get persons by admin" "GET" "/wallets/persons?table_admin_id=test-admin-api-123" ""

# 8. Create Transaction Request (POST /wallets/transaction-request)
test_api "Create transaction request" "POST" "/wallets/transaction-request" "{
  \"sender_id\": \"$TEST_PUBLIC_KEY\",
  \"receiver_id\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"5\",
  \"currency\": \"XLM\",
  \"price\": \"1.00\",
  \"memo\": \"Test transaction request API\",
  \"multi_sig\": false
}"

# 9. Accept Transaction Request (POST /wallets/accept-transaction)
# Note: This will fail without a valid request_id, but we're testing the endpoint structure
test_api "Accept transaction request (will fail without valid request_id)" "POST" "/wallets/accept-transaction" "{
  \"request_id\": \"test-request-id-api\",
  \"signer_secret\": \"$TEST_SECRET_KEY\",
  \"multi_sig\": false
}"

# 10. Get Wallet Amounts (POST /wallets/amounts)
test_api "Get wallet amounts by secret key" "POST" "/wallets/amounts" "{
  \"userSecret\": \"$TEST_SECRET_KEY\"
}"

# Test with invalid data to check error handling
echo -e "${YELLOW}🧪 Testing error handling...${NC}"

# Test with missing required fields
test_api "Create account with missing fields (should fail)" "POST" "/wallets/create-account" '{
  "username": "Test User"
}'

# Test with invalid secret key
test_api "Create trustline with invalid secret (should fail)" "POST" "/wallets/trustline" "{
  \"secret\": \"invalid-secret-key\"
}"

# Test with invalid wallet ID
test_api "Get wallet details with invalid ID (should fail)" "GET" "/wallets/invalid-wallet-id" ""

# Test with missing parameters
test_api "Get transactions without user_id (should fail)" "GET" "/wallets/transactions" ""

# Test with invalid payment data
test_api "Make XLM payment with missing fields (should fail)" "POST" "/wallets/pay" "{
  \"senderSecret\": \"$TEST_SECRET_KEY\"
}"

echo -e "${GREEN}🎉 All API tests completed!${NC}"
echo -e "${BLUE}📋 Summary:${NC}"
echo -e "${BLUE}   - Tested 10 main API endpoints${NC}"
echo -e "${BLUE}   - Tested 5 error handling scenarios${NC}"
echo -e "${BLUE}   - Excluded: create memo, pay for memo, get wallet details by ID${NC}" 