import { Response, NextFunction } from 'express';
import { AuthRequest } from '@/types';
import skillService from '@/services/skill.service';
import { successResponse } from '@/utils/response';

export class SkillController {
  async getAllSkills(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const skills = await skillService.getAllSkills();

      return successResponse(res, { skills }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async getMySkills(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const skills = await skillService.getUserSkills(userId);

      return successResponse(res, { skills }, 200);
    } catch (error) {
      return next(error);
    }
  }

  async purchaseSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const skillId = parseInt(req.params.skillId);
      const { transactionId, paymentReference } = req.body;

      if (!transactionId || !paymentReference) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'transactionId and paymentReference are required',
          },
        });
      }

      const userSkill = await skillService.purchaseSkill(
        userId,
        skillId,
        transactionId,
        paymentReference
      );

      return successResponse(res, { userSkill }, 201);
    } catch (error) {
      return next(error);
    }
  }

  async useSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const skillId = parseInt(req.params.skillId);

      const result = await skillService.useSkill(userId, skillId);

      return successResponse(res, result, 200);
    } catch (error) {
      return next(error);
    }
  }
}

export default new SkillController();
