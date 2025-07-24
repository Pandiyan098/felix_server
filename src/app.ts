import express from 'express';
import walletRoutes from './app/routes/wallet.routes';
import memoRoutes from './app/routes/memo.routes';
import authRoutes from './app/routes/auth.routs';
import services from './app/routes/service.route';
import users from './app/routes/user.route';
import bodyParser from 'body-parser';
import assetRoutes from './app/routes/asset.routes';
import assetTestRoutes from './app/routes/asset-test.routes';
import keycloakTokenRoutes from './app/routes/keycloak-token.routes';
import entityRoutes from './app/routes/entity.routes';
import dotenv from 'dotenv';
import cors from 'cors';
import { authenticateToken } from './app/middleware/auth.middleware';
import { swaggerSpec, swaggerUi, swaggerUiOptions } from './config/swagger';

// Load environment variables
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Swagger documentation (should be available without authentication)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Health check endpoint
app.get('/health', (req, res) => {
  const utcTime = new Date().toISOString();
  // Convert to IST for demonstration
  const moment = require('moment-timezone');
  const istTime = moment(utcTime).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss z');
  
  res.json({ 
    status: 'OK', 
    timestamp_utc: utcTime,
    timestamp_ist: istTime
  });
});

// Keycloak connectivity test endpoint
app.get('/test-keycloak', async (req, res) => {
  try {
    // Import the test function
    const { testKeycloakConnection } = await import('./app/middleware/auth.middleware');
    const result = await testKeycloakConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
});

// API routes JSON endpoint for Swagger
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Auth routes (login/register) - no authentication required
app.use('/api/fetch', authRoutes);

// Keycloak token routes - no authentication required (these are used to get tokens)
app.use('/api', keycloakTokenRoutes);

// Apply authentication middleware to all other API routes
// TODO: Re-enable authentication after testing
app.use('/api',authenticateToken, walletRoutes);
app.use('/api/memos',authenticateToken, memoRoutes);
app.use('/api',authenticateToken, assetRoutes);
app.use('/api',authenticateToken, assetTestRoutes); // Apply auth to test routes
app.use('/api',authenticateToken, services);
app.use('/api',authenticateToken, users);
app.use('/api',authenticateToken, entityRoutes);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
