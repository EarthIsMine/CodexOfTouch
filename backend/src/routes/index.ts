import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import characterRoutes from './character.routes';
import petRoutes from './pet.routes';
import codexRoutes from './codex.routes';
import jackpotRoutes from './jackpot.routes';
import skillRoutes from './skill.routes';
import healthRoutes from './health.routes';
import assetsRoutes from './assets.routes';

const router: Router = Router();

// API Root - Show available endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Petting Roulette Game API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        health: 'GET /api/health',
        auth: 'POST /api/auth',
        characters: 'GET /api/characters',
        user: 'GET /api/user (auth)',
        pet: 'POST /api/pet (auth)',
        codex: 'GET /api/codex (auth)',
        jackpot: 'GET /api/jackpot/:characterId',
        skills: 'GET /api/skills',
      },
      docs: 'See API_SPEC.md',
    },
  });
});

// Health check
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/characters', characterRoutes);
router.use('/pet', petRoutes);
router.use('/codex', codexRoutes);
router.use('/jackpot', jackpotRoutes);
router.use('/skills', skillRoutes);
router.use('/assets', assetsRoutes);

export default router;
