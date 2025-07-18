import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Felix Service API',
      version: '1.0.0',
      description: 'Felix Service API for Stellar blockchain operations and user management',
      contact: {
        name: 'Felix Service Team',
        email: 'support@cateina.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.felix.cateina.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Keycloak JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            message: {
              type: 'string',
              description: 'Detailed error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name that caused the error'
                  },
                  message: {
                    type: 'string',
                    description: 'Field-specific error message'
                  },
                  value: {
                    description: 'Value that caused the error'
                  }
                }
              }
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'manager'],
              description: 'User role'
            },
            entity_belongs: {
              type: 'string',
              description: 'Entity the user belongs to'
            },
            entity_admin_name: {
              type: 'string',
              description: 'Name of the entity admin'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            public_key: {
              type: 'string',
              pattern: '^G[0-9A-Z]{55}$',
              description: 'Stellar public key'
            },
            secret_key: {
              type: 'string',
              pattern: '^S[0-9A-Z]{55}$',
              description: 'Stellar secret key (sensitive)'
            }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Transaction ID'
            },
            product_id: {
              type: 'string',
              format: 'uuid',
              description: 'Product ID'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            table_admin_id: {
              type: 'string',
              format: 'uuid',
              description: 'Table admin ID'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Transaction amount'
            },
            status: {
              type: 'string',
              enum: ['pending', 'success', 'failed', 'completed'],
              description: 'Transaction status'
            },
            stellar_transaction_hash: {
              type: 'string',
              description: 'Stellar transaction hash'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Service: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Service ID'
            },
            name: {
              type: 'string',
              description: 'Service name'
            },
            description: {
              type: 'string',
              description: 'Service description'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Service price'
            },
            currency: {
              type: 'string',
              enum: ['XLM'],
              description: 'Service currency'
            },
            provider_id: {
              type: 'string',
              format: 'uuid',
              description: 'Service provider ID'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Service status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Memo: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Memo ID'
            },
            content: {
              type: 'string',
              maxLength: 28,
              description: 'Memo content (max 28 characters)'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID'
            },
            transaction_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated transaction ID'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        WalletAmounts: {
          type: 'object',
          properties: {
            public_key: {
              type: 'string',
              pattern: '^G[0-9A-Z]{55}$',
              description: 'Stellar public key'
            },
            balances: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  asset_type: {
                    type: 'string',
                    description: 'Asset type'
                  },
                  asset_code: {
                    type: 'string',
                    description: 'Asset code'
                  },
                  asset_issuer: {
                    type: 'string',
                    description: 'Asset issuer'
                  },
                  balance: {
                    type: 'string',
                    description: 'Balance amount'
                  }
                }
              }
            }
          }
        },
        TransactionRequest: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Transaction request ID'
            },
            sender_id: {
              type: 'string',
              pattern: '^G[0-9A-Z]{55}$',
              description: 'Sender public key'
            },
            receiver_id: {
              type: 'string',
              pattern: '^G[0-9A-Z]{55}$',
              description: 'Receiver public key'
            },
            amount: {
              type: 'number',
              format: 'float',
              description: 'Transaction amount'
            },
            currency: {
              type: 'string',
              enum: ['XLM'],
              description: 'Transaction currency'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Transaction price'
            },
            memo: {
              type: 'string',
              maxLength: 28,
              description: 'Transaction memo'
            },
            xdr: {
              type: 'string',
              description: 'Transaction XDR for multi-signature'
            },
            status: {
              type: 'string',
              enum: ['pending', 'success', 'failed'],
              description: 'Request status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Wallets',
        description: 'Stellar wallet management endpoints'
      },
      {
        name: 'Transactions',
        description: 'Transaction management endpoints'
      },
      {
        name: 'Services',
        description: 'Service management endpoints'
      },
      {
        name: 'Memos',
        description: 'Memo management endpoints'
      }
    ]
  },
  apis: [
    './src/app/routes/*.ts',
    './src/app/controllers/*.ts'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi };

// Swagger UI options
export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    docExpansion: 'none',
    supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
    onComplete: function() {
      // Add custom styling or behavior after Swagger UI loads
      console.log('Swagger UI loaded successfully');
    }
  },
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Felix Service API Documentation',
  customfavIcon: '/favicon.ico'
};
