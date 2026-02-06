import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // World ID
  worldcoinAppId: process.env.WORLDCOIN_APP_ID || '',
  worldcoinAction: process.env.WORLDCOIN_ACTION || 'pet-game-auth',
  worldApiKey: process.env.WORLD_API_KEY || '',
  serverWalletAddress: process.env.SERVER_WALLET_ADDRESS || '',

  // Blockchain
  blockchainRpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
  privateKey: process.env.PRIVATE_KEY || '',
  codexNftContract: process.env.CODEX_NFT_CONTRACT || '',
  wldTokenContract: process.env.WLD_TOKEN_CONTRACT || '',
  chainId: parseInt(process.env.CHAIN_ID || '480'),

  // Firebase
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY || '',
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',

  // Game Configuration
  defaultCheckinReward: parseInt(process.env.DEFAULT_CHECKIN_REWARD || '10'),
  checkinStreakBonus: parseInt(process.env.CHECKIN_STREAK_BONUS || '2'),
  petCost: parseInt(process.env.PET_COST || '1'),
  cooldownDuration: parseInt(process.env.COOLDOWN_DURATION || '30'), // seconds
  jackpotTimeout: parseInt(process.env.JACKPOT_TIMEOUT || '300'), // seconds (5 minutes)

  // Rate Limiting
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // milliseconds
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  petRateLimit: parseInt(process.env.PET_RATE_LIMIT || '10'),
  skillRateLimit: parseInt(process.env.SKILL_RATE_LIMIT || '5'),
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'WORLDCOIN_APP_ID',
    'BLOCKCHAIN_RPC_URL',
    'PRIVATE_KEY'
  );
}

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export default config;
