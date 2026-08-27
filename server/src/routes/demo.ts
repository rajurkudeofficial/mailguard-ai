/**
 * MailGuard AI — Demo Routes
 * /api/demo/emails         — list synthetic emails
 * /api/demo/emails/:id     — get single demo email
 * /api/demo/analyze/:id    — analyze a demo email
 * /api/demo/dashboard      — demo dashboard stats
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { DEMO_EMAILS, getDemoEmailById } from '../utils/demoData';
import { analyzeEmail } from '../analyzers';
import logger from '../utils/logger';

const router = Router();

// In-memory cache for analyzed demo emails
const analysisCache = new Map<string, Awaited<ReturnType<typeof analyzeEmail>>>();

async function getOrAnalyzeDemo(id: string) {
  if (analysisCache.has(id)) return analysisCache.get(id)!;

  const email = getDemoEmailById(id);
  if (!email) return null;

  const result = await analyzeEmail({
    gmailMessageId: email.gmailMessageId,
    sender: email.sender,
    senderName: email.senderName,
    senderDomain: email.senderDomain,
    replyTo: email.replyTo,
    returnPath: email.returnPath,
    subject: email.subject,
    bodyText: email.bodyText,
    headers: email.headers,
    attachments: email.attachments,
    urls: email.urls,
  });

  analysisCache.set(id, result);
  return result;
}

router.get('/emails', (_req: Request, res: Response) => {
  const summaries = DEMO_EMAILS.map((e) => ({
    id: e.id,
    gmailMessageId: e.gmailMessageId,
    sender: e.sender,
    senderName: e.senderName,
    senderDomain: e.senderDomain,
    subject: e.subject,
    snippet: e.snippet,
    receivedAt: e.receivedAt,
    isDemo: true,
  }));
  res.json({ emails: summaries, total: summaries.length });
});

router.get('/emails/:id', async (req: Request, res: Response) => {
  const email = getDemoEmailById(req.params.id);
  if (!email) {
    res.status(404).json({ error: 'Demo email not found' });
    return;
  }
  const analysis = await getOrAnalyzeDemo(email.id);
  res.json({ email, analysis });
});

router.post('/analyze/:id', async (req: Request, res: Response) => {
  try {
    const analysis = await getOrAnalyzeDemo(req.params.id);
    if (!analysis) {
      res.status(404).json({ error: 'Demo email not found' });
      return;
    }
    res.json({ analysis });
  } catch (err) {
    logger.error('Demo analysis error', { error: String(err) });
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.get('/dashboard', async (_req: Request, res: Response) => {
  // Pre-analyze all demo emails to build dashboard stats
  const analyses = await Promise.all(
    DEMO_EMAILS.map(async (e) => {
      const analysis = await getOrAnalyzeDemo(e.id);
      return { email: e, analysis };
    })
  );

  const classified = analyses.filter((a) => a.analysis);
  const byClassification: Record<string, number> = {};
  const byRisk: Record<string, number> = {};
  let totalScore = 0;

  for (const { analysis } of classified) {
    if (!analysis) continue;
    byClassification[analysis.classification] = (byClassification[analysis.classification] ?? 0) + 1;
    byRisk[analysis.riskLevel] = (byRisk[analysis.riskLevel] ?? 0) + 1;
    totalScore += analysis.securityScore;
  }

  const threats = classified
    .filter((a) => a.analysis && ['PHISHING', 'MALWARE', 'BEC', 'SUSPICIOUS'].includes(a.analysis.classification))
    .map(({ email, analysis }) => ({
      id: email.id,
      sender: email.sender,
      subject: email.subject,
      classification: analysis!.classification,
      riskLevel: analysis!.riskLevel,
      securityScore: analysis!.securityScore,
      receivedAt: email.receivedAt,
    }));

  res.json({
    stats: {
      totalEmails: classified.length,
      byClassification,
      byRisk,
      avgSecurityScore: classified.length ? Math.round(totalScore / classified.length) : 0,
      threats: threats.length,
    },
    recentThreats: threats.slice(0, 5),
    isDemo: true,
  });
});

export default router;
