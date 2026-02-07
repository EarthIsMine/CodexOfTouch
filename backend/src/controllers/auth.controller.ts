import { Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import { successResponse } from '@/utils/response';

export class AuthController {
  async worldIdAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const { proof, walletAddress } = req.body;

      const result = await authService.authenticateWithWorldID(proof, walletAddress);

      return successResponse(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new AuthController();
