import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/errors';
import { errorResponse } from '@/utils/response';
import { ErrorCode } from '@/types';
import logger from '@/config/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (err instanceof AppError) {
    return errorResponse(res, err.code, err.message, err.statusCode, err.details);
  }

  // Default to 500 server error
  return errorResponse(
    res,
    ErrorCode.SERVER_ERROR,
    'Internal server error',
    500,
    process.env.NODE_ENV === 'development' ? { message: err.message, stack: err.stack } : undefined
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  return errorResponse(res, ErrorCode.NOT_FOUND, `Route ${req.url} not found`, 404);
};
