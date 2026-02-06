import dotenv from 'dotenv';
dotenv.config();

import jackpotTimer from './jackpot-timer';
import logger from '@/config/logger';

async function startJobs() {
  logger.info('🚀 Starting background jobs...');

  // Start jackpot timer
  jackpotTimer.start();

  logger.info('✅ All background jobs started');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('⏹️  Stopping background jobs...');
  jackpotTimer.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('⏹️  Stopping background jobs...');
  jackpotTimer.stop();
  process.exit(0);
});

// Start jobs
startJobs().catch((error) => {
  logger.error('Failed to start background jobs:', error);
  process.exit(1);
});
