import express from 'express';
import walletRoutes from './app/routes/wallet.routes';
import memoRoutes from './app/routes/memo.routes';
import authRoutes from './app/routes/auth.routs';
import services from './app/routes/service.route';
import users from './app/routes/user.route';
import bodyParser from 'body-parser';
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
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes JSON endpoint for Swagger
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.use('/api/fetch', authRoutes);
app.use('/api', walletRoutes);
app.use('/api/memos', memoRoutes);
app.use('/api', services)

app.use('/api',users);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
