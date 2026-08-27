/**
 * MailGuard AI — Scoring Engine
 * Converts analyzer signals into an explainable 0-100 security score.
 * Lower score = safer. Score is inverted before display (100 = very safe).
 */

import type { SenderSignals } from './senderAnalyzer';
import type { HeaderSignals } from './headerAnalyzer';
import type { UrlSignals } from './urlAnalyzer';
import type { ContentSignals } from './contentAnalyzer';
import type { AttachmentSignals } from './attachmentAnalyzer';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ScoreBreakdown {
  label: string;
  points: number;
  category: 'sender' | 'headers' | 'urls' | 'content' | 'attachments';
}

export interface ScoringResult {
  rawRiskScore: number;       // 0-100, higher = more risky
  securityScore: number;      // 0-100, higher = safer (inverted for display)
  riskLevel: RiskLevel;
  scoreBreakdown: ScoreBreakdown[];
}

export function calculateScore(params: {
  sender: SenderSignals;
  headers: HeaderSignals;
  urls: UrlSignals;
  content: ContentSignals;
  attachments: AttachmentSignals;
}): ScoringResult {
  const { sender, headers, urls, content, attachments } = params;
  const breakdown: ScoreBreakdown[] = [];
  let risk = 0;

  // ── Sender signals (max 35 pts) ──────────────────────────────────────────
  if (sender.typosquatting || sender.lookAlikeDomain) {
    breakdown.push({ label: 'Look-alike / Typosquatting Domain', points: 20, category: 'sender' });
    risk += 20;
  }
  if (sender.displayNameMismatch) {
    breakdown.push({ label: 'Display Name Spoofing', points: 15, category: 'sender' });
    risk += 15;
  }
  if (sender.replyToMismatch) {
    breakdown.push({ label: 'Reply-To Mismatch', points: 10, category: 'sender' });
    risk += 10;
  }
  if (sender.suspiciousSender && !sender.typosquatting && !sender.displayNameMismatch && !sender.replyToMismatch) {
    breakdown.push({ label: 'Suspicious Sender Signals', points: 5, category: 'sender' });
    risk += 5;
  }

  // ── Header signals (max 30 pts) ──────────────────────────────────────────
  if (headers.dmarcResult === 'FAIL') {
    breakdown.push({ label: 'DMARC Fail', points: 15, category: 'headers' });
    risk += 15;
  } else if (headers.dmarcResult === 'NONE') {
    breakdown.push({ label: 'DMARC Not Configured', points: 5, category: 'headers' });
    risk += 5;
  }
  if (headers.spfResult === 'FAIL') {
    breakdown.push({ label: 'SPF Fail', points: 10, category: 'headers' });
    risk += 10;
  } else if (headers.spfResult === 'SOFTFAIL') {
    breakdown.push({ label: 'SPF Softfail', points: 5, category: 'headers' });
    risk += 5;
  }
  if (headers.dkimResult === 'FAIL') {
    breakdown.push({ label: 'DKIM Fail', points: 10, category: 'headers' });
    risk += 10;
  } else if (headers.dkimResult === 'NONE' && headers.spfResult !== 'PASS') {
    breakdown.push({ label: 'No DKIM Signature', points: 3, category: 'headers' });
    risk += 3;
  }
  if (headers.receivedChainSuspicious) {
    breakdown.push({ label: 'Suspicious Mail Relay', points: 5, category: 'headers' });
    risk += 5;
  }

  // ── URL signals (max 30 pts) ─────────────────────────────────────────────
  if (urls.maliciousUrls) {
    breakdown.push({ label: 'Malicious URLs (IP/Punycode)', points: 20, category: 'urls' });
    risk += 20;
  }
  if (urls.urlShorteners) {
    breakdown.push({ label: 'URL Shorteners Detected', points: 10, category: 'urls' });
    risk += 10;
  }
  if (urls.suspiciousUrls && !urls.maliciousUrls) {
    breakdown.push({ label: 'Suspicious URLs', points: 8, category: 'urls' });
    risk += 8;
  }
  if (urls.httpUrls && urls.hasUrls) {
    breakdown.push({ label: 'Unencrypted HTTP Links', points: 5, category: 'urls' });
    risk += 5;
  }

  // ── Content signals (max 40 pts) ─────────────────────────────────────────
  if (content.credentialRequest) {
    breakdown.push({ label: 'Credential Harvesting Attempt', points: 20, category: 'content' });
    risk += 20;
  }
  if (content.otpRequest) {
    breakdown.push({ label: 'OTP / Verification Code Request', points: 15, category: 'content' });
    risk += 15;
  }
  if (content.threatLanguage) {
    breakdown.push({ label: 'Threatening Language', points: 12, category: 'content' });
    risk += 12;
  }
  if (content.financialRequest) {
    breakdown.push({ label: 'Financial / Wire Transfer Request', points: 12, category: 'content' });
    risk += 12;
  }
  if (content.prizeScam) {
    breakdown.push({ label: 'Prize / Lottery Scam Pattern', points: 10, category: 'content' });
    risk += 10;
  }
  if (content.impersonation) {
    breakdown.push({ label: 'Brand / Authority Impersonation', points: 8, category: 'content' });
    risk += 8;
  }
  if (content.urgencyLanguage) {
    breakdown.push({ label: 'Urgency Language', points: 6, category: 'content' });
    risk += 6;
  }
  if (content.fakeInvoice) {
    breakdown.push({ label: 'Fake Invoice Pattern', points: 8, category: 'content' });
    risk += 8;
  }

  // ── Attachment signals (max 30 pts) ──────────────────────────────────────
  if (attachments.executableAttachment) {
    breakdown.push({ label: 'Executable / Malware Attachment', points: 30, category: 'attachments' });
    risk += 30;
  } else if (attachments.suspiciousAttachment) {
    breakdown.push({ label: 'Suspicious Attachment (Macro/Double Ext)', points: 15, category: 'attachments' });
    risk += 15;
  }

  // Clamp to 0-100
  const rawRiskScore = Math.min(100, Math.max(0, risk));
  const securityScore = 100 - rawRiskScore;

  let riskLevel: RiskLevel;
  if (rawRiskScore >= 70) riskLevel = 'CRITICAL';
  else if (rawRiskScore >= 45) riskLevel = 'HIGH';
  else if (rawRiskScore >= 20) riskLevel = 'MEDIUM';
  else riskLevel = 'LOW';

  return { rawRiskScore, securityScore, riskLevel, scoreBreakdown: breakdown };
}
