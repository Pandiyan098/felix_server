import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import fetch from 'node-fetch';

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
      };
    }
  }
}

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  BASE_URL: process.env.KEYCLOAK_BASE_URL || 'http://iam-uat.cateina.com',
  REALM: process.env.KEYCLOAK_REALM || 'Cateina_Felix_Op',
  CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'felix-service-client',
};

// Cache for public keys to avoid repeated requests
let publicKeyCache: { [kid: string]: string } = {};
let publicKeyCacheExpiry = 0;

/**
 * Fetches Keycloak public keys for token verification
 */
async function getKeycloakPublicKeys(): Promise<{ [kid: string]: string }> {
  const now = Date.now();
  
  // Return cached keys if they're still valid (cache for 1 hour)
  if (publicKeyCacheExpiry > now && Object.keys(publicKeyCache).length > 0) {
    return publicKeyCache;
  }

  try {
    const response = await fetch(
      `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/certs`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch public keys: ${response.status}`);
    }

    const data: any = await response.json();
    const keys: { [kid: string]: string } = {};

    for (const key of data.keys) {
      if (key.kty === 'RSA' && key.use === 'sig') {
        // Convert JWK to PEM format
        const pemKey = `-----BEGIN RSA PUBLIC KEY-----\n${key.n}\n-----END RSA PUBLIC KEY-----`;
        keys[key.kid] = pemKey;
      }
    }

    publicKeyCache = keys;
    publicKeyCacheExpiry = now + 3600000; // Cache for 1 hour
    return keys;
  } catch (error) {
    console.error('Error fetching Keycloak public keys:', error);
    throw new Error('Failed to fetch public keys for token verification');
  }
}

/**
 * Validates JWT token with Keycloak
 */
async function validateToken(token: string): Promise<JwtPayload> {
  try {
    // Decode token header to get kid
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header.kid) {
      throw new Error('Invalid token format');
    }

    // Get public keys
    const publicKeys = await getKeycloakPublicKeys();
    const publicKey = publicKeys[decoded.header.kid];

    if (!publicKey) {
      throw new Error('Public key not found for token');
    }

    // Verify token
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}`,
      audience: KEYCLOAK_CONFIG.CLIENT_ID,
    }) as JwtPayload;

    return payload;
  } catch (error) {
    console.error('Token validation error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Middleware to authenticate requests using Keycloak JWT tokens
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format. Expected: Bearer <token>'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
      return;
    }

    // Validate token with Keycloak
    const payload = await validateToken(token);
    
    // Attach user information to request
    req.user = {
      sub: payload.sub!,
      email: payload.email!,
      preferred_username: payload.preferred_username!,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid or expired token'
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
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    // Try to validate token
    const payload = await validateToken(token);
    
    // Attach user information to request
    req.user = {
      sub: payload.sub!,
      email: payload.email!,
      preferred_username: payload.preferred_username!,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
    };

    next();
  } catch (error) {
    // Token validation failed, but we continue without authentication
    console.warn('Optional authentication failed:', error);
    next();
  }
};
