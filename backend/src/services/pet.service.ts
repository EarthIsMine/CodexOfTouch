import prisma from '@/config/database';
import redis from '@/config/redis';
import { config } from '@/config/env';
import { ErrorCode, PetResult } from '@/types';
import { AppError } from '@/utils/errors';
import { RedisKeys } from '@/utils/redis-keys';
import { addSeconds, getSecondsUntil } from '@/utils/date';
import userService from './user.service';
import characterService from './character.service';
import skillService from './skill.service';
import jackpotService from './jackpot.service';
import codexService from './codex.service';
import logger from '@/config/logger';

export class PetService {
  async performPet(userId: string, characterId: number, skillId?: number): Promise<PetResult> {
    // 1. Validate user balance
    const user = await userService.getUserById(userId);
    if (user.internalBalance < config.petCost) {
      throw new AppError(ErrorCode.INSUFFICIENT_BALANCE, 'Insufficient balance', 400);
    }

    // 2. Check if character is active
    const character = await characterService.getActiveCharacter();
    if (character.id !== characterId) {
      throw new AppError(ErrorCode.NO_ACTIVE_CHARACTER_PET, 'Character is not active', 400);
    }

    // 3. Check cooldown
    const cooldownKey = RedisKeys.cooldown(userId);
    const cooldown = await redis.get(cooldownKey);
    if (cooldown) {
      const cooldownUntil = new Date(parseInt(cooldown));
      throw new AppError(ErrorCode.COOLDOWN_ACTIVE, 'Cooldown active', 400, {
        cooldownUntil,
      });
    }

    // 4. Check character lock (USER_BLOCK skill)
    const lockKey = RedisKeys.characterLock(characterId);
    const isLocked = await redis.get(lockKey);
    if (isLocked) {
      throw new AppError(ErrorCode.CHARACTER_LOCKED, 'Character is locked by another user', 400);
    }

    // 5. Get active skills
    const activeSkills = await skillService.getActiveSkills(userId);
    const cooldownReduceSkill = activeSkills.find((s) => s.effectType === 'COOLDOWN_REDUCE');

    // 6. Deduct balance and add to jackpot pool
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          internalBalance: {
            decrement: config.petCost,
          },
        },
      });

      await tx.jackpotState.update({
        where: { characterId },
        data: {
          currentPool: {
            increment: config.petCost,
          },
        },
      });
    });

    // 7. Determine success
    const random = Math.random();
    const success = random < character.successRate;

    // 8. Record event
    await prisma.petEvent.create({
      data: {
        userId,
        characterId,
        result: success ? 'SUCCESS' : 'FAIL',
        balanceUsed: config.petCost,
      },
    });

    // 9. Handle result
    let codexUnlocked = false;
    const jackpotState = await jackpotService.getJackpotState(characterId);

    if (success) {
      // Success: Update jackpot state, unlock codex
      await prisma.jackpotState.update({
        where: { characterId },
        data: {
          lastUserId: userId,
          lastPetAt: new Date(),
        },
      });

      // Try to unlock codex (skip if already unlocked)
      codexUnlocked = await codexService.unlockCharacter(userId, characterId);

      logger.info(`Pet SUCCESS: User ${userId}, Character ${characterId}, Codex: ${codexUnlocked}`);
    } else {
      // Fail: Set cooldown
      let cooldownDuration = config.cooldownDuration;

      // Apply cooldown reduction skill
      if (cooldownReduceSkill) {
        cooldownDuration = Math.max(0, cooldownDuration - cooldownReduceSkill.value);
        logger.info(`Cooldown reduced by ${cooldownReduceSkill.value}s for user ${userId}`);
      }

      if (cooldownDuration > 0) {
        const cooldownUntil = addSeconds(new Date(), cooldownDuration);
        await redis.setex(cooldownKey, cooldownDuration, cooldownUntil.getTime().toString());
      }

      logger.info(`Pet FAIL: User ${userId}, Character ${characterId}, Cooldown: ${cooldownDuration}s`);
    }

    // 10. Build response
    const updatedJackpot = await jackpotService.getJackpotState(characterId);
    const timeRemaining = updatedJackpot.lastPetAt
      ? config.jackpotTimeout - getSecondsUntil(addSeconds(updatedJackpot.lastPetAt, config.jackpotTimeout))
      : 0;

    const result: PetResult = {
      result: success ? 'SUCCESS' : 'FAIL',
      jackpot: {
        currentPool: updatedJackpot.currentPool,
        timeRemaining: success ? timeRemaining : undefined,
      },
      rewards: {
        balanceChange: -config.petCost,
      },
    };

    if (success) {
      result.codexUnlocked = codexUnlocked;
    } else {
      const cooldownUntil = await redis.get(cooldownKey);
      if (cooldownUntil) {
        result.cooldownUntil = new Date(parseInt(cooldownUntil));
      }
    }

    return result;
  }

  async getPetHistory(userId: string, limit: number = 20, offset: number = 0, characterId?: number) {
    const where: { userId: string; characterId?: number } = { userId };
    if (characterId) {
      where.characterId = characterId;
    }

    const [events, total] = await Promise.all([
      prisma.petEvent.findMany({
        where,
        include: {
          character: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.petEvent.count({ where }),
    ]);

    return {
      events: events.map((e) => ({
        id: e.id,
        characterId: e.characterId,
        characterName: e.character.name,
        result: e.result,
        balanceUsed: e.balanceUsed,
        createdAt: e.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }
}

export default new PetService();
