/**
 * MailGuard AI — Environment Configuration
 * Validates and exports all required environment variables at startup.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root (two levels up from server/src/config/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback = ''): string {
  return process.env[key] || fallback;
}

export const config = {
  // Application
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
  port: parseInt(optionalEnv('PORT', '3001')),
  appMode: optionalEnv('APP_MODE', 'demo'), // 'demo' | 'production'
  clientUrl: optionalEnv('CLIENT_URL', 'http://localhost:5173'),

  // Google OAuth
  google: {
    clientId: optionalEnv('GOOGLE_CLIENT_ID'),
    clientSecret: optionalEnv('GOOGLE_CLIENT_SECRET'),
    redirectUri: optionalEnv('GOOGLE_REDIRECT_URI', 'http://localhost:3001/api/auth/google/callback'),
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.metadata',
    ],
  },

  // Session
  sessionSecret: optionalEnv('SESSION_SECRET', 'mailguard-dev-session-secret-change-in-production'),

  // Token encryption (32-byte hex key = 64 chars, or use fallback for dev)
  tokenEncryptionKey: optionalEnv(
    'TOKEN_ENCRYPTION_KEY',
    '0000000000000000000000000000000000000000000000000000000000000000'
  ),

  // Database
  databaseUrl: optionalEnv('DATABASE_URL', 'file:./dev.db'),

  // AI
  aiProvider: optionalEnv('AI_PROVIDER', ''), // 'openai' | 'gemini' | ''
  openaiApiKey: optionalEnv('OPENAI_API_KEY'),
  geminiApiKey: optionalEnv('GEMINI_API_KEY'),

  // Helpers
  isDevelopment: optionalEnv('NODE_ENV', 'development') === 'development',
  isDemo: optionalEnv('APP_MODE', 'demo') === 'demo',
};

export default config;
