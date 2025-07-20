# 🔐 Felix Service Token Authentication Guide

## 📋 Current Status

Your auth middleware has been **successfully fixed and consolidated**! However, the user account `pandiyan` has a setup issue in Keycloak.

### ✅ What's Working
- ✅ Auth middleware is properly consolidated
- ✅ Keycloak server connection is working
- ✅ Token endpoint is responding correctly
- ✅ API endpoint `/api/fetch/token` is functional
- ✅ Your credentials are recognized by Keycloak

### ❌ Current Issue
**Error**: `"Account is not fully set up"`

This means the user account `pandiyan` in Keycloak needs to complete required actions before it can be used for authentication.

## 🔧 How to Fix the Account Issue

### Option 1: Fix in Keycloak Admin Console (Recommended)

1. **Access Keycloak Admin Console**:
   ```
   https://iam-uat.cateina.com/auth/admin/
   ```

2. **Login with admin credentials**:
   - Username: `admin`
   - Password: `KcAdmin`

3. **Navigate to the user**:
   - Go to: `Cateina_Felix_Op` realm → Users → Search for `pandiyan`
   - Click on the user

4. **Check and fix the account**:
   - **Details Tab**: Ensure "Enabled" = `ON`, "Email Verified" = `ON`
   - **Required Actions Tab**: Remove any pending actions (like UPDATE_PASSWORD, VERIFY_EMAIL, etc.)
   - **Credentials Tab**: Ensure password is set and not temporary
   - **Role Mappings Tab**: Assign appropriate roles (e.g., `super_admin`, `table_admin`)

5. **Save changes**

### Option 2: Use a Different User

If you have other user credentials that are fully set up, use those instead.

## 🚀 Testing Your Token API

Once the account is fixed, you can test using any of these methods:

### Method 1: Using the Node.js Script
```bash
cd /home/cateina/felix_service_2
node fetch-token.js
```

### Method 2: Using the Bash Script
```bash
cd /home/cateina/felix_service_2
./test-token.sh
```

### Method 3: Using curl directly
```bash
# Test your Felix API
curl -X POST http://localhost:4000/api/fetch/token \
  -H "Content-Type: application/json" \
  -d '{"username": "pandiyan", "password": "1234"}'

# Test Keycloak directly
curl -X POST "https://iam-uat.cateina.com/realms/Cateina_Felix_Op/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=felix-service-client&client_secret=iUj84dYKd3q1sAzWj6YHxv1H6ruXienz&username=pandiyan&password=1234"
```

### Method 4: Using Postman
Import the collection: `Felix-Token-Test.postman_collection.json`

## 📝 Expected Success Response

When the account is properly set up, you should see:

```json
{
  "success": true,
  "message": "Token retrieved successfully",
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 300,
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "scope": "profile email"
  }
}
```

## 🧪 Testing Role-Based Access

After getting your token, test different endpoints:

### 1. Public Endpoint (No authentication required)
```bash
curl http://localhost:4000/health
```

### 2. Protected Endpoint (Token required, no specific role)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:4000/api/entities
```

### 3. Role-Protected Endpoint (Token + specific role required)
```bash
curl -X POST http://localhost:4000/api/entities \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Entity", "code": "TEST_001", "description": "Test", "generate_stellar_keys": true}'
```

## 📁 Files Created for You

1. **`Felix-Token-Test.postman_collection.json`** - Complete Postman collection
2. **`fetch-token.js`** - Node.js script with detailed logging
3. **`test-token.sh`** - Simple bash script
4. **`TOKEN_SETUP_GUIDE.md`** - This guide

## 🔍 Debugging

If you're still having issues:

1. **Check server logs**:
   ```bash
   tail -f /home/cateina/felix_service_2/server.log
   ```

2. **Test Keycloak connectivity**:
   ```bash
   curl http://localhost:4000/test-keycloak
   ```

3. **Verify user roles in token**:
   Use the Postman collection request "5. Check User Info from Token" to decode and see user roles.

## 🎯 Next Steps

1. **Fix the user account** in Keycloak admin console
2. **Test token retrieval** using any of the provided methods
3. **Test role-based endpoints** with your token
4. **Update your application** to use proper role-based authorization

## 🔑 Your Configuration Summary

```env
KEYCLOAK_BASE_URL=https://iam-uat.cateina.com
KEYCLOAK_REALM=Cateina_Felix_Op
KEYCLOAK_CLIENT_ID=felix-service-client
KEYCLOAK_CLIENT_SECRET=iUj84dYKd3q1sAzWj6YHxv1H6ruXienz

# User Credentials
USERNAME=pandiyan
PASSWORD=1234

# API Endpoints
Felix Token API: http://localhost:4000/api/fetch/token
Direct Keycloak: https://iam-uat.cateina.com/realms/Cateina_Felix_Op/protocol/openid-connect/token
```

## 📞 Support

If you continue to have issues:
1. Check the Keycloak admin console for user setup
2. Verify all required actions are completed
3. Ensure the user has appropriate roles assigned
4. Test with the provided scripts to get detailed error information

---

**Your auth middleware is now properly fixed and ready to use once the user account issue is resolved!** 🎉
