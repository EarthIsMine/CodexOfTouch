import { Router } from 'express';
import characterController from '@/controllers/character.controller';
import { optionalAuth } from '@/middlewares/auth';

const router: Router = Router();

/**
 * @route   GET /api/characters/active
 * @desc    Get active character
 * @access  Public (more info if authenticated)
 */
router.get('/active', optionalAuth, characterController.getActiveCharacter);

/**
 * @route   GET /api/characters
 * @desc    Get all characters
 * @access  Public
 */
router.get('/', optionalAuth, characterController.getAllCharacters);

export default router;
