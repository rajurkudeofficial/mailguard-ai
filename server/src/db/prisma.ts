/**
 * MailGuard AI — Prisma Client Singleton
 * Prevents multiple instances during hot-reloads in development.
 */
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ],
  });

// @ts-ignore
prisma.$on('error', (e: any) => logger.error('Prisma error', { message: e.message }));
// @ts-ignore
prisma.$on('warn', (e: any) => logger.warn('Prisma warning', { message: e.message }));

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
