import { Router } from 'express';
import jackpotController from '@/controllers/jackpot.controller';
import { optionalAuth } from '@/middlewares/auth';

const router: Router = Router();

/**
 * @route   GET /api/jackpot/current
 * @desc    Get current jackpot state
 * @access  Public
 */
router.get('/current', optionalAuth, jackpotController.getCurrentJackpot);

/**
 * @route   GET /api/jackpot/history
 * @desc    Get jackpot history
 * @access  Public
 */
router.get('/history', optionalAuth, jackpotController.getJackpotHistory);

export default router;
