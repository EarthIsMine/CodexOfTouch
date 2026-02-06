import cron from 'node-cron';
import jackpotService from '@/services/jackpot.service';
import logger from '@/config/logger';

export class JackpotTimer {
  private task: cron.ScheduledTask | null = null;

  start() {
    // Run every 10 seconds
    this.task = cron.schedule('*/10 * * * * *', async () => {
      try {
        await jackpotService.checkAndAwardJackpot();
      } catch (error: any) {
        logger.error('Jackpot timer error:', error);
      }
    });

    logger.info('✅ Jackpot timer started (runs every 10 seconds)');
  }

  stop() {
    if (this.task) {
      this.task.stop();
      logger.info('⏹️  Jackpot timer stopped');
    }
  }
}

export default new JackpotTimer();
