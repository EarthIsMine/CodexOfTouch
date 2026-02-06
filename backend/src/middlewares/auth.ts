import { Response, NextFunction } from 'express';
import { AuthRequest, ErrorCode } from '@/types';
import { verifyToken } from '@/utils/jwt';
import { AuthError } from '@/utils/errors';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(ErrorCode.UNAUTHORIZED, 'No token provided');
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    req.userId = payload.userId;
    next();
  } catch (error) {
    next(new AuthError(ErrorCode.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      req.userId = payload.userId;
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without userId
    next();
  }
};
