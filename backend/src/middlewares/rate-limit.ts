import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';
import { errorResponse } from '@/utils/response';
import { ErrorCode } from '@/types';

export const generalRateLimit = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    const retryAfter = Math.ceil(config.rateLimitWindow / 1000);
    return errorResponse(res, ErrorCode.RATE_LIMIT, 'Too many requests', 429, { retryAfter });
  },
});

export const petRateLimit = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.petRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // Rate limit per user
    return req.userId || req.ip;
  },
  handler: (_req, res) => {
    const retryAfter = Math.ceil(config.rateLimitWindow / 1000);
    return errorResponse(res, ErrorCode.RATE_LIMIT, 'Too many pet requests', 429, { retryAfter });
  },
});

export const skillRateLimit = rateLimit({
  windowMs: config.rateLimitWindow,
  max: config.skillRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    return req.userId || req.ip;
  },
  handler: (_req, res) => {
    const retryAfter = Math.ceil(config.rateLimitWindow / 1000);
    return errorResponse(res, ErrorCode.RATE_LIMIT, 'Too many skill requests', 429, { retryAfter });
  },
});
