/**
 * MailGuard AI — Alerts Routes
 * GET /api/alerts — security alerts for the user
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const limit = Math.min(50, parseInt(String(req.query.limit ?? '20')));

  const alerts = await prisma.securityAlert.findMany({
    where: { userId: user.id },
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });

  res.json({ alerts });
});

export default router;
