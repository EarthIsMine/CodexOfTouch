import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { generalRateLimit } from './middlewares/rate-limit';
import logger from './config/logger';

const app: Application = express();

// Serve static files from public directory first.
// This avoids Helmet frame/csp headers from blocking iframe-based character viewers.
app.use(
  '/public',
  express.static(path.join(__dirname, '../public'), {
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    },
  })
);

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(
  morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Rate limiting
app.use('/api', generalRateLimit);

// Health check (outside /api)
app.get('/health', routes);

// API routes
app.use('/api', routes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
