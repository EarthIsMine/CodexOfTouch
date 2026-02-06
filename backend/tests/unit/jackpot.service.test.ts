import jackpotService from '@/services/jackpot.service';
import {
  cleanDatabase,
  cleanRedis,
  disconnectAll,
  createTestUser,
  createTestCharacter,
  prisma,
} from '../helpers/test-utils';

describe('JackpotService', () => {
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
  });

  describe('getJackpotState', () => {
    it('should return existing jackpot state', async () => {
      const character = await createTestCharacter();
      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 100,
        },
      });

      const state = await jackpotService.getJackpotState(character.id);

      expect(state.characterId).toBe(character.id);
      expect(state.currentPool).toBe(100);
    });

    it('should create jackpot state if not exists', async () => {
      const character = await createTestCharacter();

      const state = await jackpotService.getJackpotState(character.id);

      expect(state.characterId).toBe(character.id);
      expect(state.currentPool).toBe(0);
    });
  });

  describe('getCurrentJackpot', () => {
    it('should return jackpot with NO_ACTIVITY status if no pets yet', async () => {
      const character = await createTestCharacter();
      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 50,
        },
      });

      const jackpot = await jackpotService.getCurrentJackpot(character.id);

      expect(jackpot.status).toBe('NO_ACTIVITY');
      expect(jackpot.currentPool).toBe(50);
      expect(jackpot.timeRemaining).toBe(0);
    });

    it('should return jackpot with ACTIVE status if recently petted', async () => {
      const user = await createTestUser();
      const character = await createTestCharacter();
      const recentTime = new Date();

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 75,
          lastUserId: user.id,
          lastPetAt: recentTime,
        },
      });

      const jackpot = await jackpotService.getCurrentJackpot(character.id);

      expect(jackpot.status).toBe('ACTIVE');
      expect(jackpot.currentPool).toBe(75);
      expect(jackpot.lastUserId).toBe(user.id);
      expect(jackpot.timeRemaining).toBeGreaterThan(0);
    });

    it('should return jackpot with READY status if timeout exceeded', async () => {
      const user = await createTestUser();
      const character = await createTestCharacter();
      const oldTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 100,
          lastUserId: user.id,
          lastPetAt: oldTime,
        },
      });

      const jackpot = await jackpotService.getCurrentJackpot(character.id);

      expect(jackpot.status).toBe('READY');
      expect(jackpot.timeRemaining).toBe(0);
    });
  });

  describe('awardJackpot', () => {
    it('should award jackpot to winner and reset state', async () => {
      const winner = await createTestUser({ internalBalance: 50 });
      const character = await createTestCharacter();

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 200,
          lastUserId: winner.id,
          lastPetAt: new Date(),
        },
      });

      await jackpotService.awardJackpot(character.id, winner.id, 200);

      // Check user balance increased
      const updatedUser = await prisma.user.findUnique({ where: { id: winner.id } });
      expect(updatedUser?.internalBalance).toBe(250);

      // Check jackpot state reset
      const jackpotState = await prisma.jackpotState.findUnique({
        where: { characterId: character.id },
      });
      expect(jackpotState?.currentPool).toBe(0);
      expect(jackpotState?.lastUserId).toBeNull();
      expect(jackpotState?.lastPetAt).toBeNull();

      // Check history recorded
      const history = await prisma.jackpotHistory.findFirst({
        where: { characterId: character.id },
      });
      expect(history).toBeTruthy();
      expect(history?.amount).toBe(200);
    });
  });

  describe('checkAndAwardJackpot', () => {
    it('should award jackpot if timeout exceeded', async () => {
      const winner = await createTestUser({ internalBalance: 50 });
      const character = await createTestCharacter();
      const oldTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 150,
          lastUserId: winner.id,
          lastPetAt: oldTime,
        },
      });

      await jackpotService.checkAndAwardJackpot();

      // Check winner balance
      const updatedUser = await prisma.user.findUnique({ where: { id: winner.id } });
      expect(updatedUser?.internalBalance).toBe(200);

      // Check state reset
      const jackpotState = await prisma.jackpotState.findUnique({
        where: { characterId: character.id },
      });
      expect(jackpotState?.currentPool).toBe(0);
    });

    it('should not award jackpot if timeout not exceeded', async () => {
      const winner = await createTestUser({ internalBalance: 50 });
      const character = await createTestCharacter();
      const recentTime = new Date(); // Just now

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 150,
          lastUserId: winner.id,
          lastPetAt: recentTime,
        },
      });

      await jackpotService.checkAndAwardJackpot();

      // Balance should not change
      const updatedUser = await prisma.user.findUnique({ where: { id: winner.id } });
      expect(updatedUser?.internalBalance).toBe(50);

      // Pool should remain
      const jackpotState = await prisma.jackpotState.findUnique({
        where: { characterId: character.id },
      });
      expect(jackpotState?.currentPool).toBe(150);
    });

    it('should not award if pool is empty', async () => {
      const winner = await createTestUser({ internalBalance: 50 });
      const character = await createTestCharacter();
      const oldTime = new Date(Date.now() - 10 * 60 * 1000);

      await prisma.jackpotState.create({
        data: {
          characterId: character.id,
          currentPool: 0, // Empty pool
          lastUserId: winner.id,
          lastPetAt: oldTime,
        },
      });

      await jackpotService.checkAndAwardJackpot();

      // Balance should not change
      const updatedUser = await prisma.user.findUnique({ where: { id: winner.id } });
      expect(updatedUser?.internalBalance).toBe(50);
    });
  });

  describe('getJackpotHistory', () => {
    it('should return jackpot history with pagination', async () => {
      const character = await createTestCharacter();

      // Create history entries
      await prisma.jackpotHistory.createMany({
        data: [
          { characterId: character.id, winnerWallet: '0x123', amount: 100, committedAt: new Date() },
          { characterId: character.id, winnerWallet: '0x456', amount: 200, committedAt: new Date() },
          { characterId: character.id, winnerWallet: '0x789', amount: 150, committedAt: new Date() },
        ],
      });

      const result = await jackpotService.getJackpotHistory(2, 0);

      expect(result.history).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
    });

    it('should filter by character ID', async () => {
      const char1 = await createTestCharacter({ name: 'Char 1' });
      const char2 = await createTestCharacter({ name: 'Char 2' });

      await prisma.jackpotHistory.createMany({
        data: [
          { characterId: char1.id, winnerWallet: '0x123', amount: 100, committedAt: new Date() },
          { characterId: char2.id, winnerWallet: '0x456', amount: 200, committedAt: new Date() },
        ],
      });

      const result = await jackpotService.getJackpotHistory(10, 0, char1.id);

      expect(result.history).toHaveLength(1);
      expect(result.history[0].characterId).toBe(char1.id);
    });
  });
});
