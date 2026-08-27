/**
 * MailGuard AI — Auth Middleware
 * Ensures request has an authenticated session.
 */
import type { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
}

export function requireDemoOrAuth(req: Request, res: Response, next: NextFunction): void {
  // Allow demo mode without auth
  if (process.env.APP_MODE === 'demo' || (req.isAuthenticated?.() && req.user)) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
}
