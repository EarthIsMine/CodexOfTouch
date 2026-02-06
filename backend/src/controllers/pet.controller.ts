import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import petService from '@/services/pet.service';
import { successResponse } from '@/utils/response';

export class PetController {
  async performPet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { characterId, skillId } = req.body;

      const result = await petService.performPet(userId, characterId, skillId);

      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  async getPetHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const characterId = req.query.characterId ? parseInt(req.query.characterId as string) : undefined;

      const result = await petService.getPetHistory(userId, limit, offset, characterId);

      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new PetController();
