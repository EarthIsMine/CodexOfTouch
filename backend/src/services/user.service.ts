import prisma from '@/config/database';
import { config } from '@/config/env';
import { ErrorCode } from '@/types';
import { AppError } from '@/utils/errors';
import { isToday, getStreakDays } from '@/utils/date';
import logger from '@/config/logger';

export class UserService {
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(ErrorCode.NOT_FOUND, 'User not found', 404);
    }

    return user;
  }

  async getUserByNullifierHash(nullifierHash: string) {
    return await prisma.user.findUnique({
      where: { nullifierHash },
    });
  }

  async createUser(nullifierHash: string, walletAddress?: string) {
    // Check if user already exists
    const existing = await this.getUserByNullifierHash(nullifierHash);
    if (existing) {
      throw new AppError(ErrorCode.DUPLICATE_USER, 'User already exists', 400);
    }

    const user = await prisma.user.create({
      data: {
        nullifierHash,
        walletAddress,
        internalBalance: config.defaultCheckinReward, // Initial reward
      },
    });

    logger.info(`New user created: ${user.id}`);
    return user;
  }

  async checkIn(userId: string) {
    const user = await this.getUserById(userId);

    // Check if already checked in today
    if (user.lastCheckIn && isToday(user.lastCheckIn)) {
      throw new AppError(ErrorCode.ALREADY_CHECKED_IN, 'Already checked in today', 400);
    }

    // Calculate streak bonus
    const streak = user.lastCheckIn ? getStreakDays(user.lastCheckIn) : 0;
    const streakBonus = streak > 0 ? config.checkinStreakBonus : 0;
    const reward = config.defaultCheckinReward + streakBonus;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        lastCheckIn: new Date(),
        internalBalance: {
          increment: reward,
        },
      },
    });

    logger.info(`User ${userId} checked in. Reward: ${reward}, Streak: ${streak + 1}`);

    return {
      reward,
      streak: streak + 1,
      totalBalance: updatedUser.internalBalance,
    };
  }

  async updateBalance(userId: string, amount: number) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        internalBalance: {
          increment: amount,
        },
      },
    });
  }

  async getBalance(userId: string): Promise<number> {
    const user = await this.getUserById(userId);
    return user.internalBalance;
  }
}

export default new UserService();
