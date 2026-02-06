import request from 'supertest';
import app from '@/app';
import {
  cleanDatabase,
  cleanRedis,
  disconnectAll,
  createTestUser,
  generateTestToken,
} from '../helpers/test-utils';

describe('User API', () => {
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

  describe('GET /api/users/me', () => {
    it('should return current user info with valid token', async () => {
      const user = await createTestUser();
      const token = generateTestToken(user.id, user.nullifierHash);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.internalBalance).toBe(100);
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/users/me').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_003');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/users/checkin', () => {
    it('should allow user to check in and receive reward', async () => {
      const user = await createTestUser({ internalBalance: 50 });
      const token = generateTestToken(user.id, user.nullifierHash);

      const response = await request(app)
        .post('/api/users/checkin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.reward).toBeGreaterThan(0);
      expect(response.body.data.streak).toBeGreaterThanOrEqual(1);
      expect(response.body.data.totalBalance).toBeGreaterThan(50);
    });

    it('should reject check-in if already checked in today', async () => {
      const user = await createTestUser({ lastCheckIn: new Date() });
      const token = generateTestToken(user.id, user.nullifierHash);

      const response = await request(app)
        .post('/api/users/checkin')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_001');
    });

    it('should apply streak bonus for consecutive check-ins', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const user = await createTestUser({
        lastCheckIn: yesterday,
        internalBalance: 50,
      });
      const token = generateTestToken(user.id, user.nullifierHash);

      const response = await request(app)
        .post('/api/users/checkin')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.streak).toBe(2);
      // Should have bonus reward
      expect(response.body.data.reward).toBeGreaterThan(10);
    });

    it('should reject check-in without authentication', async () => {
      const response = await request(app).post('/api/users/checkin').expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
