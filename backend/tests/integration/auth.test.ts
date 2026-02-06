import request from 'supertest';
import app from '@/app';
import { cleanDatabase, cleanRedis, disconnectAll, prisma } from '../helpers/test-utils';
import worldIdService from '@/services/worldid.service';

// Mock World ID service
jest.mock('@/services/worldid.service');

describe('Auth API', () => {
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

  describe('POST /api/auth/worldid', () => {
    const mockProof = {
      merkle_root: '0x123',
      nullifier_hash: '0xabc',
      proof: '0xdef',
      verification_level: 'orb' as const,
    };

    it('should authenticate with valid World ID proof and create new user', async () => {
      // Mock successful World ID verification
      (worldIdService.verifyProof as jest.Mock).mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/worldid')
        .send({
          proof: mockProof,
          walletAddress: '0x1234567890123456789012345678901234567890',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.nullifierHash).toBe(mockProof.nullifier_hash);
      expect(response.body.data.user.walletAddress).toBe('0x1234567890123456789012345678901234567890');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { nullifierHash: mockProof.nullifier_hash },
      });
      expect(user).toBeTruthy();
      expect(user?.internalBalance).toBeGreaterThan(0);
    });

    it('should authenticate existing user and return token', async () => {
      // Mock successful World ID verification
      (worldIdService.verifyProof as jest.Mock).mockResolvedValue(true);

      // Create existing user
      const existingUser = await prisma.user.create({
        data: {
          nullifierHash: mockProof.nullifier_hash,
          walletAddress: '0x1234567890123456789012345678901234567890',
          internalBalance: 50,
        },
      });

      const response = await request(app)
        .post('/api/auth/worldid')
        .send({ proof: mockProof })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(existingUser.id);
      expect(response.body.data.user.internalBalance).toBe(50);
    });

    it('should reject invalid World ID proof', async () => {
      // Mock failed World ID verification
      (worldIdService.verifyProof as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/worldid')
        .send({ proof: mockProof })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_001');
    });

    it('should reject request without proof', async () => {
      const response = await request(app).post('/api/auth/worldid').send({}).expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
