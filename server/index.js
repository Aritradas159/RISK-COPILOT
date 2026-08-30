import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import simulationRoutes from './routes/simulations.js';
import learningRoutes from './routes/learning.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();

// Security & middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());

// Rate limiting for authentication endpoints
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'risk-copilot-api',
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/learning', learningRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Server startup
async function start() {
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET is missing.');
  }

  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'dev-only-change-me-before-production';
  }

  // MongoDB is optional in demo mode
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } else {
    console.warn('MONGO_URI not set. Running in DEMO MODE.');
  }

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Risk Copilot API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start Risk Copilot API:', err);
  process.exit(1);
});

export default app;
