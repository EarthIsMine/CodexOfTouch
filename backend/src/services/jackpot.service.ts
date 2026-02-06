import prisma from '@/config/database';
import { config } from '@/config/env';
import { JackpotState } from '@/types';
import { getSecondsUntil, addSeconds } from '@/utils/date';
import logger from '@/config/logger';

export class JackpotService {
  async getJackpotState(characterId: number) {
    let state = await prisma.jackpotState.findUnique({
      where: { characterId },
      include: {
        lastUser: {
          select: {
            id: true,
            walletAddress: true,
          },
        },
        character: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Initialize if not exists
    if (!state) {
      state = await prisma.jackpotState.create({
        data: {
          characterId,
          currentPool: 0,
        },
        include: {
          lastUser: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
          character: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    }

    return state;
  }

  async getCurrentJackpot(characterId: number): Promise<JackpotState> {
    const state = await this.getJackpotState(characterId);

    let timeRemaining = 0;
    let status: 'ACTIVE' | 'READY' | 'NO_ACTIVITY' = 'NO_ACTIVITY';

    if (state.lastPetAt) {
      const jackpotDeadline = addSeconds(state.lastPetAt, config.jackpotTimeout);
      timeRemaining = getSecondsUntil(jackpotDeadline);

      if (timeRemaining > 0) {
        status = 'ACTIVE';
      } else {
        status = 'READY';
      }
    }

    return {
      characterId: state.characterId,
      characterName: state.character.name,
      currentPool: state.currentPool,
      lastUserId: state.lastUserId,
      lastUserWallet: state.lastUser?.walletAddress ?? undefined,
      lastPetAt: state.lastPetAt,
      timeRemaining,
      status,
    };
  }

  async checkAndAwardJackpot(): Promise<void> {
    const now = new Date();

    // Find all jackpot states that are ready to be awarded
    const readyStates = await prisma.jackpotState.findMany({
      where: {
        lastPetAt: {
          not: null,
          lt: new Date(now.getTime() - config.jackpotTimeout * 1000),
        },
        currentPool: {
          gt: 0,
        },
      },
      include: {
        lastUser: true,
        character: true,
      },
    });

    for (const state of readyStates) {
      if (!state.lastUserId || !state.lastUser) {
        logger.warn(`Jackpot ready but no last user for character ${state.characterId}`);
        continue;
      }

      try {
        await this.awardJackpot(state.characterId, state.lastUserId, state.currentPool);
        logger.info(
          `Jackpot awarded: Character ${state.characterId}, Winner ${state.lastUserId}, Amount ${state.currentPool}`
        );
      } catch (error) {
        logger.error(`Failed to award jackpot for character ${state.characterId}:`, error);
      }
    }
  }

  async awardJackpot(characterId: number, winnerId: string, amount: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Award to user
      await tx.user.update({
        where: { id: winnerId },
        data: {
          internalBalance: {
            increment: amount,
          },
        },
      });

      // Get winner wallet for history
      const winner = await tx.user.findUnique({
        where: { id: winnerId },
        select: { walletAddress: true },
      });

      // Record in history
      await tx.jackpotHistory.create({
        data: {
          characterId,
          winnerWallet: winner?.walletAddress || 'unknown',
          amount,
          committedAt: new Date(),
        },
      });

      // Reset jackpot state
      await tx.jackpotState.update({
        where: { characterId },
        data: {
          currentPool: 0,
          lastUserId: null,
          lastPetAt: null,
        },
      });
    });

    logger.info(`Jackpot awarded successfully: ${amount} to user ${winnerId}`);
  }

  async getJackpotHistory(limit: number = 10, offset: number = 0, characterId?: number) {
    const where: any = {};
    if (characterId) {
      where.characterId = characterId;
    }

    const [history, total] = await Promise.all([
      prisma.jackpotHistory.findMany({
        where,
        include: {
          character: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { committedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.jackpotHistory.count({ where }),
    ]);

    return {
      history: history.map((h) => ({
        roundId: h.roundId,
        characterId: h.characterId,
        characterName: h.character.name,
        winnerWallet: h.winnerWallet,
        amount: h.amount,
        txHash: h.txHash,
        chainId: h.chainId,
        committedAt: h.committedAt,
      })),
      pagination: {
        total,
        limit,
        offset,
      },
    };
  }
}

export default new JackpotService();
