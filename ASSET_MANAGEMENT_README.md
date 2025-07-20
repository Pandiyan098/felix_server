# Asset Management API Documentation

This document provides comprehensive information about the custom asset management APIs added to the Felix Service.

## Overview

The Asset Management API allows you to create and manage custom Stellar assets in addition to the existing Blue Dollar (BD) asset. Each custom asset gets its own Stellar issuer account automatically created and funded (on testnet).

## Features

- ✅ **Create Custom Asset Issuers**: Generate new Stellar assets with automatic issuer account creation
- ✅ **List All Assets**: Retrieve assets with filtering and pagination
- ✅ **Asset Details**: Get detailed information about specific assets
- ✅ **Status Management**: Toggle assets between active/inactive states
- ✅ **Asset Issuance**: Issue custom assets to Stellar accounts
- ✅ **Database Integration**: All assets stored in Supabase database
- ✅ **Stellar Network Integration**: Full Stellar testnet/mainnet support
- ✅ **Authentication & Authorization**: Role-based access control
- ✅ **Comprehensive Validation**: Input validation and error handling
- ✅ **Swagger Documentation**: Complete API documentation

## Database Schema

The asset management system uses the existing `assets` table in Supabase:

```sql
create table public.assets (
  asset_id uuid not null default gen_random_uuid (),
  asset_code character varying(12) not null,
  asset_name character varying(50) not null,
  asset_provider character varying(100) not null,
  asset_provider_public_key character varying(56) not null,
  asset_provider_secret_key text null,
  description text null,
  total_supply numeric(30, 7) null,
  category character varying(50) null,
  icon_url text null,
  website text null,
  is_active boolean null default true,
  created_by uuid null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint assets_pkey primary key (asset_id)
);
```

## API Endpoints

### 1. Create Custom Asset Issuer

**POST** `/api/assets`

Creates a new custom asset with automatic Stellar issuer account generation.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin or Super Admin role  

**Request Body**:
```json
{
  "asset_code": "UTILITY",
  "asset_name": "Utility Token",
  "description": "A utility token for platform services",
  "total_supply": 10000000,
  "category": "utility",
  "icon_url": "https://example.com/icon.png",
  "website": "https://example.com"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Custom asset issuer created successfully",
  "asset": {
    "asset_id": "123e4567-e89b-12d3-a456-426614174000",
    "asset_code": "UTILITY",
    "asset_name": "Utility Token",
    "asset_provider": "Stellar Network",
    "asset_provider_public_key": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    "description": "A utility token for platform services",
    "total_supply": 10000000,
    "category": "utility",
    "icon_url": "https://example.com/icon.png",
    "website": "https://example.com",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Get All Assets

**GET** `/api/assets`

Retrieves all assets with optional filtering and pagination.

**Authentication**: Required (Bearer Token)

**Query Parameters**:
- `page` (integer, default: 1): Page number
- `limit` (integer, default: 10, max: 100): Items per page
- `is_active` (boolean): Filter by active status
- `category` (string): Filter by category

**Example**: `/api/assets?page=1&limit=10&is_active=true&category=utility`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "asset_id": "123e4567-e89b-12d3-a456-426614174000",
        "asset_code": "UTILITY",
        "asset_name": "Utility Token",
        "asset_provider": "Stellar Network",
        "asset_provider_public_key": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
        "is_active": true,
        "category": "utility",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "total_pages": 3,
      "has_next": true,
      "has_prev": false
    },
    "filters": {
      "is_active": true,
      "category": "utility"
    }
  }
}
```

### 3. Get Asset Details by ID

**GET** `/api/assets/{assetId}`

Retrieves detailed information about a specific asset.

**Authentication**: Required (Bearer Token)

**Path Parameters**:
- `assetId` (UUID): Asset unique identifier

**Response** (200 OK):
```json
{
  "success": true,
  "asset": {
    "asset_id": "123e4567-e89b-12d3-a456-426614174000",
    "asset_code": "UTILITY",
    "asset_name": "Utility Token",
    "asset_provider": "Stellar Network",
    "asset_provider_public_key": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    "description": "A utility token for platform services",
    "total_supply": 10000000,
    "category": "utility",
    "icon_url": "https://example.com/icon.png",
    "website": "https://example.com",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Toggle Asset Status

**PATCH** `/api/assets/{assetId}/toggle-status`

Toggles the active status of an asset between active and inactive.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin or Super Admin role

**Path Parameters**:
- `assetId` (UUID): Asset unique identifier

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Asset status updated to inactive",
  "asset": {
    "asset_id": "123e4567-e89b-12d3-a456-426614174000",
    "asset_code": "UTILITY",
    "asset_name": "Utility Token",
    "is_active": false,
    "updated_at": "2024-01-15T15:45:00Z"
  }
}
```

### 5. Issue Asset to Account

**POST** `/api/assets/{assetId}/issue`

Issues a specified amount of the custom asset to a Stellar account.

**Authentication**: Required (Bearer Token)  
**Authorization**: Admin or Super Admin role

**Path Parameters**:
- `assetId` (UUID): Asset unique identifier

