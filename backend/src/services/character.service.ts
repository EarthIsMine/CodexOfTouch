import prisma from '@/config/database';
import redis from '@/config/redis';
import { ErrorCode } from '@/types';
import { AppError } from '@/utils/errors';
import { RedisKeys } from '@/utils/redis-keys';
import logger from '@/config/logger';
import type { Character } from '@prisma/client';

export class CharacterService {
  private readonly ACTIVE_CHARACTER_TTL = 60; // 60 seconds cache

  async getActiveCharacter(): Promise<Character> {
    // Try cache first
    const cached = await redis.get(RedisKeys.activeCharacter());
    if (cached) {
      return JSON.parse(cached) as Character;
    }

    const character = await prisma.character.findFirst({
      where: { isActive: true },
    });

    if (!character) {
      throw new AppError(ErrorCode.NO_ACTIVE_CHARACTER, 'No active character', 404);
    }

    // Cache it
    await redis.setex(RedisKeys.activeCharacter(), this.ACTIVE_CHARACTER_TTL, JSON.stringify(character));

    return character;
  }

  async getAllCharacters(includeInactive: boolean = false): Promise<Character[]> {
    const where = includeInactive ? {} : { isActive: true };

    return await prisma.character.findMany({
      where,
      orderBy: { id: 'asc' },
    });
  }

  async getCharacterById(characterId: number) {
    const character = await prisma.character.findUnique({
      where: { id: characterId },
    });

    if (!character) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Character not found', 404);
    }

    return character;
  }

  async getCharacterStats(characterId: number) {
    const [totalPets, successfulPets] = await Promise.all([
      prisma.petEvent.count({
        where: { characterId },
      }),
      prisma.petEvent.count({
        where: { characterId, result: 'SUCCESS' },
      }),
    ]);

    return {
      totalPets,
      totalSuccess: successfulPets,
      successRate: totalPets > 0 ? successfulPets / totalPets : 0,
    };
  }

  async rotateCharacter(): Promise<{ previousCharacter: Character | null; newCharacter: Character }> {
    const currentActive = await prisma.character.findFirst({
      where: { isActive: true },
    });

    // Get next character (circular rotation)
    const allCharacters = await prisma.character.findMany({
      orderBy: { id: 'asc' },
    });

    if (allCharacters.length === 0) {
      throw new AppError(ErrorCode.SERVER_ERROR, 'No characters available', 500);
    }

    let nextCharacter;
    if (!currentActive) {
      nextCharacter = allCharacters[0];
    } else {
      const currentIndex = allCharacters.findIndex((c) => c.id === currentActive.id);
      const nextIndex = (currentIndex + 1) % allCharacters.length;
      nextCharacter = allCharacters[nextIndex];
    }

    // Update characters
    await prisma.$transaction([
      // Deactivate all characters
      prisma.character.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      // Activate next character
      prisma.character.update({
        where: { id: nextCharacter.id },
        data: { isActive: true },
      }),
      // Initialize jackpot state for new character
      prisma.jackpotState.upsert({
        where: { characterId: nextCharacter.id },
        create: {
          characterId: nextCharacter.id,
          currentPool: 0,
        },
        update: {
          currentPool: 0,
          lastUserId: null,
          lastPetAt: null,
        },
      }),
    ]);

    // Clear cache
    await redis.del(RedisKeys.activeCharacter());

    logger.info(`Character rotated: ${currentActive?.name || 'none'} -> ${nextCharacter.name}`);

    return {
      previousCharacter: currentActive,
      newCharacter: nextCharacter,
    };
  }
}

export default new CharacterService();
