import { Router } from 'express';
import assetsController from '@/controllers/assets.controller';

const router: Router = Router();

/**
 * @route   GET /api/assets/:assetFolder
 * @desc    Get all files in an asset folder
 * @access  Public
 */
router.get('/:assetFolder', assetsController.getAssetFiles);

export default router;
