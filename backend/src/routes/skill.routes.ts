import { Router } from 'express';
import skillController from '@/controllers/skill.controller';
import { authenticate, optionalAuth } from '@/middlewares/auth';
import { skillRateLimit } from '@/middlewares/rate-limit';

const router: Router = Router();

/**
 * @route   GET /api/skills
 * @desc    Get all skills
 * @access  Public
 */
router.get('/', optionalAuth, skillController.getAllSkills);

/**
 * @route   GET /api/skills/my
 * @desc    Get my skills
 * @access  Private
 */
router.get('/my', authenticate, skillController.getMySkills);

/**
 * @route   POST /api/skills/:skillId/purchase
 * @desc    Purchase a skill
 * @access  Private
 */
router.post('/:skillId/purchase', authenticate, skillController.purchaseSkill);

/**
 * @route   POST /api/skills/:skillId/use
 * @desc    Use a skill
 * @access  Private
 */
router.post('/:skillId/use', authenticate, skillRateLimit, skillController.useSkill);

export default router;
