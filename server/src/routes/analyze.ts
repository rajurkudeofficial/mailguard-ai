/**
 * MailGuard AI — Analyze Routes
 * POST /api/analyze/email/:messageId — analyze a real Gmail message
 * GET  /api/analyze/email/:id        — get stored analysis
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getAccessToken } from '../services/auth.service';
import * as GmailService from '../services/gmail.service';
import { analyzeEmail } from '../analyzers';
import { prisma } from '../db/prisma';
import { logAction } from '../services/audit.service';
import logger from '../utils/logger';

const router = Router();
router.use(requireAuth);

router.post('/email/:messageId', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const { messageId } = req.params;

  const accessToken = await getAccessToken(user.id);
  if (!accessToken) {
    res.status(401).json({ error: 'No valid access token' });
    return;
  }

  try {
    // Fetch message from Gmail API
    const msg = await GmailService.getMessage(messageId, accessToken);
    const headers = GmailService.extractHeaders(msg.payload);
    const bodyText = GmailService.extractBodyText(msg.payload);
    const attachments = GmailService.extractAttachments(msg.payload);
    const urls = GmailService.extractUrls(bodyText);

    const fromHeader = GmailService.extractHeader(msg.payload, 'From') ?? '';
    const senderEmail = fromHeader.match(/<([^>]+)>/)?.[1] ?? fromHeader;
    const senderName = fromHeader.match(/^([^<]+)</)?.[1]?.trim();
    const senderDomain = GmailService.parseSenderDomain(senderEmail);
    const replyTo = GmailService.extractHeader(msg.payload, 'Reply-To');
    const returnPath = GmailService.extractHeader(msg.payload, 'Return-Path');
    const subject = GmailService.extractHeader(msg.payload, 'Subject') ?? '(No Subject)';
    const receivedAt = new Date(parseInt(msg.internalDate));

    // Run analysis
    const result = await analyzeEmail({
      gmailMessageId: messageId,
      sender: senderEmail,
      senderName,
      senderDomain,
      replyTo,
      returnPath,
      subject,
      bodyText,
      headers,
      attachments,
      urls,
    });

    // Upsert email record
    const email = await prisma.email.upsert({
      where: { gmailMessageId: messageId },
      create: {
        userId: user.id,
        gmailMessageId: messageId,
        threadId: msg.threadId,
        sender: senderEmail,
        senderDomain,
        senderName,
        replyTo,
        returnPath,
        subject,
        snippet: msg.snippet,
        receivedAt,
        classification: result.classification,
        riskLevel: result.riskLevel,
        securityScore: result.securityScore,
        recommendation: result.recommendation,
        isDemo: false,
      },
      update: {
        classification: result.classification,
        riskLevel: result.riskLevel,
        securityScore: result.securityScore,
        recommendation: result.recommendation,
        analyzedAt: new Date(),
      },
    });

    // Upsert analysis
    await prisma.emailAnalysis.upsert({
      where: { emailId: email.id },
      create: {
        emailId: email.id,
        spfResult: result.spfResult,
        dkimResult: result.dkimResult,
        dmarcResult: result.dmarcResult,
        suspiciousSender: result.suspiciousSender,
        displayNameMismatch: result.displayNameMismatch,
        replyToMismatch: result.replyToMismatch,
        lookAlikeDomain: result.lookAlikeDomain,
        typosquatting: result.typosquatting,
        hasUrls: result.hasUrls,
        urlCount: result.urlCount,
        suspiciousUrls: result.suspiciousUrls,
        maliciousUrls: result.maliciousUrls,
        httpUrls: result.httpUrls,
        urlShorteners: result.urlShorteners,
        urlData: result.urlData,
        urgencyLanguage: result.urgencyLanguage,
        threatLanguage: result.threatLanguage,
        credentialRequest: result.credentialRequest,
        financialRequest: result.financialRequest,
        otpRequest: result.otpRequest,
        fakeInvoice: result.fakeInvoice,
        prizeScam: result.prizeScam,
        impersonation: result.impersonation,
        contentKeywords: result.contentKeywords,
        hasAttachments: result.hasAttachments,
        attachmentCount: result.attachmentCount,
        suspiciousAttachment: result.suspiciousAttachment,
        executableAttachment: result.executableAttachment,
        attachmentData: result.attachmentData,
        scoreBreakdown: result.scoreBreakdown,
        evidence: result.evidence,
        recommendation: result.recommendation,
        aiExplanation: result.aiExplanation,
      },
      update: {
        spfResult: result.spfResult,
        dkimResult: result.dkimResult,
        dmarcResult: result.dmarcResult,
        suspiciousSender: result.suspiciousSender,
        displayNameMismatch: result.displayNameMismatch,
        replyToMismatch: result.replyToMismatch,
        lookAlikeDomain: result.lookAlikeDomain,
        typosquatting: result.typosquatting,
        hasUrls: result.hasUrls,
        urlCount: result.urlCount,
        suspiciousUrls: result.suspiciousUrls,
        maliciousUrls: result.maliciousUrls,
        httpUrls: result.httpUrls,
        urlShorteners: result.urlShorteners,
        urlData: result.urlData,
        urgencyLanguage: result.urgencyLanguage,
        threatLanguage: result.threatLanguage,
        credentialRequest: result.credentialRequest,
        financialRequest: result.financialRequest,
        otpRequest: result.otpRequest,
        fakeInvoice: result.fakeInvoice,
        prizeScam: result.prizeScam,
        impersonation: result.impersonation,
        contentKeywords: result.contentKeywords,
        hasAttachments: result.hasAttachments,
        attachmentCount: result.attachmentCount,
        suspiciousAttachment: result.suspiciousAttachment,
        executableAttachment: result.executableAttachment,
        attachmentData: result.attachmentData,
        scoreBreakdown: result.scoreBreakdown,
        evidence: result.evidence,
        recommendation: result.recommendation,
        aiExplanation: result.aiExplanation,
      },
    });

    await logAction({
      userId: user.id,
      action: 'ANALYZE_EMAIL',
      details: { messageId, classification: result.classification, riskLevel: result.riskLevel },
    });

    res.json({ emailId: email.id, ...result });
  } catch (err) {
    logger.error('Email analysis failed', { error: String(err), messageId });
    res.status(500).json({ error: 'Analysis failed' });
  }
});

router.get('/email/:id', async (req: Request, res: Response) => {
  const user = req.user as { id: string };
  const email = await prisma.email.findFirst({
    where: { id: req.params.id, userId: user.id },
    include: { analysis: true },
  });
  if (!email) {
    res.status(404).json({ error: 'Email not found' });
    return;
  }
  res.json(email);
});

export default router;
