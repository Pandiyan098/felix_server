import Joi from 'joi';

// UUID validation pattern
const uuidSchema = Joi.string().uuid({ version: 'uuidv4' }).required();

// Stellar key validation patterns
const stellarPublicKeySchema = Joi.string().pattern(/^G[A-Z2-7]{55}$/).length(56);
const stellarSecretKeySchema = Joi.string().pattern(/^S[A-Z2-7]{55}$/).length(56);

/**
 * Schema for creating a new entity
 */
export const createEntitySchema = {
  body: Joi.object({
    name: Joi.string().max(100).required()
      .messages({
        'string.empty': 'Entity name is required',
        'string.max': 'Entity name must be 100 characters or less'
      }),
    
    code: Joi.string().max(50).required()
      .pattern(/^[A-Z0-9_-]+$/)
      .messages({
        'string.empty': 'Entity code is required',
        'string.max': 'Entity code must be 50 characters or less',
        'string.pattern.base': 'Entity code must contain only uppercase letters, numbers, underscores, and hyphens'
      }),
    
    description: Joi.string().allow('').optional(),
    
    stellar_public_key: stellarPublicKeySchema.optional()
      .messages({
        'string.pattern.base': 'Invalid Stellar public key format',
        'string.length': 'Stellar public key must be exactly 56 characters'
      }),
    
    stellar_secret_key: stellarSecretKeySchema.optional()
      .messages({
        'string.pattern.base': 'Invalid Stellar secret key format',
        'string.length': 'Stellar secret key must be exactly 56 characters'
      }),
    
    asset_code: Joi.string().max(12).optional()
      .messages({
        'string.max': 'Asset code must be 12 characters or less'
      }),
    
    entity_manager_id: uuidSchema.optional()
      .messages({
        'string.guid': 'Entity manager ID must be a valid UUID'
      }),
    
    generate_stellar_keys: Joi.boolean().optional().default(false)
  }).custom((value, helpers) => {
    // Custom validation: either provide stellar keys or request generation
    if (!value.generate_stellar_keys && !value.stellar_public_key) {
      return helpers.error('custom.stellarKeysRequired');
    }
    return value;
  }).messages({
    'custom.stellarKeysRequired': 'Either provide stellar_public_key or set generate_stellar_keys=true'
  })
};

/**
 * Schema for getting all entities with filters
 */
export const getEntitiesSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1)
      .messages({
        'number.min': 'Page must be 1 or greater'
      }),
    
    limit: Joi.number().integer().min(1).max(100).default(10)
      .messages({
        'number.min': 'Limit must be 1 or greater',
        'number.max': 'Limit must be 100 or less'
      }),
    
    is_active: Joi.string().valid('true', 'false').optional(),
    
    asset_code: Joi.string().max(12).optional(),
    
    entity_manager_id: uuidSchema.optional(),
    
    created_by: uuidSchema.optional()
  })
};

/**
 * Schema for getting entity by ID
 */
export const getEntityByIdSchema = {
  params: Joi.object({
    entityId: uuidSchema.messages({
      'string.guid': 'Entity ID must be a valid UUID'
    })
  })
};

/**
 * Schema for getting entity by code
 */
export const getEntityByCodeSchema = {
  params: Joi.object({
    code: Joi.string().max(50).required()
      .messages({
        'string.empty': 'Entity code is required',
        'string.max': 'Entity code must be 50 characters or less'
      })
  })
};

/**
 * Schema for updating an entity
 */
export const updateEntitySchema = {
  params: Joi.object({
    entityId: uuidSchema.messages({
      'string.guid': 'Entity ID must be a valid UUID'
    })
  }),
  
  body: Joi.object({
    name: Joi.string().max(100).optional()
      .messages({
        'string.max': 'Entity name must be 100 characters or less'
      }),
    
    code: Joi.string().max(50).optional()
      .pattern(/^[A-Z0-9_-]+$/)
      .messages({
        'string.max': 'Entity code must be 50 characters or less',
        'string.pattern.base': 'Entity code must contain only uppercase letters, numbers, underscores, and hyphens'
      }),
    
    description: Joi.string().allow('').optional(),
    
    stellar_public_key: stellarPublicKeySchema.optional()
      .messages({
        'string.pattern.base': 'Invalid Stellar public key format',
        'string.length': 'Stellar public key must be exactly 56 characters'
      }),
    
    stellar_secret_key: stellarSecretKeySchema.optional()
      .messages({
        'string.pattern.base': 'Invalid Stellar secret key format',
        'string.length': 'Stellar secret key must be exactly 56 characters'
      }),
    
    asset_code: Joi.string().max(12).optional()
      .messages({
        'string.max': 'Asset code must be 12 characters or less'
      }),
    
    entity_manager_id: uuidSchema.optional()
      .allow(null)
      .messages({
        'string.guid': 'Entity manager ID must be a valid UUID'
      }),
    
    is_active: Joi.boolean().optional()
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  })
};

/**
 * Schema for toggling entity status
 */
export const toggleEntityStatusSchema = {
  params: Joi.object({
    entityId: uuidSchema.messages({
      'string.guid': 'Entity ID must be a valid UUID'
    })
  })
};

/**
 * Schema for deleting an entity
 */
export const deleteEntitySchema = {
  params: Joi.object({
    entityId: uuidSchema.messages({
      'string.guid': 'Entity ID must be a valid UUID'
    })
  })
};

/**
 * Schema for generating stellar keys for an entity
 */
export const generateStellarKeysSchema = {
  params: Joi.object({
    entityId: uuidSchema.messages({
      'string.guid': 'Entity ID must be a valid UUID'
    })
  })
};

/**
 * Validation middleware wrapper
 */
export const validateRequest = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const validationOptions = {
      abortEarly: false, // Return all errors
      allowUnknown: true, // Allow unknown keys in the request
      stripUnknown: true // Remove unknown keys
    };

    // Validate each part of the request
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        const errorMessages = error.details.map((detail: any) => detail.message);
        return res.status(400).json({
          error: 'Validation error in path parameters',
          details: errorMessages
        });
      }
      req.params = value;
    }

    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        const errorMessages = error.details.map((detail: any) => detail.message);
        return res.status(400).json({
          error: 'Validation error in query parameters',
          details: errorMessages
        });
      }
      // Clear existing query properties and assign validated values
      Object.keys(req.query).forEach(key => delete req.query[key]);
      Object.assign(req.query, value);
    }

    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        const errorMessages = error.details.map((detail: any) => detail.message);
        return res.status(400).json({
          error: 'Validation error in request body',
          details: errorMessages
        });
      }
      req.body = value;
    }

    next();
  };
};
