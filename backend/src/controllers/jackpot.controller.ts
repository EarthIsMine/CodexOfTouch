import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import jackpotService from '@/services/jackpot.service';
import characterService from '@/services/character.service';
import { successResponse } from '@/utils/response';

export class JackpotController {
  async getCurrentJackpot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const activeCharacter = await characterService.getActiveCharacter();
      const jackpot = await jackpotService.getCurrentJackpot(activeCharacter.id);

      return successResponse(res, jackpot, 200);
    } catch (error) {
      next(error);
    }
  }

  async getJackpotHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;
      const characterId = req.query.characterId ? parseInt(req.query.characterId as string) : undefined;

      const result = await jackpotService.getJackpotHistory(limit, offset, characterId);

      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new JackpotController();
