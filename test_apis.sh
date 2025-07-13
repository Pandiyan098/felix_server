#!/bin/bash

BASE_URL="http://localhost:3000/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test data
TEST_SECRET_KEY="SDRW6X46IBYKIWABH6EAXUEXOS2O6FNIZYKO3FFLHXTKVA2HPF3L6BKOA"
TEST_PUBLIC_KEY="GDT4QASJZEYYTLKAL3ZRVXAQOSCEKTJ67VK3FFLHXTKVA2HPF3L6BKOA"
TEST_WALLET_ID="12345678-1234-1234-1234-123456789012"

echo -e "${BLUE}🚀 Starting comprehensive API tests...${NC}\n"

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

# 1. Create Wallets
test_api "Create two wallets" "POST" "/wallets/create" ""

# 2. Create Account with Details
test_api "Create account with user details" "POST" "/wallets/create-account" '{
  "username": "Test User",
  "email": "test@example.com",
  "role": "user",
  "entity_belongs": "Test Entity",
  "entity_admin_name": "Test Admin"
}'

# 3. Create Trustline
test_api "Create trustline for BD asset" "POST" "/wallets/trustline" "{
  \"secret\": \"$TEST_SECRET_KEY\"
}"

# 4. Make XLM Payment
test_api "Make XLM payment" "POST" "/wallets/pay" "{
  \"senderSecret\": \"$TEST_SECRET_KEY\",
  \"receiverPublic\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"1\"
}"

# 5. Make BD Payment
test_api "Make BD payment with transaction logging" "POST" "/wallets/pay-bd" "{
  \"senderSecret\": \"$TEST_SECRET_KEY\",
  \"receiverPublic\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"10\",
  \"product_id\": \"test-product-123\",
  \"user_id\": \"test-user-123\",
  \"table_admin_id\": \"test-admin-123\"
}"

# 6. Get Transactions by User
test_api "Get transactions by user" "GET" "/wallets/transactions?user_id=test-user-123" ""

# 7. Get Persons by Admin
test_api "Get persons by admin" "GET" "/wallets/persons?table_admin_id=test-admin-123" ""

# 8. Create Transaction Request
test_api "Create transaction request" "POST" "/wallets/transaction-request" "{
  \"sender_id\": \"$TEST_PUBLIC_KEY\",
  \"receiver_id\": \"$TEST_PUBLIC_KEY\",
  \"amount\": \"5\",
  \"currency\": \"XLM\",
  \"price\": \"1.00\",
  \"memo\": \"Test transaction request\",
  \"multi_sig\": false
}"

# 9. Accept Transaction Request (will fail without valid request_id)
test_api "Accept transaction request (will fail without valid request_id)" "POST" "/wallets/accept-transaction" "{
  \"request_id\": \"test-request-id\",
  \"signer_secret\": \"$TEST_SECRET_KEY\",
  \"multi_sig\": false
}"

# 10. Get Wallet Details by ID
test_api "Get wallet details by ID" "GET" "/wallets/$TEST_WALLET_ID" ""

# 11. Get Wallet Amounts
test_api "Get wallet amounts by secret key" "POST" "/wallets/amounts" "{
  \"userSecret\": \"$TEST_SECRET_KEY\"
}"

# 12. Create Memo
test_api "Create memo" "POST" "/memos/create" "{
  \"creatorKey\": \"$TEST_SECRET_KEY\",
  \"memo\": \"Test memo for API testing\",
  \"bdAmount\": \"5\",
  \"assetId\": \"test-asset-123\"
}"

# 13. Pay for Memo (will fail without valid memoId)
test_api "Pay for memo (will fail without valid memoId)" "POST" "/memos/pay-for-memo" "{
  \"buyerSecret\": \"$TEST_SECRET_KEY\",
  \"memoId\": \"test-memo-id-123\"
}"

echo -e "${GREEN}🎉 All API tests completed!${NC}" 