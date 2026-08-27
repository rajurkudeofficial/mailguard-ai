/**
 * MailGuard AI — Global Error Handler
 */
import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev = process.env.NODE_ENV === 'development';

  logger.error('Unhandled error', {
    message: err.message,
    code: err.code,
    statusCode,
    path: req.path,
    method: req.method,
    stack: isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: err.code ?? 'INTERNAL_SERVER_ERROR',
    message: isDev ? err.message : statusCode === 500 ? 'Internal server error' : err.message,
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
  });
}
