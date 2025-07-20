import { Request, Response, NextFunction } from 'express';

/**
 * Debug middleware to log incoming request headers
 * This helps troubleshoot token-related issues
 */
export const debugHeaders = (req: Request, res: Response, next: NextFunction): void => {
  console.log('--- DEBUG: Incoming Request Headers ---');
  console.log('URL:', req.method, req.url);
  console.log('Headers:');
  
  // Log all headers
  Object.keys(req.headers).forEach(key => {
    const value = req.headers[key];
    if (key.toLowerCase() === 'authorization') {
      // Mask the token for security but show if it exists
      if (typeof value === 'string' && value.startsWith('Bearer ')) {
        console.log(`  ${key}: Bearer [TOKEN_PRESENT] (${value.length - 7} chars)`);
      } else {
        console.log(`  ${key}: ${value} [MALFORMED]`);
      }
    } else {
      console.log(`  ${key}: ${value}`);
    }
  });
  
  console.log('--- END DEBUG HEADERS ---\n');
  next();
};

/**
 * Debug middleware specifically for authentication attempts
 */
export const debugAuth = (req: Request, res: Response, next: NextFunction): void => {
  console.log('--- AUTH DEBUG ---');
  console.log('Route:', req.method, req.url);
  
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  
  if (!authHeader) {
    console.log('❌ No Authorization header found');
  } else if (Array.isArray(authHeader)) {
    console.log('⚠️  Multiple Authorization headers found:', authHeader.length);
    authHeader.forEach((header, index) => {
      console.log(`  [${index}]: ${header.startsWith('Bearer ') ? 'Bearer [TOKEN]' : header}`);
    });
  } else {
    console.log('✅ Authorization header present');
    if (authHeader.startsWith('Bearer ')) {
      const tokenLength = authHeader.substring(7).length;
      console.log(`   Format: Valid Bearer token (${tokenLength} characters)`);
    } else {
      console.log(`   Format: Invalid - "${authHeader.substring(0, 20)}..."`);
    }
  }
  
  console.log('--- END AUTH DEBUG ---\n');
  next();
};

/**
 * Middleware to log authentication results
 */
export const debugAuthResult = (req: Request, res: Response, next: NextFunction): void => {
  // Store original res.json to intercept responses
  const originalJson = res.json;
  
  res.json = function(data: any) {
    if (res.statusCode === 401) {
      console.log('🔒 Authentication failed:', data);
    } else if (req.user) {
      console.log('✅ Authentication successful for user:', {
        sub: req.user.sub,
        email: req.user.email,
        username: req.user.preferred_username,
        roles: req.user.realm_access?.roles || []
      });
    }
    
    // Call original json method
    return originalJson.call(this, data);
  };
  
  next();
};
