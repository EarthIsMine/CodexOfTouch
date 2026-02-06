import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import userService from '@/services/user.service';
import { successResponse } from '@/utils/response';

export class UserController {
  async getMe(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const user = await userService.getUserById(userId);

      return successResponse(res, { user }, 200);
    } catch (error) {
      next(error);
    }
  }

  async checkIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const result = await userService.checkIn(userId);

      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
