import petService from '@/services/pet.service';
import {
  cleanDatabase,
  cleanRedis,
  disconnectAll,
  createTestUser,
  createTestCharacter,
  prisma,
  redis,
} from '../helpers/test-utils';
import { RedisKeys } from '@/utils/redis-keys';

describe('PetService', () => {
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

  describe('performPet', () => {
    it('should successfully perform pet action', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 1.0 });

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      const result = await petService.performPet(user.id, character.id);

      expect(result.result).toBe('SUCCESS');
      expect(result.jackpot.currentPool).toBe(1);
      expect(result.rewards.balanceChange).toBe(-1);

      // Verify balance deduction
      const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updatedUser?.internalBalance).toBe(99);
    });

    it('should throw error if user has insufficient balance', async () => {
      const user = await createTestUser({ internalBalance: 0 });
      const character = await createTestCharacter({ isActive: true });

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      await expect(petService.performPet(user.id, character.id)).rejects.toThrow();
    });

    it('should throw error if character is not active', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: false });

      await expect(petService.performPet(user.id, character.id)).rejects.toThrow();
    });

    it('should set cooldown on failure', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 0.0 });

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      const result = await petService.performPet(user.id, character.id);

      expect(result.result).toBe('FAIL');
      expect(result.cooldownUntil).toBeTruthy();

      // Verify cooldown in Redis
      const cooldown = await redis.get(RedisKeys.cooldown(user.id));
      expect(cooldown).toBeTruthy();
    });

    it('should update jackpot pool correctly', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 0.0 });

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 10 },
      });

      await petService.performPet(user.id, character.id);

      const jackpotState = await prisma.jackpotState.findUnique({
        where: { characterId: character.id },
      });

      expect(jackpotState?.currentPool).toBe(11);
    });

    it('should update lastPetAt on success', async () => {
      const user = await createTestUser({ internalBalance: 100 });
      const character = await createTestCharacter({ isActive: true, successRate: 1.0 });

      await prisma.jackpotState.create({
        data: { characterId: character.id, currentPool: 0 },
      });

      await petService.performPet(user.id, character.id);

      const jackpotState = await prisma.jackpotState.findUnique({
        where: { characterId: character.id },
      });

      expect(jackpotState?.lastPetAt).toBeTruthy();
      expect(jackpotState?.lastUserId).toBe(user.id);
    });
  });

  describe('getPetHistory', () => {
    it('should return user pet history with pagination', async () => {
      const user = await createTestUser();
      const character = await createTestCharacter();

      // Create events
      await prisma.petEvent.createMany({
        data: [
          { userId: user.id, characterId: character.id, result: 'SUCCESS', balanceUsed: 1 },
          { userId: user.id, characterId: character.id, result: 'FAIL', balanceUsed: 1 },
          { userId: user.id, characterId: character.id, result: 'SUCCESS', balanceUsed: 1 },
        ],
      });

      const result = await petService.getPetHistory(user.id, 2, 0);

      expect(result.events).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.limit).toBe(2);
    });

    it('should filter by character ID', async () => {
      const user = await createTestUser();
      const char1 = await createTestCharacter({ name: 'Char 1' });
      const char2 = await createTestCharacter({ name: 'Char 2' });

      await prisma.petEvent.createMany({
        data: [
          { userId: user.id, characterId: char1.id, result: 'SUCCESS', balanceUsed: 1 },
          { userId: user.id, characterId: char2.id, result: 'SUCCESS', balanceUsed: 1 },
          { userId: user.id, characterId: char1.id, result: 'FAIL', balanceUsed: 1 },
        ],
      });

      const result = await petService.getPetHistory(user.id, 20, 0, char1.id);

      expect(result.events).toHaveLength(2);
      expect(result.events.every((e) => e.characterId === char1.id)).toBe(true);
    });
  });
});
