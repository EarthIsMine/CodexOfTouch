import axios from 'axios';
import { config } from '@/config/env';
import { WorldIDProof, WorldIDVerifyResponse } from '@/types';
import logger from '@/config/logger';

export class WorldIDService {
  private readonly verifyUrl = 'https://developer.worldcoin.org/api/v1/verify';

  async verifyProof(proof: WorldIDProof): Promise<boolean> {
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
