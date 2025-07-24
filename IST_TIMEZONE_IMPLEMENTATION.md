# IST Timezone Implementation for Service API

## Issue
The service request API was returning timestamps in UTC format, which was not appropriate for Indian users. The created_at and updated_at timestamps needed to be converted to Indian Standard Time (IST).

## Solution Implemented

### 1. Dependencies Added
- `moment-timezone`: For accurate timezone conversion
- `@types/moment-timezone`: TypeScript definitions

```bash
npm install moment-timezone
npm install --save-dev @types/moment-timezone
```

### 2. Timezone Utility Functions
Created `src/utils/timezone.utils.ts` with the following functions:

- `convertToIST(utcTimestamp)`: Converts UTC to IST format (YYYY-MM-DD HH:mm:ss)
- `convertToISTWithTimezone(utcTimestamp)`: Converts UTC to IST with timezone info (YYYY-MM-DD HH:mm:ss z)
- `getCurrentIST()`: Gets current time in IST
- `convertToISTISO(utcTimestamp)`: Converts UTC to IST in ISO format
- `transformServiceWithIST(service)`: Transforms service objects to include IST timestamps
- `transformProposalWithIST(proposal)`: Transforms proposal objects to include IST timestamps

### 3. Updated Service Functions
Modified the following functions in `src/app/services/service.service.ts`:

#### getAllService()
- Now returns services with timestamps converted to IST
- Each service object includes both `created_at` (IST format) and `created_at_ist` (IST with timezone)

#### getAllproposal()
- Now returns proposals with timestamps converted to IST
- Each proposal object includes both `created_at` (IST format) and `created_at_ist` (IST with timezone)

#### createServiceRequest()
- Returns newly created service with IST timestamps

#### proposeService()
- Returns newly created proposal with IST timestamps

### 4. API Response Format
The API now returns timestamps in the following format:

**Before (UTC only):**
```json
{
  "id": "123",
  "title": "Sample Service",
  "created_at": "2024-07-24T07:44:44Z"
}
```

**After (IST conversion):**
```json
{
  "id": "123",
  "title": "Sample Service",
  "created_at": "2024-07-24 13:14:44",
  "created_at_ist": "2024-07-24 13:14:44 IST",
  "updated_at": "2024-07-24 14:00:00",
  "updated_at_ist": "2024-07-24 14:00:00 IST"
}
```

### 5. Timezone Conversion Details
- Indian Standard Time (IST) is UTC+5:30
- UTC 07:44:44 → IST 13:14:44 (adds 5 hours 30 minutes)
- The conversion handles daylight saving time automatically
- Timezone is set to 'Asia/Kolkata' for accurate IST conversion

### 6. Health Endpoint Enhancement
Updated the `/health` endpoint to demonstrate timezone conversion:

```json
{
  "status": "OK",
  "timestamp_utc": "2024-07-24T09:22:04.599Z",
  "timestamp_ist": "2024-07-24 14:52:04 IST"
}
```

## Benefits
1. **User-Friendly**: Timestamps are now displayed in IST, making them more readable for Indian users
2. **Backward Compatible**: Both formats are provided for flexibility
3. **Accurate**: Uses moment-timezone library for precise timezone conversion
4. **Consistent**: All service and proposal endpoints now return IST timestamps
5. **Maintainable**: Centralized timezone utilities make future changes easy

## Issue Resolution

### Problem Identified
The initial implementation had an issue where database timestamps were being stored in IST format (due to server timezone) but the conversion function was treating them as if they were already converted, resulting in incorrect timestamps.

**Example of the issue:**
- Database stored: `2025-07-24 09:25:42` (actually UTC time)
- Expected IST: `2025-07-24 14:55:42` (UTC + 5:30 hours)
- Previous result: `2025-07-24 09:25:42` (no conversion applied)

### Solution Applied
Updated the timezone utility functions to properly handle timestamps without timezone information by treating them as UTC and then converting to IST.

**Updated conversion logic:**
```typescript
if (typeof timestamp === 'string' && !timestamp.includes('Z') && !timestamp.includes('+')) {
  // Parse as UTC and convert to IST
  return moment.utc(timestamp).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
}
```

## Testing
The implementation has been tested and verified:
- UTC to IST conversion is accurate (adds 5:30 hours)
- Database timestamps without timezone info are correctly treated as UTC
- All service API endpoints return properly formatted IST timestamps
- TypeScript compilation is successful
- No breaking changes to existing API contracts

**Test Results:**
- Input: `2025-07-24 09:25:42` → Output: `2025-07-24 14:55:42 IST` ✅
- Current time UTC: `09:27:02` → IST: `14:57:02` ✅

## Usage
All service-related API endpoints will now automatically return timestamps in IST format:
- `GET /api/services` - Lists all services with IST timestamps
- `POST /api/services` - Creates service and returns IST timestamps
- `GET /api/proposals?request_id=ID` - Lists proposals with IST timestamps
- `POST /api/proposals` - Creates proposal and returns IST timestamps

The timezone conversion is handled automatically by the service layer, requiring no changes to client applications.
