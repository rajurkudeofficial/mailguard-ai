/**
 * MailGuard AI — Gmail Routes
 * /api/gmail/profile         — Gmail account profile
 * /api/gmail/messages        — List messages
 * /api/gmail/messages/:id    — Get single message
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAccessToken } from '../services/auth.service';
import * as GmailService from '../services/gmail.service';
import { prisma } from '../db/prisma';
import logger from '../utils/logger';

const router = Router();
router.use(requireAuth);

router.get('/profile', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const accessToken = await getAccessToken(user.id);
  if (!accessToken) {
    res.status(401).json({ error: 'No valid access token. Please re-authenticate.' });
    return;
  }
  try {
    const profile = await GmailService.getProfile(accessToken);
    res.json(profile);
  } catch (err) {
    logger.error('Gmail profile fetch failed', { error: String(err) });
    res.status(500).json({ error: 'Failed to fetch Gmail profile' });
  }
});

router.get('/messages', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const accessToken = await getAccessToken(user.id);
  if (!accessToken) {
    res.status(401).json({ error: 'No valid access token' });
    return;
  }

  const maxResults = Math.min(parseInt(String(req.query.maxResults ?? '20')), 100);
  const pageToken = req.query.pageToken as string | undefined;
  const q = req.query.q as string | undefined;

  try {
    const listResult = await GmailService.listMessages(accessToken, { maxResults, pageToken, q });
    const messageIds = listResult.messages?.map((m) => m.id) ?? [];

    const messages = await GmailService.batchGetMessages(messageIds, accessToken);

    const summaries = messages.map((msg) => ({
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet,
      subject: GmailService.extractHeader(msg.payload, 'Subject'),
      from: GmailService.extractHeader(msg.payload, 'From'),
      date: GmailService.extractHeader(msg.payload, 'Date'),
      receivedAt: new Date(parseInt(msg.internalDate)).toISOString(),
    }));

    res.json({ messages: summaries, nextPageToken: listResult.nextPageToken, total: listResult.resultSizeEstimate });
  } catch (err) {
    logger.error('Gmail messages fetch failed', { error: String(err) });
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.get('/messages/:messageId', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const accessToken = await getAccessToken(user.id);
  if (!accessToken) {
    res.status(401).json({ error: 'No valid access token' });
    return;
  }

  try {
    const msg = await GmailService.getMessage(req.params.messageId, accessToken);
    const headers = GmailService.extractHeaders(msg.payload);
    const bodyText = GmailService.extractBodyText(msg.payload);
    const attachments = GmailService.extractAttachments(msg.payload);
    const urls = GmailService.extractUrls(bodyText);

    res.json({
      id: msg.id,
      threadId: msg.threadId,
      snippet: msg.snippet,
      headers,
      bodyText,
      attachments,
      urls,
      receivedAt: new Date(parseInt(msg.internalDate)).toISOString(),
    });
  } catch (err) {
    logger.error('Gmail message fetch failed', { error: String(err), messageId: req.params.messageId });
    res.status(500).json({ error: 'Failed to fetch message' });
  }
});

export default router;
