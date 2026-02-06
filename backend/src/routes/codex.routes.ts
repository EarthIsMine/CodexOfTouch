import { Router } from 'express';
import codexController from '@/controllers/codex.controller';
import { authenticate, optionalAuth } from '@/middlewares/auth';

const router: Router = Router();

/**
 * @route   GET /api/codex/me
 * @desc    Get my codex
 * @access  Private
 */
router.get('/me', authenticate, codexController.getMyCodex);

/**
 * @route   GET /api/codex/character/:characterId
 * @desc    Get character codex stats
 * @access  Public
 */
router.get('/character/:characterId', optionalAuth, codexController.getCharacterCodex);

export default router;
