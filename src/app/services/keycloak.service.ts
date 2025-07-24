// // keycloak.service.ts
// // This file handles all direct interactions with the Keycloak Admin API.

// import fetch from 'node-fetch'; // For Node.js environment

// // --- Keycloak Configuration ---
// // Load configuration from environment variables
// const KEYCLOAK_CONFIG = {
//   BASE_URL: process.env.KEYCLOAK_BASE_URL || 'http://iam-uat.cateina.com',
//   REALM: process.env.KEYCLOAK_REALM || 'Cateina_Felix_Op',
//   CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID || 'felix-service-client',
//   CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET || '',
//   ADMIN_USERNAME: process.env.KEYCLOAK_ADMIN_USERNAME || 'admin',
//   ADMIN_PASSWORD: process.env.KEYCLOAK_ADMIN_PASSWORD || '',
// };

// /**
//  * Helper function to obtain an admin access token from Keycloak using admin credentials.
//  * This token is used to authenticate requests to the Keycloak Admin API.
//  * @returns {Promise<string>} - The Keycloak admin access token.
//  * @throws {Error} If token retrieval fails.
//  */
// export const getKeycloakAdminToken = async (): Promise<string> => {
//   try {
//     const response = await fetch(`${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//       },
//       body: new URLSearchParams({
//         grant_type: 'password', // Using password grant type for admin credentials
//         client_id: KEYCLOAK_CONFIG.CLIENT_ID, // Your service client ID
//         client_secret: KEYCLOAK_CONFIG.CLIENT_SECRET, // Your service client secret
//         username: KEYCLOAK_CONFIG.ADMIN_USERNAME,
//         password: KEYCLOAK_CONFIG.ADMIN_PASSWORD,
//       }).toString(),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       throw new Error(`Failed to get Keycloak admin token: ${response.status} - ${errorText}`);
//     }

//     const data: any = await response.json();
//     return data.access_token;
//   } catch (error: any) {
//     console.error('Error getting Keycloak admin token:', error.message);
//     throw new Error('Could not obtain Keycloak admin token.');
//   }
// };

// /**
//  * Helper function to create a user in Keycloak using the Admin API.
//  * It obtains an admin token internally before making the user creation request.
//  * @param {string} username - The username for the new Keycloak user.
//  * @param {string} email - The email for the new Keycloak user.
//  * @param {string} password - The password for the new Keycloak user.
//  * @returns {Promise<void>}
//  * @throws {Error} If user creation in Keycloak fails.
//  */
// export const createKeycloakUser = async (username: string, email: string, password: string): Promise<void> => {
//   const adminToken = await getKeycloakAdminToken(); // Get token for this operation

//   try {
//     const response = await fetch(`${KEYCLOAK_CONFIG.BASE_URL}/admin/realms/${KEYCLOAK_CONFIG.REALM}/users`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${adminToken}`,
//       },
//       body: JSON.stringify({
//         username: username,
//         email: email,
//         enabled: true, // User is enabled by default
//         credentials: [{
//           type: 'password',
//           value: password,
//           temporary: false, // Password is not temporary
//         }],
//       }),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       // Keycloak might return 409 Conflict if user already exists
//       if (response.status === 409) {
//         throw new Error(`User with username '${username}' or email '${email}' already exists in Keycloak.`);
//       }
//       throw new Error(`Failed to create user in Keycloak: ${response.status} - ${errorText}`);
//     }

//     console.log(`User '${username}' successfully created in Keycloak.`);
//   } catch (error: any) {
//     console.error('Error creating user in Keycloak:', error.message);
//     throw new Error(`Could not create user in Keycloak: ${error.message}`);
//   }
// };


// keycloak.service.ts
// This file handles all direct interactions with the Keycloak Admin API.

import fetch from 'node-fetch'; // For Node.js environment

// --- Keycloak Configuration ---
// IMPORTANT: In a production environment, these should be loaded from secure environment variables
// or a secrets management system, not hardcoded.
const KEYCLOAK_CONFIG = {
  BASE_URL: 'http://iam-uat.cateina.com',
  REALM: 'Cateina_Felix_Op',
  CLIENT_ID: 'felix-service-client', // Your service client ID
  CLIENT_SECRET: 'iUj84dYKd3q1sAzWj6YHxv1H6ruXienz', // Your service client secret
  // ADMIN_USERNAME and ADMIN_PASSWORD are no longer directly used for token acquisition
  // when using client_credentials grant type, as the client itself acts as the administrator.
  // They might still be relevant if you need to log in to the Keycloak Admin Console manually.
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD: 'KcAdmin',
};

/**
 * Helper function to obtain an admin access token from Keycloak using client credentials.
 * This token is used to authenticate requests to the Keycloak Admin API.
 * This method is suitable for service-to-service communication where the client itself
 * is authorized to perform administrative tasks.
 * @returns {Promise<string>} - The Keycloak admin access token.
 * @throws {Error} If token retrieval fails.
 */
export const getKeycloakAdminToken = async (): Promise<string> => {
  try {
    const response = await fetch(`${KEYCLOAK_CONFIG.BASE_URL}/realms/${KEYCLOAK_CONFIG.REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials', // Changed to client_credentials grant type
        client_id: KEYCLOAK_CONFIG.CLIENT_ID, // Your service client ID
        client_secret: KEYCLOAK_CONFIG.CLIENT_SECRET, // Your service client secret
        // Removed username and password as they are not used with client_credentials grant
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Keycloak admin token: ${response.status} - ${errorText}`);
    }

    const data: any = await response.json();
    return data.access_token;
  } catch (error: any) {
    console.error('Error getting Keycloak admin token:', error.message);
    throw new Error('Could not obtain Keycloak admin token. Please ensure your client is configured correctly for client_credentials grant and has necessary realm-management roles.');
  }
};

/**
 * Helper function to create a user in Keycloak using the Admin API.
 * It obtains an admin token internally before making the user creation request.
 * @param {string} username - The username for the new Keycloak user.
 * @param {string} email - The email for the new Keycloak user.
 * @param {string} firstname - The first name for the new Keycloak user.
 * @param {string} lastname - The last name for the new Keycloak user.
 * @param {string} password - The password for the new Keycloak user.
 * @returns {Promise<void>}
 * @throws {Error} If user creation in Keycloak fails.
 */
export const createKeycloakUser = async (username: string, email: string, firstname: string, lastname: string, password: string): Promise<void> => {
  const adminToken = await getKeycloakAdminToken(); // Get token for this operation

  try {
    const response = await fetch(`${KEYCLOAK_CONFIG.BASE_URL}/admin/realms/${KEYCLOAK_CONFIG.REALM}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
  body: JSON.stringify({
    username: username,
    email: email,
    firstName: firstname,
    lastName: lastname,
    enabled: true, // User is enabled by default
    credentials: [{
      type: 'password',
      value: password,
      temporary: false, // Password is not temporary
    }],
  }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Keycloak might return 409 Conflict if user already exists
      if (response.status === 409) {
        throw new Error(`User with username '${username}' or email '${email}' already exists in Keycloak.`);
      }
      throw new Error(`Failed to create user in Keycloak: ${response.status} - ${errorText}`);
    }

    console.log(`User '${username}' successfully created in Keycloak.`);
  } catch (error: any) {
    console.error('Error creating user in Keycloak:', error.message);
    throw new Error(`Could not create user in Keycloak: ${error.message}`);
  }
};
