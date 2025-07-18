import Joi from 'joi';

// Common validation patterns
export const stellarSecretKeySchema = Joi.string()
  .pattern(/^S[0-9A-Z]{55}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Stellar secret key format. Must start with S and be 56 characters long.',
    'any.required': 'Stellar secret key is required'
  });

export const stellarPublicKeySchema = Joi.string()
  .pattern(/^G[0-9A-Z]{55}$/)
  .required()
  .messages({
    'string.pattern.base': 'Invalid Stellar public key format. Must start with G and be 56 characters long.',
    'any.required': 'Stellar public key is required'
  });

export const uuidSchema = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.uuid': 'Invalid UUID format',
    'any.required': 'UUID is required'
  });

export const emailSchema = Joi.string()
  .email()
  .required()
  .messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  });

export const amountSchema = Joi.number()
  .positive()
  .precision(7)
  .required()
  .messages({
    'number.positive': 'Amount must be positive',
    'number.precision': 'Amount can have at most 7 decimal places',
    'any.required': 'Amount is required'
  });

// Auth validation schemas
export const emailLoginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  })
});

// User validation schemas
export const createAccountSchema = Joi.object({
  username: Joi.string().min(3).max(30).required().messages({
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  }),
  email: emailSchema,
  role: Joi.string().valid('admin', 'user', 'manager').required().messages({
    'any.only': 'Role must be one of: admin, user, manager',
    'any.required': 'Role is required'
  }),
  entity_belongs: Joi.string().required().messages({
    'any.required': 'Entity belongs is required'
  }),
  entity_admin_name: Joi.string().required().messages({
    'any.required': 'Entity admin name is required'
  })
});

// Wallet validation schemas
export const createWalletSchema = Joi.object({
  // No body parameters required for creating wallets
});

export const makePaymentSchema = Joi.object({
  senderSecret: stellarSecretKeySchema,
  receiverPublic: stellarPublicKeySchema,
  amount: amountSchema
});

export const makeBDPaymentSchema = Joi.object({
  senderSecret: stellarSecretKeySchema,
  receiverPublic: stellarPublicKeySchema,
  amount: amountSchema,
  product_id: uuidSchema,
  user_id: uuidSchema,
  table_admin_id: uuidSchema
});

export const createTrustlineSchema = Joi.object({
  secret: stellarSecretKeySchema
});

export const getTransactionsByUserSchema = Joi.object({
  user_id: uuidSchema,
  status: Joi.string().valid('pending', 'success', 'failed', 'completed').optional().messages({
    'any.only': 'Status must be one of: pending, success, failed, completed'
  })
});

export const getPersonsByAdminSchema = Joi.object({
  table_admin_id: uuidSchema
});

export const createStellarTransactionRequestSchema = Joi.object({
  sender_id: stellarPublicKeySchema,
  receiver_id: stellarPublicKeySchema,
  amount: amountSchema,
  currency: Joi.string().valid('XLM').default('XLM').messages({
    'any.only': 'Currency must be XLM'
  }),
  price: amountSchema,
  memo: Joi.string().max(28).optional().messages({
    'string.max': 'Memo cannot exceed 28 characters'
  }),
  multi_sig: Joi.boolean().default(false)
});

export const acceptStellarTransactionRequestSchema = Joi.object({
  request_id: uuidSchema,
  signer_secret: stellarSecretKeySchema,
  multi_sig: Joi.boolean().default(false)
});

export const getWalletAmountsSchema = Joi.object({
  userSecret: stellarSecretKeySchema
});

export const getAllServicesSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  }),
  offset: Joi.number().integer().min(0).default(0).messages({
    'number.integer': 'Offset must be an integer',
    'number.min': 'Offset must be at least 0'
  }),
  status: Joi.string().valid('pending', 'success', 'failed', 'completed').optional().messages({
    'any.only': 'Status must be one of: pending, success, failed, completed'
  })
});

// Memo validation schemas
export const createMemoSchema = Joi.object({
  content: Joi.string().max(28).required().messages({
    'string.max': 'Memo content cannot exceed 28 characters',
    'any.required': 'Memo content is required'
  }),
  user_id: uuidSchema,
  transaction_id: uuidSchema.optional()
});

export const payForMemoSchema = Joi.object({
  memo_id: uuidSchema,
  senderSecret: stellarSecretKeySchema,
  receiverPublic: stellarPublicKeySchema,
  amount: amountSchema
});

// Service validation schemas
export const createServiceSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Service name must be at least 3 characters long',
    'string.max': 'Service name cannot exceed 100 characters',
    'any.required': 'Service name is required'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  price: amountSchema,
  currency: Joi.string().valid('XLM').default('XLM').messages({
    'any.only': 'Currency must be XLM'
  }),
  provider_id: uuidSchema
});

export const updateServiceSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    'string.min': 'Service name must be at least 3 characters long',
    'string.max': 'Service name cannot exceed 100 characters'
  }),
  description: Joi.string().max(500).optional().messages({
    'string.max': 'Description cannot exceed 500 characters'
  }),
  price: amountSchema.optional(),
  currency: Joi.string().valid('XLM').optional().messages({
    'any.only': 'Currency must be XLM'
  }),
  status: Joi.string().valid('active', 'inactive').optional().messages({
    'any.only': 'Status must be either active or inactive'
  })
});

// User profile validation schemas
export const updateUserProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional().messages({
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters'
  }),
  email: emailSchema.optional(),
  first_name: Joi.string().max(50).optional().messages({
    'string.max': 'First name cannot exceed 50 characters'
  }),
  last_name: Joi.string().max(50).optional().messages({
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).optional().messages({
    'string.pattern.base': 'Invalid phone number format'
  })
});

// Query parameter validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1'
  }),
  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit cannot exceed 100'
  })
});

// ID parameter validation
export const idParamSchema = Joi.object({
  id: uuidSchema
});

// Stellar account validation
export const stellarAccountSchema = Joi.object({
  public_key: stellarPublicKeySchema,
  secret_key: stellarSecretKeySchema.optional()
});

// File upload validation (if needed)
export const fileUploadSchema = Joi.object({
  file: Joi.object({
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'application/pdf').required(),
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB limit
  }).required()
});

// Validation middleware helper
export const validateRequest = (schema: Joi.ObjectSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Replace the original data with the validated and sanitized data
    req[property] = value;
    next();
  };
};

// Combined validation for endpoints that need multiple validations
export const validateMultiple = (validations: Array<{ schema: Joi.ObjectSchema; property: 'body' | 'query' | 'params' }>) => {
  return (req: any, res: any, next: any) => {
    for (const validation of validations) {
      const { error, value } = validation.schema.validate(req[validation.property], {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        const errorMessages = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: errorMessages
        });
      }

      req[validation.property] = value;
    }
    next();
  };
};
