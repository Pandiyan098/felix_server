import { Router } from 'express';
import { KeycloakTokenController } from '../controllers/keycloak-token.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Keycloak
 *   description: Keycloak token management endpoints
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// POST /api/keycloak/token - Get access token (no auth required)
router.post('/keycloak/token', KeycloakTokenController.getAccessToken);

// POST /api/keycloak/refresh - Refresh access token (no auth required)
router.post('/keycloak/refresh', KeycloakTokenController.refreshToken);

// POST /api/keycloak/logout - Logout and invalidate tokens (no auth required)
router.post('/keycloak/logout', KeycloakTokenController.logout);

// GET /api/keycloak/userinfo - Get user info (requires valid token in header)
router.get('/keycloak/userinfo', KeycloakTokenController.getUserInfo);

export default router;
