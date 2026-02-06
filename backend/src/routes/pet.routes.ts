import { Router } from 'express';
import petController from '@/controllers/pet.controller';
import { authenticate } from '@/middlewares/auth';
import { petRateLimit } from '@/middlewares/rate-limit';

const router: Router = Router();

/**
 * @route   POST /api/pet
 * @desc    Perform pet action
 * @access  Private
 */
router.post('/', authenticate, petRateLimit, petController.performPet);

/**
 * @route   GET /api/pet/history
 * @desc    Get pet history
 * @access  Private
 */
router.get('/history', authenticate, petController.getPetHistory);

export default router;
