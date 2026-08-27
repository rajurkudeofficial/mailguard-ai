/**
 * MailGuard AI — Trusted Senders Routes
 * GET    /api/trusted         — list trusted senders
 * POST   /api/trusted         — add trusted sender
 * DELETE /api/trusted/:id     — remove trusted sender
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../db/prisma';

const router = Router();
router.use(requireAuth);

const AddSchema = z.object({
  type: z.enum(['EMAIL', 'DOMAIN']),
  value: z.string().min(1).max(255),
});

router.get('/', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const senders = await prisma.trustedSender.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ senders });
});

router.post('/', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const parsed = AddSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid input', details: parsed.error.errors });
    return;
  }

  try {
    const sender = await prisma.trustedSender.create({
      data: { userId: user.id, type: parsed.data.type, value: parsed.data.value.toLowerCase() },
    });
    res.status(201).json({ sender });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'P2002') {
      res.status(409).json({ error: 'Already in trusted list' });
      return;
    }
    throw err;
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const sender = await prisma.trustedSender.findFirst({ where: { id: req.params.id, userId: user.id } });
  if (!sender) {
    res.status(404).json({ error: 'Trusted sender not found' });
    return;
  }
  await prisma.trustedSender.delete({ where: { id: req.params.id } });
  res.json({ message: 'Removed from trusted list' });
});

export default router;