**Request Body**:
```json
{
  "recipient_public_key": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
  "amount": 1000
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Asset issued successfully",
  "transaction": {
    "transaction_hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
    "asset_code": "UTILITY",
    "issuer": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    "recipient": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37",
    "amount": "1000",
    "ledger": 12345678,
    "status": "success"
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "asset_code",
      "message": "Asset code must be 12 characters or less"
    }
  ]
}
```

Common HTTP status codes:
- **400**: Bad Request (validation errors, invalid input)
- **401**: Unauthorized (missing or invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (asset not found)
- **409**: Conflict (asset code already exists)
- **500**: Internal Server Error
- **503**: Service Unavailable (Stellar network errors)

## Authentication

All endpoints require authentication using a Bearer token:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

Get your token by using the authentication endpoints:
1. `GET /api/auth/login` - Get Keycloak login URL
2. `GET /api/auth/callback` - Handle Keycloak callback

## Authorization Roles

- **Super Admin**: Can perform all operations
- **Table Admin**: Can perform all operations  
- **User**: Can only view assets (read-only access)

## Validation Rules

### Asset Code
- Required field
- 1-12 characters maximum
- Uppercase letters and numbers only
- Must be unique across all assets

### Asset Name
- Required field
- 1-50 characters maximum

### Description
- Optional field
- Maximum 500 characters

### Total Supply
- Optional field
- Must be positive number
- Up to 7 decimal places

### Category
- Optional field
- Maximum 50 characters

### URLs (icon_url, website)
- Optional fields
- Must be valid URL format

### Stellar Public Key (for issuing)
- Must be 56 characters
- Must start with 'G'
- Must be valid Stellar public key format

### Amount (for issuing)
- Must be positive number
- Up to 7 decimal places
- Minimum: 0.0000001

## Testing

### Using the Test Script

Run the provided test script:

```bash
node test-asset-apis.js
```

### Using Postman

Import the provided Postman collection:

```bash
# Import the collection file
Asset-Management-APIs.postman_collection.json
```

### Using curl

**Create an asset**:
```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "asset_code": "MYTOKEN",
    "asset_name": "My Custom Token",
    "description": "A test token",
    "category": "utility"
  }'
```

**Get all assets**:
```bash
curl -X GET "http://localhost:3000/api/assets?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Stellar Network Integration

### Asset Creation Process
1. Generate new Stellar keypair for issuer
2. Store asset details in database
3. Fund issuer account (testnet only)
4. Return asset details to client

### Asset Issuance Process
1. Validate recipient has trustline
2. Build Stellar payment transaction
3. Sign with issuer's secret key
4. Submit to Stellar network
5. Return transaction details

### Trustlines
Recipients must establish trustlines before receiving custom assets:

```javascript
// Example trustline creation (client-side)
const asset = new StellarSdk.Asset('UTILITY', 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37');
const transaction = new StellarSdk.TransactionBuilder(account, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: StellarSdk.Networks.TESTNET,
})
.addOperation(StellarSdk.Operation.changeTrust({
  asset: asset,
}))
.setTimeout(180)
.build();
```

## File Structure

```
src/
├── app/
│   ├── controllers/
│   │   └── asset.controller.ts    # Asset API handlers
│   ├── services/
│   │   └── asset.service.ts       # Asset business logic
│   ├── dao/
│   │   └── asset.dao.ts          # Database operations
│   ├── routes/
│   │   └── asset.routes.ts       # Route definitions
│   ├── validations/
│   │   └── asset.validation.ts   # Input validation
│   ├── docs/
│   │   └── asset.docs.ts         # Swagger documentation
│   └── utils/
│       └── validation.ts         # Validation utilities
└── config/
    └── swagger.ts                # Updated with Asset schemas
```

## Environment Variables

Make sure these are configured in your `.env` file:

```env
# Stellar Configuration
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_FRIENDBOT_URL=https://friendbot.stellar.org

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Best Practices

### Asset Codes
- Use meaningful, short codes (e.g., USD, EUR, UTILITY)
- Follow existing conventions where possible
- Avoid generic names that might conflict

### Security
- Never expose asset issuer secret keys in API responses
- Always validate user permissions before operations
- Use HTTPS in production

### Error Handling
- Always handle Stellar network errors gracefully
- Provide meaningful error messages to clients
- Log errors for debugging

### Performance
- Use pagination for large asset lists
- Implement proper database indexing
- Cache frequently accessed data

## Troubleshooting

### Common Issues

**Asset creation fails with "duplicate key" error**:
- Asset code already exists
- Choose a different asset code

**Asset issuance fails with "no trustline" error**:
- Recipient hasn't established trustline
- Create trustline first on client side

**Authentication errors**:
- Check Bearer token is valid
- Verify user has required role

**Stellar network errors**:
- Check network connectivity
- Verify Horizon server is accessible
- Ensure sufficient XLM for fees

### Logs

Check application logs for detailed error information:

```bash
# View logs in development
npm run dev

# Check for specific errors
grep -i "asset" logs/application.log
```

## API Documentation

Complete API documentation is available through Swagger UI:

**Development**: http://localhost:3000/api/docs  
**Production**: https://api.felix.cateina.com/api/docs

The documentation includes:
- Interactive API testing
- Request/response examples
- Schema definitions
- Authentication details

## Support

For questions or issues with the Asset Management API:

1. Check this documentation
2. Review the Swagger documentation
3. Check application logs
4. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: January 2024  
**Maintainer**: Felix Service Team
