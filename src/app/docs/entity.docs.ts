/**
 * @swagger
 * components:
 *   schemas:
 *     Entity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the entity
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Entity name
 *         code:
 *           type: string
 *           maxLength: 50
 *           description: Unique entity code
 *         description:
 *           type: string
 *           nullable: true
 *           description: Entity description
 *         stellar_public_key:
 *           type: string
 *           pattern: ^G[A-Z2-7]{55}$
 *           description: Stellar public key (56 characters)
 *         stellar_secret_key:
 *           type: string
 *           pattern: ^S[A-Z2-7]{55}$
 *           nullable: true
 *           description: Stellar secret key (56 characters)
 *         asset_code:
 *           type: string
 *           maxLength: 12
 *           default: BD
 *           description: Associated asset code
 *         created_by:
 *           type: string
 *           format: uuid
 *           description: UUID of the user who created the entity
 *         entity_manager_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the entity manager
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Entity active status
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Entity creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       required:
 *         - id
 *         - name
 *         - code
 *         - stellar_public_key
 *         - created_by
 *         - is_active
 *         - created_at
 *         - updated_at
 * 
 *     CreateEntityRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Entity name
 *         code:
 *           type: string
 *           maxLength: 50
 *           pattern: ^[A-Z0-9_-]+$
 *           description: Unique entity code (uppercase letters, numbers, underscores, hyphens only)
 *         description:
 *           type: string
 *           description: Entity description
 *         stellar_public_key:
 *           type: string
 *           pattern: ^G[A-Z2-7]{55}$
 *           description: Stellar public key (required if generate_stellar_keys is false)
 *         stellar_secret_key:
 *           type: string
 *           pattern: ^S[A-Z2-7]{55}$
 *           description: Stellar secret key (optional)
 *         asset_code:
 *           type: string
 *           maxLength: 12
 *           default: BD
 *           description: Associated asset code
 *         entity_manager_id:
 *           type: string
 *           format: uuid
 *           description: UUID of the entity manager
 *         generate_stellar_keys:
 *           type: boolean
 *           default: false
 *           description: Whether to auto-generate Stellar keypair
 *       required:
 *         - name
 *         - code
 * 
 *     UpdateEntityRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           maxLength: 100
 *           description: Entity name
 *         code:
 *           type: string
 *           maxLength: 50
 *           pattern: ^[A-Z0-9_-]+$
 *           description: Unique entity code
 *         description:
 *           type: string
 *           description: Entity description
 *         stellar_public_key:
 *           type: string
 *           pattern: ^G[A-Z2-7]{55}$
 *           description: Stellar public key
 *         stellar_secret_key:
 *           type: string
 *           pattern: ^S[A-Z2-7]{55}$
 *           description: Stellar secret key
 *         asset_code:
 *           type: string
 *           maxLength: 12
 *           description: Associated asset code
 *         entity_manager_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *           description: UUID of the entity manager
 *         is_active:
 *           type: boolean
 *           description: Entity active status
 * 
 *     EntityStatistics:
 *       type: object
 *       properties:
 *         total_entities:
 *           type: integer
 *           description: Total number of entities
 *         active_entities:
 *           type: integer
 *           description: Number of active entities
 *         inactive_entities:
 *           type: integer
 *           description: Number of inactive entities
 *         asset_codes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               asset_code:
 *                 type: string
 *                 description: Asset code
 *               count:
 *                 type: integer
 *                 description: Number of entities with this asset code
 *         entities_by_manager:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               entity_manager_id:
 *                 type: string
 *                 format: uuid
 *                 description: Entity manager UUID
 *               count:
 *                 type: integer
 *                 description: Number of entities managed by this manager
 */

