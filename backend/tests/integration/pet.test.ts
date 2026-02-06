import request from 'supertest';
import app from '@/app';
import {
  cleanDatabase,
  cleanRedis,
  disconnectAll,
  createTestUser,
  createTestCharacter,
  generateTestToken,
  prisma,
  redis,
} from '../helpers/test-utils';
import { RedisKeys } from '@/utils/redis-keys';

describe('Pet API', () => {
  beforeAll(async () => {
    await cleanDatabase();
    await cleanRedis();
  });

  afterAll(async () => {
    await cleanDatabase();
    await cleanRedis();
    await disconnectAll();
  });

  beforeEach(async () => {
    await cleanDatabase();
    await cleanRedis();
  });

  describe('POST /api/pet', () => {
    it('should allow user to pet active character with sufficient balance', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 1.0 }); // 100% success for testing
      const token = generateTestToken(user.id, user.nullifierHash);

      // Initialize jackpot state
      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 0,
        },
      });

      const response = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBe('SUCCESS');
      expect(response.body.data.jackpot.currentPool).toBe(1);

      // Verify balance was deducted
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.internalBalance).toBe(99);

      // Verify event was recorded
      const event = await prisma.petEvent.findFirst({
        where: { userId: user.id, characterId: character.id },
      });
      expect(event).toBeTruthy();
      expect(event?.result).toBe('SUCCESS');
    });

    it('should fail if character is not active', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: false });
      const token = generateTestToken(user.id, user.nullifierHash);

      const response = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PET_003');
    });

    it('should fail if user has insufficient balance', async () => {
      const user = await createTestUser({ internalBalance: 0 });
      const character = await createTestCharacter({ isActive: true });
      const token = generateTestToken(user.id, user.nullifierHash);

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      const response = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PET_001');
    });

    it('should apply cooldown on failure', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 0.0 }); // 0% success
      const token = generateTestToken(user.id, user.nullifierHash);

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      const response = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBe('FAIL');
      expect(response.body.data.cooldownUntil).toBeTruthy();

      // Verify cooldown in Redis
      const cooldown = await redis.get(RedisKeys.cooldown(user.id));
      expect(cooldown).toBeTruthy();

      // Try to pet again immediately - should fail
      const response2 = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(400);

      expect(response2.body.error.code).toBe('PET_002');
    });

    it('should unlock codex on first success', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 1.0 });
      const token = generateTestToken(user.id, user.nullifierHash);

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      const response = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(200);

      expect(response.body.data.codexUnlocked).toBe(true);

      // Verify codex entry
      const codex = await prisma.codex.findUnique({
        where: {
          userId_characterId: {
            userId: user.id,
            characterId: character.id,
          },
        },
      });
      expect(codex).toBeTruthy();
    });

    it('should not unlock codex again if already unlocked', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 1.0 });
      const token = generateTestToken(user.id, user.nullifierHash);

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      // First success - should unlock
      await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(200);

      // Second success - should not unlock again
      const response2 = await request(app)
        .post('/api/pet')
        .set('Authorization', `Bearer ${token}`)
        .send({ characterId: character.id })
        .expect(200);

      expect(response2.body.data.codexUnlocked).toBe(false);
    });
  });

  describe('GET /api/pet/history', () => {
    it('should return user pet history', async () => {
      const user = await createTestUser();
      const character = await createTestCharacter();
      const token = generateTestToken(user.id, user.nullifierHash);

      // Create some pet events
      await prisma.petEvent.createMany({
        data: [
          { userId: user.id, characterId: character.id, result: 'SUCCESS', balanceUsed: 1 },
          { userId: user.id, characterId: character.id, result: 'FAIL', balanceUsed: 1 },
        ],
      });

      const response = await request(app)
        .get('/api/pet/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.events).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });

    it('should support pagination', async () => {
      const user = await createTestUser();
      const character = await createTestCharacter();
      const token = generateTestToken(user.id, user.nullifierHash);

      // Create many events
      const events = Array(25)
        .fill(null)
        .map(() => ({
          userId: user.id,
          characterId: character.id,
          result: 'SUCCESS' as const,
          balanceUsed: 1,
        }));
      await prisma.petEvent.createMany({ data: events });

      const response = await request(app)
        .get('/api/pet/history?limit=10&offset=0')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data.events).toHaveLength(10);
      expect(response.body.data.pagination.total).toBe(25);
    });
  });
});
