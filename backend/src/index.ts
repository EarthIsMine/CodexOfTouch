import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { config } from './config/env';
import logger from './config/logger';
import prisma from './config/database';
import redis from './config/redis';
import jackpotTimer from './jobs/jackpot-timer';
import {
  closeJackpotWebSockets,
  handleJackpotWebSocketUpgrade,
} from './realtime/jackpot-ws';

const PORT = config.port;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('✅ Redis connected');

    // Start background jobs
    jackpotTimer.start();

    // Start HTTP + WebSocket server
    const server = createServer(app);
    server.on('upgrade', (req, socket) => {
      const handled = handleJackpotWebSocketUpgrade(req, socket);
      if (!handled) {
        socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
        socket.destroy();
      }
    });

    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌍 Health check: http://localhost:${PORT}/health`);
      logger.info(`📡 API base URL: http://localhost:${PORT}/api`);
      logger.info(`🔌 WS jackpot URL: ws://localhost:${PORT}/ws/jackpot`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      // Stop accepting new requests
      server.close(async () => {
        logger.info('✅ HTTP server closed');

        // Stop background jobs
        jackpotTimer.stop();
        closeJackpotWebSockets();

        // Close database connections
        await prisma.$disconnect();
        logger.info('✅ Database disconnected');

        await redis.quit();
        logger.info('✅ Redis disconnected');

        logger.info('👋 Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('⚠️  Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
