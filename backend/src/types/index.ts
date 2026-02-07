import { Request } from 'express';

// ============================================
// Express Request Extensions
// ============================================
export interface AuthRequest extends Request {
  userId?: string;
}

// ============================================
// World ID Types
// ============================================
export interface WorldIDProof {
  merkle_root: string;
  nullifier_hash: string;
  proof: string;
  verification_level: 'orb' | 'device';
  credential_type?: string;
}

export interface WorldIDVerifyResponse {
  success: boolean;
  code?: string;
  detail?: string;
  attribute?: string;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// ============================================
// Pet Event Types
// ============================================
export interface PetResult {
  result: 'SUCCESS' | 'FAIL';
  codexUnlocked?: boolean;
  cooldownUntil?: Date;
  jackpot: {
    currentPool: number;
    timeRemaining?: number;
  };
  rewards: {
    balanceChange: number;
  };
}

// ============================================
// Jackpot Types
// ============================================
export interface JackpotState {
  characterId: number;
  characterName?: string;
  currentPool: number;
  lastUserId: string | null;
  lastUserWallet?: string;
  lastPetAt: Date | null;
  timeRemaining: number;
  status: 'ACTIVE' | 'READY' | 'NO_ACTIVITY';
}

// ============================================
// Skill Types
// ============================================
export interface ActiveSkill {
  skillId: number;
  effectType: string;
  value: number;
  expiresAt: Date;
}

// ============================================
// Error Codes
// ============================================
export enum ErrorCode {
  // Auth
  INVALID_WORLD_ID = 'AUTH_001',
  DUPLICATE_USER = 'AUTH_002',
  UNAUTHORIZED = 'AUTH_003',

  // User
  ALREADY_CHECKED_IN = 'USER_001',
  INVALID_CHECKIN_TIME = 'USER_002',

  // Character
  NO_ACTIVE_CHARACTER = 'CHAR_001',

  // Assets
  ASSET_ERROR = 'ASSET_001',

  // Pet
  INSUFFICIENT_BALANCE = 'PET_001',
  COOLDOWN_ACTIVE = 'PET_002',
  NO_ACTIVE_CHARACTER_PET = 'PET_003',
  CHARACTER_LOCKED = 'PET_004',

  // Skill
  SKILL_NOT_OWNED = 'SKILL_001',
  SKILL_EXPIRED = 'SKILL_002',
  INVALID_TX_HASH = 'SKILL_003',
  TRANSACTION_NOT_FOUND = 'SKILL_004',
  INSUFFICIENT_PAYMENT = 'SKILL_005',
  SKILL_ALREADY_ACTIVE = 'SKILL_006',

  // Jackpot
  JACKPOT_NOT_READY = 'JACKPOT_001',

  // General
  RATE_LIMIT = 'RATE_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
}

// ============================================
// Pagination
// ============================================
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}
