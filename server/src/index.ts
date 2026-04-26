import 'dotenv/config';
import express, { Express, Request, Response } from 'express';
import { AddressInfo } from 'net';
import cookieParser from 'cookie-parser';
import {
  corsMiddleware,
  sanitizeInputMiddleware,
  errorHandler,
} from './middleware';
import authRoutes from './routes/auth';
import titlesRoutes from './routes/titles';
import reviewsRoutes from './routes/reviews';
import watchlistRoutes from './routes/watchlist';
import favoritesRoutes from './routes/favorites';
import adminRoutes from './routes/admin';

const validateEnvironment = () => {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET', 'ADMIN_SETUP_KEY', 'CORS_ORIGIN'];
  const missingVars = requiredVars.filter((key) => !process.env[key] || !process.env[key]?.trim());

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  if ((process.env.JWT_SECRET as string).trim().length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }

  if ((process.env.ADMIN_SETUP_KEY as string).trim().length < 32) {
    throw new Error('ADMIN_SETUP_KEY must be at least 32 characters.');
  }
};

validateEnvironment();

const app: Express = express();
const PORT = process.env.PORT || 5000;

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(corsMiddleware);
app.use(sanitizeInputMiddleware);

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/titles', titlesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  const address = server.address() as AddressInfo | null;
  const activePort = address?.port || PORT;
  process.stdout.write(`✅ Server running on http://localhost:${activePort}\n`);
  process.stdout.write(`📊 Health check: http://localhost:${activePort}/api/health\n`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    process.stderr.write(`❌ Port ${PORT} is already in use. Set a different PORT and retry.\n`);
    process.exit(1);
  }

  process.stderr.write(`❌ Server failed to start: ${error.message}\n`);
  process.exit(1);
});

export default app;
