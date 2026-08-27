/**
 * MailGuard AI — Auth Routes
 * /api/auth/google         — initiate OAuth
 * /api/auth/google/callback — OAuth callback
 * /api/auth/logout         — logout
 * /api/auth/me             — current session user
 */

import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from '../db/prisma';
import { saveTokens } from '../services/auth.service';
import { logAction } from '../services/audit.service';
import config from '../config/env';
import logger from '../utils/logger';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

// ── Passport setup (called once at app startup) ───────────────────────────
export function setupPassport(): void {
  if (!config.google.clientId || !config.google.clientSecret) {
    logger.warn('Google OAuth not configured — demo mode only');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google.clientId,
        clientSecret: config.google.clientSecret,
        callbackURL: config.google.redirectUri,
        scope: config.google.scopes,
      },
      async (_accessToken: string, refreshToken: string, params: any, profile: passport.Profile, done: (error: any, user?: any) => void) => {
        try {
          const email = profile.emails?.[0]?.value ?? '';
          const expiresAt = (params as Record<string, unknown>).expires_in
            ? new Date(Date.now() + Number((params as Record<string, unknown>).expires_in) * 1000)
            : undefined;

          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId: profile.id,
                email,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
              },
            });
            logger.info('New user created', { userId: user.id, email });
          }

          // Save encrypted tokens
          await saveTokens(user.id, {
            accessToken: _accessToken,
            refreshToken: refreshToken ?? undefined,
            expiresAt,
          });

          await logAction({ userId: user.id, action: 'LOGIN', details: { provider: 'google' } });

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user ?? false);
    } catch (err) {
      done(err);
    }
  });
}

// ── Routes ────────────────────────────────────────────────────────────────

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!config.google.clientId) {
    res.status(503).json({ error: 'OAuth not configured. Use Demo Mode.' });
    return;
  }
  passport.authenticate('google', {
    scope: config.google.scopes,
    accessType: 'offline',
    prompt: 'consent',
  })(req, res, next);
});

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { failureRedirect: `${config.clientUrl}?auth=failed` })(req, res, next);
  },
  (_req: Request, res: Response) => {
    res.redirect(`${config.clientUrl}/dashboard`);
  }
);

router.post('/logout', async (req: Request, res: Response) => {
  const userId = (req.user as { id?: string } | undefined)?.id;
  if (userId) {
    await logAction({ userId, action: 'LOGOUT' });
  }
  req.logout((err) => {
    if (err) {
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/me', (req: Request, res: Response) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.json({ user: null, isDemo: config.isDemo });
    return;
  }
  const user = req.user as {
    id: string; email: string; name: string; avatarUrl?: string;
    encryptedAccessToken?: string; encryptedRefreshToken?: string;
  };
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    isDemo: false,
  });
});

export default router;
