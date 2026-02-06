import prisma from '@/config/database';
import redis from '@/config/redis';
import { ErrorCode, ActiveSkill } from '@/types';
import { AppError } from '@/utils/errors';
import { RedisKeys } from '@/utils/redis-keys';
import { addSeconds } from '@/utils/date';
import logger from '@/config/logger';
import worldPaymentService from './world-payment.service';

export class SkillService {
  async getAllSkills() {
    return await prisma.skill.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });
  }

  async getSkillById(skillId: number) {
    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
    });

    if (!skill) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Skill not found', 404);
    }

    return skill;
  }

  async getUserSkills(userId: string) {
    const now = new Date();

    const userSkills = await prisma.userSkill.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        skill: true,
      },
      orderBy: { acquiredAt: 'desc' },
    });

    // Check Redis for activation status
    const skillsWithActivation = await Promise.all(
      userSkills.map(async (us) => {
        const activeKey = RedisKeys.skillActive(userId, us.skillId);
        const isActiveInRedis = await redis.get(activeKey);
        const ttl = await redis.ttl(activeKey);

        return {
          skillId: us.skillId,
          name: us.skill.name,
          description: us.skill.description,
          effectType: us.skill.effectType,
          value: us.skill.value,
          acquiredAt: us.acquiredAt,
          expiresAt: us.expiresAt,
          isOwned: !us.expiresAt || us.expiresAt > now,
          ownershipRemainingTime: us.expiresAt
            ? Math.max(0, Math.floor((us.expiresAt.getTime() - now.getTime()) / 1000))
            : null,
          // Activation info (Redis-based)
          isActivated: isActiveInRedis === '1' && ttl > 0,
          activatedAt: isActiveInRedis === '1' && ttl > 0 ? new Date(now.getTime() - (us.skill.durationSec - ttl) * 1000) : null,
          activatedUntil: isActiveInRedis === '1' && ttl > 0 ? addSeconds(now, ttl) : null,
          activationRemainingTime: isActiveInRedis === '1' && ttl > 0 ? ttl : null,
        };
      })
    );

    return skillsWithActivation;
  }

  async purchaseSkill(
    userId: string,
    skillId: number,
    transactionId: string,
    paymentReference: string
  ) {
    const skill = await this.getSkillById(skillId);

    // Verify World payment via Developer Portal API
    const isValidPayment = await worldPaymentService.verifyPayment(
      transactionId,
      paymentReference,
      skill.priceWld
    );

    if (!isValidPayment) {
      throw new AppError(ErrorCode.INVALID_TX_HASH, 'Invalid or insufficient payment', 400);
    }

    // Get transaction hash for record keeping
    let txHash = transactionId; // Fallback to transactionId
    try {
      const txStatus = await worldPaymentService.getTransactionStatus(transactionId);
      if (txStatus.transaction_hash) {
        txHash = txStatus.transaction_hash;
      }
    } catch (error) {
      logger.warn('Could not fetch transaction hash', { error, transactionId });
    }

    // Record purchase
    await prisma.skillPurchase.create({
      data: {
        userId,
        skillId,
        paidWld: skill.priceWld,
        txHash,
      },
    });

    // Add to user skills
    const expiresAt = skill.durationSec > 0 ? addSeconds(new Date(), skill.durationSec) : null;

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      create: {
        userId,
        skillId,
        expiresAt,
      },
      update: {
        expiresAt,
      },
    });

    logger.info(`Skill purchased: User ${userId}, Skill ${skillId}, TxId ${transactionId}`);

    // Auto-activate certain skill types immediately after purchase
    let activationResult = null;
    const autoActivateTypes = ['COOLDOWN_REDUCE', 'PET_REWARD_BONUS', 'SUCCESS_RATE_BOOST'];

    if (autoActivateTypes.includes(skill.effectType)) {
      try {
        activationResult = await this.useSkill(userId, skillId);
        logger.info(`Skill auto-activated: User ${userId}, Skill ${skillId}`);
      } catch (error) {
        logger.warn('Failed to auto-activate skill', { error, userId, skillId });
        // Don't fail the purchase if activation fails
      }
    }

    return {
      userSkill,
      autoActivated: activationResult !== null,
      activation: activationResult,
    };
  }

  async useSkill(userId: string, skillId: number) {
    // Check if user owns the skill
    const userSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId,
          skillId,
        },
      },
      include: {
        skill: true,
      },
    });

    if (!userSkill) {
      throw new AppError(ErrorCode.SKILL_NOT_OWNED, 'Skill not owned', 400);
    }

    // Check if expired
    if (userSkill.expiresAt && userSkill.expiresAt < new Date()) {
      throw new AppError(ErrorCode.SKILL_EXPIRED, 'Skill expired', 400);
    }

    const skill = userSkill.skill;

    // Check if already active (for non-instant skills)
    if (skill.effectType !== 'CHECKIN_BONUS') {
      const activeKey = RedisKeys.skillActive(userId, skillId);
      const isActive = await redis.get(activeKey);

      if (isActive) {
        throw new AppError(ErrorCode.SKILL_ALREADY_ACTIVE, 'Skill already active', 400);
      }

      // Set active
      await redis.setex(activeKey, skill.durationSec, '1');
    }

    // Record usage
    await prisma.skillUsage.create({
      data: {
        userId,
        skillId,
      },
    });

    // Special handling for USER_BLOCK skill
    if (skill.effectType === 'USER_BLOCK') {
      const activeCharacter = await prisma.character.findFirst({
        where: { isActive: true },
      });

      if (activeCharacter) {
        const lockKey = RedisKeys.characterLock(activeCharacter.id);
        await redis.setex(lockKey, skill.value, userId);
        logger.info(`Character ${activeCharacter.id} locked by user ${userId} for ${skill.value}s`);
      }
    }

    logger.info(`Skill used: User ${userId}, Skill ${skillId}`);

    return {
      activated: true,
      expiresAt: addSeconds(new Date(), skill.durationSec),
      effect: {
        type: skill.effectType,
        value: skill.value,
      },
    };
  }

  async getActiveSkills(userId: string): Promise<ActiveSkill[]> {
    const userSkills = await this.getUserSkills(userId);
    const activeSkills: ActiveSkill[] = [];

    for (const userSkill of userSkills) {
      if (!userSkill.isOwned) continue;

      // Check Redis for active status
      const activeKey = RedisKeys.skillActive(userId, userSkill.skillId);
      const isActive = await redis.get(activeKey);
      const ttl = await redis.ttl(activeKey);

      if (isActive && ttl > 0) {
        activeSkills.push({
          skillId: userSkill.skillId,
          effectType: userSkill.effectType,
          value: userSkill.value,
          expiresAt: addSeconds(new Date(), ttl),
        });
      }
    }

    return activeSkills;
  }
}

export default new SkillService();
