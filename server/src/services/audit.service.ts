/**
 * MailGuard AI — Audit Service
 * Writes to the AuditLog table for action trail.
 */

import { prisma } from '../db/prisma';
import logger from '../utils/logger';

export async function logAction(params: {
  userId?: string;
  action: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        details: params.details ? JSON.stringify(params.details) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  } catch (err) {
    // Audit failures should never crash the main flow
    logger.error('Failed to write audit log', { error: String(err), action: params.action });
  }
}
