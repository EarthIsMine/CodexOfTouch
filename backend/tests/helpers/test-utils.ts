import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { generateToken } from '@/utils/jwt';

export const prisma = new PrismaClient();
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

/**
 * Clean up database before/after tests
 */
export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.skillPurchase.deleteMany(),
    prisma.skillUsage.deleteMany(),
    prisma.userSkill.deleteMany(),
    prisma.jackpotHistory.deleteMany(),
    prisma.codex.deleteMany(),
    prisma.petEvent.deleteMany(),
    prisma.jackpotState.deleteMany(),
    prisma.skill.deleteMany(),
    prisma.character.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

/**
 * Clean up Redis
 */
export async function cleanRedis() {
  await redis.flushdb();
}

/**
 * Create test user
 */
export async function createTestUser(data?: {
  nullifierHash?: string;
  walletAddress?: string;
  internalBalance?: number;
  lastCheckIn?: Date;
}) {
  return await prisma.user.create({
    data: {
      nullifierHash: data?.nullifierHash || `test-nullifier-${Date.now()}`,
      walletAddress: data?.walletAddress || `0x${Math.random().toString(16).substring(2, 42)}`,
      internalBalance: data?.internalBalance ?? 100,
      lastCheckIn: data?.lastCheckIn,
    },
  });
}

/**
 * Create test character
 */
export async function createTestCharacter(data?: {
  name?: string;
  assetFolder?: string;
  isActive?: boolean;
  successRate?: number;
}) {
  return await prisma.character.create({
    data: {
      name: data?.name || 'Test Character',
      assetFolder: data?.assetFolder || 'https://example.com/test.png',
      isActive: data?.isActive ?? false,
      successRate: data?.successRate ?? 0.5,
    },
  });
}

/**
 * Create test skill
 */
export async function createTestSkill(data?: {
  name?: string;
  effectType?: 'COOLDOWN_REDUCE' | 'CHECKIN_BONUS' | 'USER_BLOCK';
  value?: number;
  durationSec?: number;
  priceWld?: number;
}) {
  return await prisma.skill.create({
    data: {
      name: data?.name || 'Test Skill',
      description: 'Test skill description',
      effectType: data?.effectType || 'COOLDOWN_REDUCE',
      value: data?.value ?? 10,
      durationSec: data?.durationSec ?? 3600,
      priceWld: data?.priceWld ?? 5,
      isActive: true,
    },
  });
}

/**
 * Generate test JWT token
 */
export function generateTestToken(userId: string, nullifierHash: string) {
  return generateToken({ userId, nullifierHash });
}

/**
 * Setup test database with initial data
 */
export async function setupTestData() {
  const user = await createTestUser();
  const character = await createTestCharacter({ isActive: true });
  const skill = await createTestSkill();

  // Initialize jackpot state
  await prisma.jackpotState.create({
    data: {
      characterId: character.id,
      currentPool: 0,
    },
  });

  return { user, character, skill };
}

/**
 * Disconnect from database and Redis
 */
export async function disconnectAll() {
  await prisma.$disconnect();
  await redis.quit();
}
