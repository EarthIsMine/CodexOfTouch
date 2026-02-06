import { WorldIDProof, ErrorCode } from '@/types';
import { AppError } from '@/utils/errors';
import { generateToken } from '@/utils/jwt';
import worldIdService from './worldid.service';
import userService from './user.service';
import logger from '@/config/logger';

export class AuthService {
  async authenticateWithWorldID(proof: WorldIDProof, walletAddress?: string) {
    // Verify World ID proof
    const isValid = await worldIdService.verifyProof(proof);

    if (!isValid) {
      throw new AppError(ErrorCode.INVALID_WORLD_ID, 'Invalid World ID proof', 401);
    }

    const nullifierHash = proof.nullifier_hash;

    // Check if user exists
    let user = await userService.getUserByNullifierHash(nullifierHash);

    if (!user) {
      // Create new user
      user = await userService.createUser(nullifierHash, walletAddress);
      logger.info(`New user registered via World ID: ${user.id}`);
    } else if (walletAddress && !user.walletAddress) {
      // Update wallet address if not set
      user = await userService.getUserById(user.id);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      nullifierHash: user.nullifierHash,
    });

    return {
      token,
      user: {
        id: user.id,
        nullifierHash: user.nullifierHash,
        walletAddress: user.walletAddress,
        internalBalance: user.internalBalance,
        lastCheckIn: user.lastCheckIn,
        createdAt: user.createdAt,
      },
    };
  }
}

export default new AuthService();
