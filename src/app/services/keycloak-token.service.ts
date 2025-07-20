import fetch from 'node-fetch';

// Keycloak configuration
const KEYCLOAK_CONFIG = {
  BASE_URL: process.env.KEYCLOAK_BASE_URL || 'https://iam-uat.cateina.com',
  REALM: process.env.KEYCLOAK_REALM || 'Cateina_Felix_Op',
  CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'felix-service-client',
  CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || '', // Add client secret if available
};

export interface TokenRequest {
  username: string;
  password: string;
  grant_type?: string;
  client_id?: string;
  client_secret?: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  not_before_policy?: number;
  session_state: string;
  scope: string;
}

export interface TokenError {
  error: string;
  error_description?: string;
}

export class KeycloakTokenService {
  /**
   * Get access token using username and password
   */
  static async getAccessToken(tokenRequest: TokenRequest): Promise<TokenResponse> {
    try {
      const tokenUrl = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/token`;
      console.log('🔍 Debug - Token URL:', tokenUrl);
      console.log('🔍 Debug - BASE_URL:', KEYCLOAK_CONFIG.BASE_URL);
      
      // Prepare form data
      const formData = new URLSearchParams();
      formData.append('grant_type', tokenRequest.grant_type || 'password');
      formData.append('client_id', tokenRequest.client_id || KEYCLOAK_CONFIG.CLIENT_ID);
      formData.append('username', tokenRequest.username);
      formData.append('password', tokenRequest.password);
      
      // Add client secret if provided
      if (tokenRequest.client_secret || KEYCLOAK_CONFIG.CLIENT_SECRET) {
        formData.append('client_secret', tokenRequest.client_secret || KEYCLOAK_CONFIG.CLIENT_SECRET);
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const responseData = await response.json() as TokenResponse | TokenError;

      if (!response.ok) {
        const errorData = responseData as TokenError;
        throw new Error(`Keycloak token request failed: ${errorData.error}${errorData.error_description ? ' - ' + errorData.error_description : ''}`);
      }

      return responseData as TokenResponse;
    } catch (error) {
      console.error('Error getting Keycloak access token:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get access token from Keycloak');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(refreshToken: string, clientId?: string, clientSecret?: string): Promise<TokenResponse> {
    try {
      const tokenUrl = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/token`;
      
      const formData = new URLSearchParams();
      formData.append('grant_type', 'refresh_token');
      formData.append('client_id', clientId || KEYCLOAK_CONFIG.CLIENT_ID);
      formData.append('refresh_token', refreshToken);
      
      if (clientSecret || KEYCLOAK_CONFIG.CLIENT_SECRET) {
        formData.append('client_secret', clientSecret || KEYCLOAK_CONFIG.CLIENT_SECRET);
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      const responseData = await response.json() as TokenResponse | TokenError;

      if (!response.ok) {
        const errorData = responseData as TokenError;
        throw new Error(`Keycloak token refresh failed: ${errorData.error}${errorData.error_description ? ' - ' + errorData.error_description : ''}`);
      }

      return responseData as TokenResponse;
    } catch (error) {
      console.error('Error refreshing Keycloak token:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to refresh token');
    }
  }

  /**
   * Logout and invalidate tokens
   */
  static async logout(refreshToken: string, clientId?: string, clientSecret?: string): Promise<void> {
    try {
      const logoutUrl = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/logout`;
      
      const formData = new URLSearchParams();
      formData.append('client_id', clientId || KEYCLOAK_CONFIG.CLIENT_ID);
      formData.append('refresh_token', refreshToken);
      
      if (clientSecret || KEYCLOAK_CONFIG.CLIENT_SECRET) {
        formData.append('client_secret', clientSecret || KEYCLOAK_CONFIG.CLIENT_SECRET);
      }

      const response = await fetch(logoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as TokenError;
        throw new Error(`Keycloak logout failed: ${errorData.error}${errorData.error_description ? ' - ' + errorData.error_description : ''}`);
      }
    } catch (error) {
      console.error('Error logging out from Keycloak:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to logout');
    }
  }

  /**
   * Get user info using access token
   */
  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const userInfoUrl = `${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid_connect/userinfo`;
      
      const response = await fetch(userInfoUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user info:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get user info');
    }
  }
}
