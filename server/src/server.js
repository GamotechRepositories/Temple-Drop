import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import profileRoutes from './routes/profile.js';
import healthRoutes from './routes/health.js';
import csrfRoutes from './routes/csrf.js';
import { csrfCookieMiddleware } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

export function createServer() {
  const app = express();

  const allowedOrigins = [
    process.env.CORS_ORIGIN || 'http://localhost:5173',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(cookieParser());

  app.use(csrfCookieMiddleware);

  app.use('/api/health', healthRoutes);
  app.use('/api/csrf-token', csrfRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/game', gameRoutes);
  app.use('/api/profile', profileRoutes);

  app.use(errorHandler);

  return app;
}
