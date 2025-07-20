#!/bin/bash

# Keycloak Token Test Script
# This script tests token fetching with your credentials

echo "🚀 Testing Keycloak Token Fetch"
echo "================================="

# Your credentials
USERNAME="pandiyan"
PASSWORD="1234"
CLIENT_ID="felix-service-client"
CLIENT_SECRET="iUj84dYKd3q1sAzWj6YHxv1H6ruXienz"
KEYCLOAK_URL="https://iam-uat.cateina.com/realms/Cateina_Felix_Op/protocol/openid-connect/token"
FELIX_API="http://localhost:4000/api/fetch/token"

echo "👤 Username: $USERNAME"
echo "🔑 Client ID: $CLIENT_ID"
echo ""

echo "📡 Testing Direct Keycloak Endpoint..."
echo "Endpoint: $KEYCLOAK_URL"
echo ""

# Test direct Keycloak endpoint
curl -X POST "$KEYCLOAK_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&username=$USERNAME&password=$PASSWORD" \
  --verbose \
  2>&1 | tee keycloak_response.log

echo ""
echo "================================="
echo "📱 Testing Felix API Endpoint..."
echo "Endpoint: $FELIX_API"
echo ""

# Test Felix API endpoint
curl -X POST "$FELIX_API" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" \
  --verbose \
  2>&1 | tee felix_response.log

echo ""
echo "================================="
echo "📋 Results Summary:"
echo ""
echo "✅ Check keycloak_response.log for direct Keycloak response"
echo "✅ Check felix_response.log for Felix API response"
echo ""
echo "🔧 If you see 'Account is not fully set up' error:"
echo "   1. Login to Keycloak admin console"
echo "   2. Go to Users → pandiyan → Details"
echo "   3. Check 'Required User Actions' tab"
echo "   4. Remove any pending actions or complete them"
echo "   5. Ensure 'Email Verified' is true"
echo "   6. Ensure user is 'Enabled'"
echo ""
echo "🔗 Keycloak Admin URL: https://iam-uat.cateina.com/auth/admin/"
