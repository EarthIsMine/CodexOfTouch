import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import redis from '@/config/redis';
import { successResponse } from '@/utils/response';

export class HealthController {
  async check(_req: Request, res: Response, next: NextFunction) {
    try {
      const services: any = {};

      // Check database
      try {
        await prisma.$queryRaw`SELECT 1`;
        services.database = 'connected';
      } catch (error) {
        services.database = 'disconnected';
      }

      // Check Redis
      try {
        await redis.ping();
        services.redis = 'connected';
      } catch (error) {
        services.redis = 'disconnected';
      }

      // Check blockchain (optional)
      services.blockchain = 'not_implemented';

      const allHealthy = services.database === 'connected' && services.redis === 'connected';

      return successResponse(
        res,
        {
          status: allHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          services,
        },
        allHealthy ? 200 : 503
      );
    } catch (error) {
      return next(error);
    }
  }
}

export default new HealthController();
