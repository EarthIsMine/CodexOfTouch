import { Response } from 'express';
import { ApiResponse, ApiError } from '@/types';

export const successResponse = <T>(res: Response, data: T, statusCode: number = 200): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any
): Response => {
  const error: ApiError = {
    code,
    message,
    details,
  };

  const response: ApiResponse = {
    success: false,
    error,
  };

  return res.status(statusCode).json(response);
};
