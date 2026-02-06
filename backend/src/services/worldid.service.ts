import axios from 'axios';
import { config } from '@/config/env';
import { WorldIDProof, WorldIDVerifyResponse } from '@/types';
import logger from '@/config/logger';

export class WorldIDService {
  private readonly verifyUrl = 'https://developer.worldcoin.org/api/v1/verify';

  async verifyProof(proof: WorldIDProof): Promise<boolean> {
    // 개발 환경: 테스트용 nullifier_hash 허용
    if (config.nodeEnv === 'development') {
      const testNullifierHashes = [
        'test_user_1',
        'test_user_2',
        'test_user_3',
        '0x5678...',
      ];

      if (testNullifierHashes.includes(proof.nullifier_hash)) {
        logger.info(`Development mode: bypassing World ID verification for ${proof.nullifier_hash}`);
        return true;
      }
    }

    try {
      const response = await axios.post<WorldIDVerifyResponse>(
        `${this.verifyUrl}/${config.worldcoinAppId}`,
        {
          nullifier_hash: proof.nullifier_hash,
          merkle_root: proof.merkle_root,
          proof: proof.proof,
          verification_level: proof.verification_level,
          action: config.worldcoinAction,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('World ID verification response:', response.data);

      return response.data.success;
    } catch (error: any) {
      logger.error('World ID verification error:', {
        error: error.message,
        response: error.response?.data,
      });

      if (error.response?.data) {
        const { code, detail } = error.response.data;
        logger.warn(`World ID verification failed: ${code} - ${detail}`);
      }

      return false;
    }
  }
}

export default new WorldIDService();
