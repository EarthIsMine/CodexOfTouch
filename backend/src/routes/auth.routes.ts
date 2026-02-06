import { Router } from 'express';
import authController from '@/controllers/auth.controller';

const router: Router = Router();

/**
 * @route   POST /api/auth/worldid
 * @desc    Authenticate with World ID
 * @access  Public
 */
router.post('/worldid', authController.worldIdAuth);

export default router;