/**
 * @swagger
 * /api/entities:
 *   post:
 *     summary: Create a new entity
 *     description: Creates a new entity with the provided information. Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEntityRequest'
 *           examples:
 *             with_keys:
 *               summary: Entity with provided Stellar keys
 *               value:
 *                 name: "Example Corporation"
 *                 code: "EXAMPLE_CORP"
 *                 description: "A sample corporation entity"
 *                 stellar_public_key: "GCKFBEIYTKP5RPHQLWKGNOUB7NHC7PB6J4NSLHB4YRCGGJZWB5CSDCCF"
 *                 stellar_secret_key: "SDDXSQVTZD3QK2TQVTVQMIGOWH5XPFDQ2AJMFQGHZQZQGBM6JKPCCQQJ"
 *                 asset_code: "USD"
 *                 entity_manager_id: "123e4567-e89b-12d3-a456-426614174000"
 *             auto_generate_keys:
 *               summary: Entity with auto-generated Stellar keys
 *               value:
 *                 name: "Auto Corp"
 *                 code: "AUTO_CORP"
 *                 description: "Corporation with auto-generated keys"
 *                 generate_stellar_keys: true
 *                 asset_code: "BD"
 *     responses:
 *       201:
 *         description: Entity created successfully
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
 *                   example: "Entity created successfully"
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       409:
 *         description: Conflict (entity code already exists)
 *       500:
 *         description: Internal server error
 * 
 *   get:
 *     summary: Get all entities with filtering and pagination
 *     description: Retrieves a paginated list of entities with optional filtering.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: asset_code
 *         schema:
 *           type: string
 *           maxLength: 12
 *         description: Filter by asset code
 *       - in: query
 *         name: entity_manager_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by entity manager ID
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by creator ID
 *     responses:
 *       200:
 *         description: Entities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     entities:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Entity'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         total_pages:
 *                           type: integer
 *                         has_next:
 *                           type: boolean
 *                         has_prev:
 *                           type: boolean
 *                     filters:
 *                       type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/entities/statistics:
 *   get:
 *     summary: Get entity statistics
 *     description: Retrieves statistical information about entities. Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statistics:
 *                   $ref: '#/components/schemas/EntityStatistics'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/entities/code/{code}:
 *   get:
 *     summary: Get entity by code
 *     description: Retrieves an entity by its unique code.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Entity code
 *     responses:
 *       200:
 *         description: Entity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/entities/{entityId}:
 *   get:
 *     summary: Get entity by ID
 *     description: Retrieves an entity by its UUID.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity UUID
 *     responses:
 *       200:
 *         description: Entity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (invalid UUID)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 * 
 *   put:
 *     summary: Update entity
 *     description: Updates an existing entity. Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateEntityRequest'
 *           example:
 *             name: "Updated Corporation"
 *             description: "Updated description"
 *             asset_code: "EUR"
 *     responses:
 *       200:
 *         description: Entity updated successfully
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
 *                   example: "Entity updated successfully"
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (validation error or invalid UUID)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       404:
 *         description: Entity not found
 *       409:
 *         description: Conflict (entity code already exists)
 *       500:
 *         description: Internal server error
 * 
 *   delete:
 *     summary: Soft delete entity
 *     description: Deactivates an entity (soft delete). Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity UUID
 *     responses:
 *       200:
 *         description: Entity deactivated successfully
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
 *                   example: "Entity deactivated successfully"
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (invalid UUID or entity already inactive)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/entities/{entityId}/toggle-status:
 *   patch:
 *     summary: Toggle entity status
 *     description: Toggles an entity between active and inactive status. Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity UUID
 *     responses:
 *       200:
 *         description: Entity status toggled successfully
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
 *                   example: "Entity status updated to active"
 *                 entity:
 *                   $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (invalid UUID)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/entities/{entityId}/generate-keys:
 *   post:
 *     summary: Generate new Stellar keypair
 *     description: Generates and assigns a new Stellar keypair to an entity. Requires admin privileges.
 *     tags: [Entities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Entity UUID
 *     responses:
 *       200:
 *         description: Stellar keypair generated successfully
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
 *                   example: "New Stellar keypair generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     stellar_public_key:
 *                       type: string
 *                       description: New Stellar public key
 *                     stellar_secret_key:
 *                       type: string
 *                       description: New Stellar secret key
 *                     entity:
 *                       $ref: '#/components/schemas/Entity'
 *       400:
 *         description: Bad request (invalid UUID)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (insufficient privileges)
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Internal server error
 */

export {};
