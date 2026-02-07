import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import characterService from '@/services/character.service';
import jackpotService from '@/services/jackpot.service';
import petService from '@/services/pet.service';
import codexService from '@/services/codex.service';
import { successResponse } from '@/utils/response';
import path from 'path';
import { promises as fs } from 'fs';

export class CharacterController {
  async getActiveCharacter(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const character = await characterService.getActiveCharacter();
      const jackpot = await jackpotService.getCurrentJackpot(character.id);

      // Get asset files
      let files: Array<{ name: string; url: string }> = [];
      try {
        const publicDir = path.join(__dirname, '../../public');
        const folderPath = path.join(publicDir, character.assetFolder);
        const fileNames = await fs.readdir(folderPath);
        files = fileNames.map((fileName) => ({
          name: fileName,
          url: `/public/${character.assetFolder}/${fileName}`,
        }));
      } catch (err) {
        // If folder doesn't exist, just return empty files array
        files = [];
      }

      const responseData: any = {
        character: {
          id: character.id,
          name: character.name,
          assetFolder: character.assetFolder,
          isActive: character.isActive,
          files,
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
      return next(error);
    }
  }

  async getAllCharacters(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const characters = await characterService.getAllCharacters(includeInactive);

      const charactersWithStats = await Promise.all(
        characters.map(async (char) => {
          const stats = await characterService.getCharacterStats(char.id);

          // Get asset files
          let files: Array<{ name: string; url: string }> = [];
          try {
            const publicDir = path.join(__dirname, '../../public');
            const folderPath = path.join(publicDir, char.assetFolder);
            const fileNames = await fs.readdir(folderPath);
            files = fileNames.map((fileName) => ({
              name: fileName,
              url: `/public/${char.assetFolder}/${fileName}`,
            }));
          } catch (err) {
            files = [];
          }

          return {
            id: char.id,
            name: char.name,
            assetFolder: char.assetFolder,
            isActive: char.isActive,
            files,
            stats,
          };
        })
      );

      return successResponse(res, { characters: charactersWithStats }, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new CharacterController();
