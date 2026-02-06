import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import characterService from '@/services/character.service';
import jackpotService from '@/services/jackpot.service';
import petService from '@/services/pet.service';
import codexService from '@/services/codex.service';
import { successResponse } from '@/utils/response';

export class CharacterController {
  async getActiveCharacter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const character = await characterService.getActiveCharacter();
      const jackpot = await jackpotService.getCurrentJackpot(character.id);

      const responseData: any = {
        character: {
          id: character.id,
          name: character.name,
          imageUrl: character.imageUrl,
          isActive: character.isActive,
        },
        jackpot: {
          currentPool: jackpot.currentPool,
          lastPetAt: jackpot.lastPetAt,
          timeRemaining: jackpot.timeRemaining,
        },
      };

      // Add user-specific stats if authenticated
      if (req.userId) {
        const petHistory = await petService.getPetHistory(req.userId, 1000, 0, character.id);
        const codex = await codexService.getUserCodex(req.userId);
        const hasInCodex = codex.codex.some((c) => c.characterId === character.id);

        responseData.myStats = {
          hasInCodex,
          totalPets: petHistory.pagination.total,
          successCount: petHistory.events.filter((e) => e.result === 'SUCCESS').length,
        };
      }

      return successResponse(res, responseData, 200);
    } catch (error) {
      next(error);
    }
  }

  async getAllCharacters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const characters = await characterService.getAllCharacters(includeInactive);

      const charactersWithStats = await Promise.all(
        characters.map(async (char) => {
          const stats = await characterService.getCharacterStats(char.id);
          return {
            id: char.id,
            name: char.name,
            imageUrl: char.imageUrl,
            isActive: char.isActive,
            stats,
          };
        })
      );

      return successResponse(res, { characters: charactersWithStats }, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new CharacterController();
