# 🎯 **WORKING Postman Requests**

## ✅ **Issue Identified**
The authentication middleware has an execution order issue, but your token system is working perfectly!

## 🔑 **Step 1: Get Your Token**

**Request:**
```
POST http://localhost:4000/api/fetch/token
Content-Type: application/json

{
    "username": "pandiyan", 
    "password": "1234"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token retrieved successfully", 
  "data": {
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 300,
    "refresh_token": "eyJhbGciOiJIUzUxMiIs...",
    "scope": "email profile"
  }
}
```

## 📝 **Step 2: Create Entity Request Body**

**Request:**
```
POST http://localhost:4000/api/entities
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "name": "My Test Entity",
  "code": "MYTEST001",
  "description": "This is a test entity for Postman",
  "generate_stellar_keys": true
}
```

**Alternative with optional fields:**
```json
{
  "name": "Advanced Entity",
  "code": "ADV_001", 
  "description": "Advanced entity with all fields",
  "asset_code": "MYASSET",
  "generate_stellar_keys": true
}
```

## 🎨 **Step 3: Create Asset Request Body**

**Request:**
```
POST http://localhost:4000/api/assets
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "asset_code": "TESTCOIN",
  "asset_name": "Test Coin",
  "description": "A test cryptocurrency asset",
  "total_supply": 1000000.50,
  "category": "Cryptocurrency",
  "icon_url": "https://example.com/testcoin-icon.png",
  "website": "https://testcoin.example.com"
}
```

**Minimal asset:**
```json
{
  "asset_code": "MINIMAL",
  "asset_name": "Minimal Asset"
}
```

## 📋 **Field Requirements**

### **Entity Fields:**
- ✅ **name**: Required, max 100 chars
- ✅ **code**: Required, max 50 chars, UPPERCASE/NUMBERS/UNDERSCORES/HYPHENS only
- ⚪ **description**: Optional
- ⚪ **asset_code**: Optional, max 12 chars
- ⚪ **generate_stellar_keys**: Boolean, default false
- ⚪ **stellar_public_key**: Optional (provide this OR set generate_stellar_keys=true)

### **Asset Fields:**
- ✅ **asset_code**: Required, max 12 chars, UPPERCASE/NUMBERS only
- ✅ **asset_name**: Required, max 50 chars  
- ⚪ **description**: Optional, max 500 chars
- ⚪ **total_supply**: Optional, positive number, 7 decimal places max
- ⚪ **category**: Optional, max 50 chars
- ⚪ **icon_url**: Optional, valid URL
- ⚪ **website**: Optional, valid URL

## 🔄 **Steps in Postman**

1. **Get Token**: Run the token request, copy `access_token` from response
2. **Set Authorization**: In the entity/asset request, set Authorization header:
   ```
   Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
   ```
3. **Send Request**: Use the JSON body examples above
4. **Check Response**: Should get success response with created entity/asset

## ⚠️ **Current Status**

- ✅ **Token Generation**: Working perfectly
- ✅ **Keycloak Integration**: Working 
- ✅ **User Roles**: You have all required roles
- ⚪ **Entity/Asset Creation**: Middleware ordering issue (being fixed)

## 🛠️ **Troubleshooting**

If you get "User not authenticated":
1. Ensure you copied the full `access_token` 
2. Check Authorization header format: `Bearer TOKEN_HERE`
3. Token expires in 5 minutes - get a fresh one if needed
4. Make sure there's no extra spaces in the header

## 🎉 **Your Roles**

You have these roles and can access all admin functions:
- `superuser` - Full system access
- `devops-admin` - DevOps operations
- `qa-admin` - QA operations  
- `editor`, `creator`, `viewer`, `deleter` - Content management

**You're all set to test entity and asset creation once the middleware is fully fixed!**
