/**
 * MailGuard AI — Auth Service
 * Handles Google OAuth token refresh and storage encryption.
 */

import { prisma } from '../db/prisma';
import { encrypt, decrypt } from '../utils/crypto';
import config from '../config/env';
import logger from '../utils/logger';

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export async function saveTokens(userId: string, tokens: GoogleTokens): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      encryptedAccessToken: encrypt(tokens.accessToken),
      encryptedRefreshToken: tokens.refreshToken ? encrypt(tokens.refreshToken) : undefined,
      tokenExpiresAt: tokens.expiresAt,
    },
  });
}

export async function getAccessToken(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Check if token needs refresh (refresh 5 min before expiry)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);

  if (user.encryptedAccessToken && (!user.tokenExpiresAt || user.tokenExpiresAt > expiryBuffer)) {
    return decrypt(user.encryptedAccessToken);
  }

  // Try to refresh
  if (user.encryptedRefreshToken) {
    const refreshToken = decrypt(user.encryptedRefreshToken);
    const newTokens = await refreshAccessToken(refreshToken);
    if (newTokens) {
      await saveTokens(userId, newTokens);
      return newTokens.accessToken;
    }
  }

  return null;
}

async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const data = await res.json() as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (data.error || !data.access_token) {
      logger.warn('Token refresh failed', { error: data.error });
      return null;
    }

    return {
      accessToken: data.access_token,
      refreshToken, // keep existing refresh token
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    };
  } catch (err) {
    logger.error('Token refresh error', { error: String(err) });
    return null;
  }
}
