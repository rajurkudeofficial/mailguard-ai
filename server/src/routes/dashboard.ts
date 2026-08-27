/**
 * MailGuard AI — Dashboard Routes
 * GET /api/dashboard — aggregated stats for the authenticated user
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as { id: string };

  const [emails, byClassification, byRisk, recentThreats] = await Promise.all([
    prisma.email.count({ where: { userId: user.id } }),

    prisma.email.groupBy({
      by: ['classification'],
      where: { userId: user.id },
      _count: { id: true },
    }),

    prisma.email.groupBy({
      by: ['riskLevel'],
      where: { userId: user.id },
      _count: { id: true },
    }),

    prisma.email.findMany({
      where: { userId: user.id, riskLevel: { in: ['HIGH', 'CRITICAL'] } },
      orderBy: { analyzedAt: 'desc' },
      take: 5,
      select: {
        id: true, sender: true, subject: true,
        classification: true, riskLevel: true, securityScore: true,
        receivedAt: true, analyzedAt: true,
      },
    }),
  ]);

  const avgScore = await prisma.email.aggregate({
    where: { userId: user.id },
    _avg: { securityScore: true },
  });

  const classMap: Record<string, number> = {};
  for (const r of byClassification) classMap[r.classification] = r._count.id;

  const riskMap: Record<string, number> = {};
  for (const r of byRisk) riskMap[r.riskLevel] = r._count.id;

  res.json({
    stats: {
      totalEmails: emails,
      byClassification: classMap,
      byRisk: riskMap,
      avgSecurityScore: Math.round(avgScore._avg.securityScore ?? 0),
      threats: (riskMap['HIGH'] ?? 0) + (riskMap['CRITICAL'] ?? 0),
    },
    recentThreats,
  });
});

export default router;
