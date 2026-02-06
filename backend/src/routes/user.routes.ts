import { Router } from 'express';
import userController from '@/controllers/user.controller';
import { authenticate } from '@/middlewares/auth';

const router: Router = Router();

/**
 * @route   GET /api/users/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, userController.getMe);

/**
 * @route   POST /api/users/checkin
 * @desc    Daily check-in
 * @access  Private
 */
router.post('/checkin', authenticate, userController.checkIn);

export default router;
