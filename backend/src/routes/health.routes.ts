import { Router } from 'express';
import healthController from '@/controllers/health.controller';

const router: Router = Router();

/**
 * @route   GET /health
 * @desc    Health check
 * @access  Public
 */
router.get('/', healthController.check);

export default router;
