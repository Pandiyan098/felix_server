import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Validation schema for creating an asset
export const createAssetSchema = Joi.object({
  asset_code: Joi.string()
    .required()
    .max(12)
    .pattern(/^[A-Z0-9]+$/)
    .messages({
      'any.required': 'Asset code is required',
      'string.max': 'Asset code must be 12 characters or less',
      'string.pattern.base': 'Asset code must contain only uppercase letters and numbers'
    }),
  asset_name: Joi.string()
    .required()
    .max(50)
    .messages({
      'any.required': 'Asset name is required',
      'string.max': 'Asset name must be 50 characters or less'
    }),
  description: Joi.string()
    .optional()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Description must be 500 characters or less'
    }),
  total_supply: Joi.number()
    .optional()
    .positive()
    .precision(7)
    .messages({
      'number.positive': 'Total supply must be a positive number',
      'number.precision': 'Total supply can have at most 7 decimal places'
    }),
  category: Joi.string()
    .optional()
    .allow('')
    .max(50)
    .messages({
      'string.max': 'Category must be 50 characters or less'
    }),
  icon_url: Joi.string()
    .optional()
    .allow('')
    .uri()
    .messages({
      'string.uri': 'Icon URL must be a valid URL'
    }),
  website: Joi.string()
    .optional()
    .allow('')
    .uri()
    .messages({
      'string.uri': 'Website must be a valid URL'
    })
});

// Validation schema for getting assets with query parameters
export const getAssetsSchema = Joi.object({
  page: Joi.number()
    .optional()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be 1 or greater',
      'number.integer': 'Page must be an integer'
    }),
  limit: Joi.number()
    .optional()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.min': 'Limit must be 1 or greater',
      'number.max': 'Limit must be 100 or less',
      'number.integer': 'Limit must be an integer'
    }),
  is_active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'is_active must be true or false'
    }),
  category: Joi.string()
    .optional()
    .allow('')
    .max(50)
    .messages({
      'string.max': 'Category must be 50 characters or less'
    })
});

// Validation schema for getting asset by ID
export const getAssetByIdSchema = Joi.object({
  assetId: Joi.string()
    .required()
    .guid({ version: 'uuidv4' })
    .messages({
      'any.required': 'Asset ID is required',
      'string.guid': 'Asset ID must be a valid UUID'
    })
});

// Validation schema for toggling asset status
export const toggleAssetStatusSchema = Joi.object({
  assetId: Joi.string()
    .required()
    .guid({ version: 'uuidv4' })
    .messages({
      'any.required': 'Asset ID is required',
      'string.guid': 'Asset ID must be a valid UUID'
    })
});

// Validation schema for issuing assets
export const issueAssetSchema = Joi.object({
  assetId: Joi.string()
    .required()
    .guid({ version: 'uuidv4' })
    .messages({
      'any.required': 'Asset ID is required',
      'string.guid': 'Asset ID must be a valid UUID'
    }),
  recipient_public_key: Joi.string()
    .required()
    .length(56)
    .pattern(/^G[A-Z0-9]{55}$/)
    .messages({
      'any.required': 'Recipient public key is required',
      'string.length': 'Stellar public key must be 56 characters long',
      'string.pattern.base': 'Invalid Stellar public key format'
    }),
  amount: Joi.number()
    .required()
    .positive()
    .precision(7)
    .messages({
      'any.required': 'Amount is required',
      'number.positive': 'Amount must be a positive number',
      'number.precision': 'Amount can have at most 7 decimal places'
    })
});

// Generic validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Combine body, params, and query for validation
    const dataToValidate = {
      ...req.body,
      ...req.params,
      ...req.query
    };

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation error',
        details: errorDetails
      });
    }

    // Replace request data with validated and sanitized data safely
    if (req.body) {
      Object.assign(req.body, value);
    }
    if (req.params) {
      Object.assign(req.params, value);
    }
    if (req.query) {
      Object.assign(req.query, value);
    }

    next();
  };
};
