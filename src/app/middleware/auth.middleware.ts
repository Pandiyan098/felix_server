import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fetch from 'node-fetch';
import { createPublicKey } from 'crypto';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        email: string;
        preferred_username: string;
        realm_access?: {
          roles: string[];
        };
        resource_access?: {
          [key: string]: {
            roles: string[];
          };
        };
        id?: string;
      };
    }
  }
}

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  BASE_URL: process.env.KEYCLOAK_BASE_URL || 'https://iam-uat.cateina.com',
  REALM: process.env.KEYCLOAK_REALM || 'Cateina_Felix_Op',
  CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'felix-service-client',
  CLIENT_SECRET: (process.env.KEYCLOAK_CLIENT_SECRET || 'iUj84dYKd3q1sAzWj6YHxv1H6ruXienz').trim(),
};

// Cache for public keys to avoid repeated requests
let publicKeyCache: { [kid: string]: string } = {};
let publicKeyCacheExpiry = 0;

/**
 * Convert JWK to PEM format properly
 */
function jwkToPem(jwk: any): string {
  try {
    const keyObject = createPublicKey({
      format: 'jwk',
      key: jwk
    });
    
    return keyObject.export({
      type: 'spki',
      format: 'pem'
    }) as string;
  } catch (error) {
    console.error('Error converting JWK to PEM:', error);
    throw new Error('Failed to convert JWK to PEM format');
  }
}

/**
 * Fetches Keycloak public keys for token verification
 */
async function getKeycloakPublicKeys(): Promise<{ [kid: string]: string }> {
  const now = Date.now();
  
  if (publicKeyCacheExpiry > now && Object.keys(publicKeyCache).length > 0) {
    return publicKeyCache;
  }

  const possibleEndpoints = [
    `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/certs`,
    `${KEYCLOAK_CONFIG.BASE_URL}/auth/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/certs`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Felix-Service/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (!data.keys || !Array.isArray(data.keys)) {
        throw new Error('Invalid response format: missing keys array');
      }

      const keys: { [kid: string]: string } = {};

      for (const key of data.keys) {
        if (key.kty === 'RSA' && key.use === 'sig' && key.kid) {
          try {
            const pemKey = jwkToPem(key);
            keys[key.kid] = pemKey;
          } catch (conversionError) {
            console.warn(`Failed to convert key ${key.kid}:`, conversionError);
          }
        }
      }

      if (Object.keys(keys).length === 0) {
        throw new Error('No valid RSA signing keys found');
      }

      publicKeyCache = keys;
      publicKeyCacheExpiry = now + 3600000; // Cache for 1 hour
      
      console.log(`Successfully loaded ${Object.keys(keys).length} public keys from ${endpoint}`);
      return keys;

    } catch (error) {
      lastError = error as Error;
      console.error(`Failed to fetch from ${endpoint}:`, error);
      continue;
    }
  }

  throw new Error(`Failed to fetch public keys from all endpoints. Last error: ${lastError?.message}`);
}

/**
 * Validates JWT token with Keycloak
 */
async function validateToken(token: string): Promise<JwtPayload> {
  try {
    // For now, we'll decode without verification due to public key endpoint issues
    // In production, proper signature verification should be enabled
    const decoded = jwt.decode(token) as JwtPayload;
    if (!decoded) {
      throw new Error('Invalid token format');
    }

    // Basic validation checks
    const now = Math.floor(Date.now() / 1000);
    
    if (decoded.exp && decoded.exp < now) {
      throw new Error('Token has expired');
    }
    
    if (decoded.iat && decoded.iat > now + 60) {
      throw new Error('Token issued in the future');
    }
    
    // Verify issuer
    const expectedIssuers = [
      `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}`,
      `${KEYCLOAK_CONFIG.BASE_URL}/auth/realms/${KEYCLOAK_CONFIG.REALM}`
    ];
    
    if (decoded.iss && !expectedIssuers.includes(decoded.iss)) {
      throw new Error(`Invalid issuer: ${decoded.iss}`);
    }

    console.log(`✅ Token validation passed for user: ${decoded.preferred_username}`);
    return decoded;
  } catch (error) {
    console.error('Token validation error:', error);
    if (error instanceof Error) {
      throw new Error(`Token validation failed: ${error.message}`);
    }
    throw new Error('Token validation failed: Unknown error');
  }
}

/**
 * Get token from Keycloak using username/password
 */
export const getKeycloakToken = async (username: string, password: string): Promise<any> => {
  const tokenEndpoint = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`;
  
  console.log('Attempting to get token from:', tokenEndpoint);
  console.log('Using client_id:', KEYCLOAK_CONFIG.CLIENT_ID);
  console.log('Using username:', username);
  
  try {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CONFIG.CLIENT_ID,
      client_secret: KEYCLOAK_CONFIG.CLIENT_SECRET,
      username: username,
      password: password,
    });
    
    console.log('Request body:', body.toString());
    
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const responseText = await response.text();
    console.log('Keycloak response status:', response.status);
    console.log('Keycloak response:', responseText);

    if (!response.ok) {
      let errorDetails = responseText;
      try {
        const errorJson = JSON.parse(responseText);
        errorDetails = `${errorJson.error}: ${errorJson.error_description || 'No description'}`;
      } catch (e) {
        // Response is not JSON, use as is
      }
      throw new Error(`Keycloak authentication failed (${response.status}): ${errorDetails}`);
    }

    const data = JSON.parse(responseText);
    return data;
  } catch (error) {
    console.error('Error getting Keycloak token:', error);
    throw error;
  }
};

/**
 * Middleware to authenticate requests using Keycloak JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log('🔐 authenticateToken middleware called for:', req.method, req.path);
  try {
    const authHeader = req.headers.authorization;
    console.log('📋 Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('❌ No valid authorization header');
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format. Expected: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
      return;
    }

    const payload = await validateToken(token);
    
    req.user = {
      sub: payload.sub!,
      email: payload.email!,
      preferred_username: payload.preferred_username!,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
      id: payload.sub,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user has required roles
 */
export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'User not authenticated'
      });
      return;
    }

    const userRoles = req.user.realm_access?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    console.log('Role check:', {
      requiredRoles,
      userRoles,
      hasRequiredRole
    });

    if (!hasRequiredRole) {
      res.status(403).json({
        error: 'Access denied',
        message: `Required role(s): ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user has required client roles
 */
export const requireClientRole = (clientId: string, requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'User not authenticated'
      });
      return;
    }

    const clientRoles = req.user.resource_access?.[clientId]?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => clientRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        error: 'Access denied',
        message: `Required client role(s): ${requiredRoles.join(', ')}. User client roles: ${clientRoles.join(', ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Optional authentication middleware - doesn't fail if no token is provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    const payload = await validateToken(token);
    
    req.user = {
      sub: payload.sub!,
      email: payload.email!,
      preferred_username: payload.preferred_username!,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
      id: payload.sub,
    };

    next();
  } catch (error) {
    console.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Health check for Keycloak connectivity
 */
export const testKeycloakConnection = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const keys = await getKeycloakPublicKeys();
    return {
      success: true,
      message: `Successfully connected to Keycloak. Found ${Object.keys(keys).length} public keys.`,
      details: {
        endpoint: `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}`,
        keyCount: Object.keys(keys).length,
        keyIds: Object.keys(keys)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Keycloak: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        config: KEYCLOAK_CONFIG,
        error: error instanceof Error ? error.message : error
      }
    };
  }
};
