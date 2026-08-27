/**
 * MailGuard AI — Threats Routes
 * GET /api/threats — high/critical emails for the user
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const page = Math.max(1, parseInt(String(req.query.page ?? '1')));
  const limit = Math.min(50, parseInt(String(req.query.limit ?? '20')));
  const skip = (page - 1) * limit;
  const classification = req.query.classification as string | undefined;

  const where = {
    userId: user.id,
    riskLevel: { in: ['HIGH', 'CRITICAL'] as string[] },
    ...(classification ? { classification } : {}),
  };

  const [threats, total] = await Promise.all([
    prisma.email.findMany({
      where,
      orderBy: { receivedAt: 'desc' },
      skip,
      take: limit,
      include: { analysis: { select: { evidence: true, spfResult: true, dkimResult: true, dmarcResult: true } } },
    }),
    prisma.email.count({ where }),
  ]);

  res.json({ threats, total, page, limit, totalPages: Math.ceil(total / limit) });
});

export default router;
