import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import codexService from '@/services/codex.service';
import characterService from '@/services/character.service';
import { successResponse } from '@/utils/response';

export class CodexController {
  async getMyCodex(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const result = await codexService.getUserCodex(userId);

      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getCharacterCodex(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const characterId = parseInt(req.params.characterId);

      const character = await characterService.getCharacterById(characterId);
      const stats = await codexService.getCharacterCodexStats(characterId);

      return successResponse(
        res,
        {
          characterId,
          characterName: character.name,
          ...stats,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new CodexController();
