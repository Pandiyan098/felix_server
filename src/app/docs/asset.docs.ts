/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create a custom asset issuer
 *     description: Creates a new custom asset with a Stellar issuer account. Automatically generates and funds an issuer keypair on testnet. Requires admin or super admin role.
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetCreateRequest'
 *           examples:
 *             utility_token:
 *               summary: Utility Token Example
 *               value:
 *                 asset_code: "UTILITY"
 *                 asset_name: "Utility Token"
 *                 description: "A utility token for platform services"
 *                 total_supply: 10000000
 *                 category: "utility"
 *                 icon_url: "https://example.com/utility-icon.png"
 *                 website: "https://example.com"
 *             stablecoin:
 *               summary: Stablecoin Example
 *               value:
 *                 asset_code: "USDX"
 *                 asset_name: "USD Stablecoin"
 *                 description: "A USD-backed stablecoin"
 *                 total_supply: 1000000
 *                 category: "stablecoin"
 *     responses:
 *       201:
 *         description: Asset created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetResponse'
 *             example:
 *               success: true
 *               message: "Custom asset issuer created successfully"
 *               asset:
 *                 asset_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 asset_code: "UTILITY"
 *                 asset_name: "Utility Token"
 *                 asset_provider: "Stellar Network"
 *                 asset_provider_public_key: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                 is_active: true
 *                 created_at: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Validation error"
 *               details:
 *                 - field: "asset_code"
 *                   message: "Asset code must be 12 characters or less"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Conflict - Asset code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Asset code 'UTILITY' already exists. Please choose a different asset code."
 *       500:
 *         description: Internal server error
 *   get:
 *     summary: Get all assets with filtering and pagination
 *     description: Retrieves all assets with optional filtering by status and category. Supports pagination for large result sets.
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page (max 100)
 *         example: 10
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *         example: true
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by asset category
 *         example: "utility"
 *     responses:
 *       200:
 *         description: Assets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetResponse'
 *             example:
 *               success: true
 *               data:
 *                 assets:
 *                   - asset_id: "123e4567-e89b-12d3-a456-426614174000"
 *                     asset_code: "UTILITY"
 *                     asset_name: "Utility Token"
 *                     asset_provider: "Stellar Network"
 *                     is_active: true
 *                     category: "utility"
 *                 pagination:
 *                   page: 1
 *                   limit: 10
 *                   total: 25
 *                   total_pages: 3
 *                   has_next: true
 *                   has_prev: false
 *                 filters:
 *                   is_active: true
 *                   category: "utility"
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assets/{assetId}:
 *   get:
 *     summary: Get asset details by ID
 *     description: Retrieves detailed information about a specific asset by its unique identifier.
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique asset identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Asset details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetResponse'
 *             example:
 *               success: true
 *               asset:
 *                 asset_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 asset_code: "UTILITY"
 *                 asset_name: "Utility Token"
 *                 asset_provider: "Stellar Network"
 *                 asset_provider_public_key: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                 description: "A utility token for platform services"
 *                 total_supply: 10000000
 *                 category: "utility"
 *                 icon_url: "https://example.com/utility-icon.png"
 *                 website: "https://example.com"
 *                 is_active: true
 *                 created_at: "2024-01-15T10:30:00Z"
 *                 updated_at: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid asset ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Invalid asset ID format. Must be a valid UUID."
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Asset not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Asset not found"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assets/{assetId}/toggle-status:
 *   patch:
 *     summary: Toggle asset active/inactive status
 *     description: Toggles the active status of an asset between active and inactive. Inactive assets cannot be issued. Requires admin or super admin role.
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique asset identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Asset status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AssetResponse'
 *             example:
 *               success: true
 *               message: "Asset status updated to inactive"
 *               asset:
 *                 asset_id: "123e4567-e89b-12d3-a456-426614174000"
 *                 asset_code: "UTILITY"
 *                 asset_name: "Utility Token"
 *                 is_active: false
 *                 updated_at: "2024-01-15T15:45:00Z"
 *       400:
 *         description: Invalid asset ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/assets/{assetId}/issue:
 *   post:
 *     summary: Issue asset to a Stellar account
 *     description: Issues a specified amount of the custom asset to a Stellar account. The recipient must have established a trustline for this asset first. Requires admin or super admin role.
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique asset identifier
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AssetIssueRequest'
 *           examples:
 *             basic_issuance:
 *               summary: Basic Asset Issuance
 *               value:
 *                 recipient_public_key: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                 amount: 1000
 *             small_amount:
 *               summary: Small Amount Issuance
 *               value:
 *                 recipient_public_key: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                 amount: 0.0000001
 *     responses:
 *       200:
 *         description: Asset issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Asset issued successfully"
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     transaction_hash:
 *                       type: string
 *                       example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
 *                     asset_code:
 *                       type: string
 *                       example: "UTILITY"
 *                     issuer:
 *                       type: string
 *                       example: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                     recipient:
 *                       type: string
 *                       example: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37"
 *                     amount:
 *                       type: string
 *                       example: "1000"
 *                     ledger:
 *                       type: integer
 *                       example: 12345678
 *                     status:
 *                       type: string
 *                       example: "success"
 *       400:
 *         description: Invalid input or asset is inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalid_amount:
 *                 summary: Invalid Amount
 *                 value:
 *                   error: "Amount must be a positive number"
 *               asset_inactive:
 *                 summary: Asset Inactive
 *                 value:
 *                   error: "Asset is not active and cannot be issued"
 *               no_trustline:
 *                 summary: No Trustline
 *                 value:
 *                   error: "Recipient account has not established trustline for this asset"
 *               no_destination:
 *                 summary: Account Not Found
 *                 value:
 *                   error: "Recipient account does not exist on Stellar network"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Asset not found
 *       500:
 *         description: Internal server error
 *       503:
 *         description: Stellar network error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: "Stellar network error: Network connection failed"
 */
