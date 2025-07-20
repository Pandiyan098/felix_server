import { Request, Response } from 'express';
import { KeycloakTokenService, TokenRequest } from '../services/keycloak-token.service';

export class KeycloakTokenController {
  /**
   * Get access token from Keycloak using username and password
   * @swagger
   * /api/keycloak/token:
   *   post:
   *     summary: Get access token from Keycloak
   *     tags: [Keycloak]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Username for authentication
   *                 example: "john.doe@example.com"
   *               password:
   *                 type: string
   *                 description: Password for authentication
   *                 example: "password123"
   *               grant_type:
   *                 type: string
   *                 description: OAuth2 grant type
   *                 default: "password"
   *               client_id:
   *                 type: string
   *                 description: Keycloak client ID
   *               client_secret:
   *                 type: string
   *                 description: Keycloak client secret
   *     responses:
   *       200:
   *         description: Successfully obtained access token
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
   *                   example: "Access token obtained successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     access_token:
   *                       type: string
   *                       description: JWT access token
   *                     expires_in:
   *                       type: number
   *                       description: Token expiration time in seconds
   *                     refresh_expires_in:
   *                       type: number
   *                       description: Refresh token expiration time in seconds
   *                     refresh_token:
   *                       type: string
   *                       description: Refresh token
   *                     token_type:
   *                       type: string
   *                       description: Token type (usually "Bearer")
   *                     session_state:
   *                       type: string
   *                       description: Session state
   *                     scope:
   *                       type: string
   *                       description: Token scope
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Authentication failed
   *       500:
   *         description: Internal server error
   */
  static async getAccessToken(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password, grant_type, client_id, client_secret } = req.body;

      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required',
          error: 'MISSING_CREDENTIALS'
        });
      }

      const tokenRequest: TokenRequest = {
        username,
        password,
        grant_type,
        client_id,
        client_secret
      };

      const tokenResponse = await KeycloakTokenService.getAccessToken(tokenRequest);

      return res.status(200).json({
        success: true,
        message: 'Access token obtained successfully',
        data: tokenResponse
      });

    } catch (error) {
      console.error('Error in getAccessToken:', error);
      return res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get access token',
        error: 'TOKEN_REQUEST_FAILED'
      });
    }
  }

  /**
   * Refresh access token using refresh token
   * @swagger
   * /api/keycloak/refresh:
   *   post:
   *     summary: Refresh access token
   *     tags: [Keycloak]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refresh_token
   *             properties:
   *               refresh_token:
   *                 type: string
   *                 description: Refresh token from previous authentication
   *               client_id:
   *                 type: string
   *                 description: Keycloak client ID
   *               client_secret:
   *                 type: string
   *                 description: Keycloak client secret
   *     responses:
   *       200:
   *         description: Successfully refreshed access token
   *       400:
   *         description: Invalid refresh token
   *       500:
   *         description: Internal server error
   */
  static async refreshToken(req: Request, res: Response): Promise<Response> {
    try {
      const { refresh_token, client_id, client_secret } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'MISSING_REFRESH_TOKEN'
        });
      }

      const tokenResponse = await KeycloakTokenService.refreshToken(refresh_token, client_id, client_secret);

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokenResponse
      });

    } catch (error) {
      console.error('Error in refreshToken:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to refresh token',
        error: 'TOKEN_REFRESH_FAILED'
      });
    }
  }

  /**
   * Logout and invalidate tokens
   * @swagger
   * /api/keycloak/logout:
   *   post:
   *     summary: Logout and invalidate tokens
   *     tags: [Keycloak]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - refresh_token
   *             properties:
   *               refresh_token:
   *                 type: string
   *                 description: Refresh token to invalidate
   *               client_id:
   *                 type: string
   *                 description: Keycloak client ID
   *               client_secret:
   *                 type: string
   *                 description: Keycloak client secret
   *     responses:
   *       200:
   *         description: Successfully logged out
   *       400:
   *         description: Invalid request
   *       500:
   *         description: Internal server error
   */
  static async logout(req: Request, res: Response): Promise<Response> {
    try {
      const { refresh_token, client_id, client_secret } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
          error: 'MISSING_REFRESH_TOKEN'
        });
      }

      await KeycloakTokenService.logout(refresh_token, client_id, client_secret);

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      console.error('Error in logout:', error);
      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to logout',
        error: 'LOGOUT_FAILED'
      });
    }
  }

  /**
   * Get user information using access token
   * @swagger
   * /api/keycloak/userinfo:
   *   get:
   *     summary: Get user information
   *     tags: [Keycloak]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Successfully retrieved user information
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
   *                   example: "User information retrieved successfully"
   *                 data:
   *                   type: object
   *                   description: User information from Keycloak
   *       401:
   *         description: Invalid or missing access token
   *       500:
   *         description: Internal server error
   */
  static async getUserInfo(req: Request, res: Response): Promise<Response> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Access token is required',
          error: 'MISSING_ACCESS_TOKEN'
        });
      }

      const accessToken = authHeader.substring(7);
      const userInfo = await KeycloakTokenService.getUserInfo(accessToken);

      return res.status(200).json({
        success: true,
        message: 'User information retrieved successfully',
        data: userInfo
      });

    } catch (error) {
      console.error('Error in getUserInfo:', error);
      return res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get user info',
        error: 'USER_INFO_FAILED'
      });
    }
  }
}
