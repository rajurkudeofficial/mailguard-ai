/**
 * MailGuard AI — Email Analyzer Orchestrator
 * Runs all sub-analyzers and assembles the final analysis result.
 */

import { analyzeSender } from './senderAnalyzer';
import { analyzeHeaders } from './headerAnalyzer';
import { analyzeUrls } from './urlAnalyzer';
import { analyzeContent } from './contentAnalyzer';
import { analyzeAttachments } from './attachmentAnalyzer';
import { calculateScore } from './scoringEngine';
import { classify } from './classifier';
import { generateAiExplanation } from './aiAnalyzer';

export interface EmailAnalysisInput {
  gmailMessageId: string;
  sender: string;
  senderName?: string;
  senderDomain: string;
  replyTo?: string;
  returnPath?: string;
  subject: string;
  bodyText: string;
  headers: Record<string, string>;
  attachments: Array<{ filename: string; mimeType: string; size: number }>;
  urls: string[];
}

export interface FullAnalysisResult {
  // Sender
  spfResult: string;
  dkimResult: string;
  dmarcResult: string;
  suspiciousSender: boolean;
  displayNameMismatch: boolean;
  replyToMismatch: boolean;
  lookAlikeDomain: boolean;
  typosquatting: boolean;
  // URLs
  hasUrls: boolean;
  urlCount: number;
  suspiciousUrls: boolean;
  maliciousUrls: boolean;
  httpUrls: boolean;
  urlShorteners: boolean;
  urlData: string; // JSON
  // Content
  urgencyLanguage: boolean;
  threatLanguage: boolean;
  credentialRequest: boolean;
  financialRequest: boolean;
  otpRequest: boolean;
  fakeInvoice: boolean;
  prizeScam: boolean;
  impersonation: boolean;
  contentKeywords: string; // JSON
  // Attachments
  hasAttachments: boolean;
  attachmentCount: number;
  suspiciousAttachment: boolean;
  executableAttachment: boolean;
  attachmentData: string; // JSON
  // Scoring
  securityScore: number;
  scoreBreakdown: string; // JSON
  // Classification
  classification: string;
  riskLevel: string;
  recommendation: string;
  evidence: string; // JSON
  aiExplanation: string | null;
}

function buildRecommendation(classification: string, riskLevel: string): string {
  switch (classification) {
    case 'PHISHING':
      return 'Do not click any links or enter any information. Report this email as phishing and delete it immediately.';
    case 'MALWARE':
      return 'Do not open any attachments. Delete this email immediately and run a malware scan if the attachment was already opened.';
    case 'BEC':
      return 'Verify this request via a separate, trusted communication channel before taking any action. Do not transfer funds or share information.';
    case 'SPAM':
      return 'This appears to be spam or a scam. Mark as spam and delete. Do not respond or click any links.';
    case 'SUSPICIOUS':
      return 'Exercise caution. Verify the sender through official channels before responding or clicking any links.';
    case 'SAFE':
      return 'This email appears legitimate. No immediate threats detected.';
    default:
      return riskLevel === 'LOW'
        ? 'No major threats detected. Proceed with normal caution.'
        : 'Review carefully before taking any action.';
  }
}

export async function analyzeEmail(input: EmailAnalysisInput): Promise<FullAnalysisResult> {
  const sender = analyzeSender({
    sender: input.sender,
    senderName: input.senderName,
    senderDomain: input.senderDomain,
    replyTo: input.replyTo,
    returnPath: input.returnPath,
  });

  const headers = analyzeHeaders(input.headers);
  const urls = analyzeUrls(input.urls, input.bodyText);
  const content = analyzeContent(input.bodyText);
  const attachments = analyzeAttachments(input.attachments);

  const scoring = calculateScore({ sender, headers, urls, content, attachments });
  const classification = classify({
    riskLevel: scoring.riskLevel,
    rawRiskScore: scoring.rawRiskScore,
    sender,
    content,
    attachments,
  });

  const recommendation = buildRecommendation(classification, scoring.riskLevel);

  // Combine all evidence
  const allEvidence = [
    ...sender.evidence,
    ...headers.evidence,
    ...urls.evidence,
    ...content.evidence,
    ...attachments.evidence,
  ];

  // Optional AI explanation
  const topSignals = scoring.scoreBreakdown.slice(0, 5).map((b) => b.label);
  const aiExplanation = await generateAiExplanation({
    subject: input.subject,
    sender: input.sender,
    classification,
    riskLevel: scoring.riskLevel,
    securityScore: scoring.securityScore,
    topSignals,
  });

  return {
    spfResult: headers.spfResult,
    dkimResult: headers.dkimResult,
    dmarcResult: headers.dmarcResult,
    suspiciousSender: sender.suspiciousSender,
    displayNameMismatch: sender.displayNameMismatch,
    replyToMismatch: sender.replyToMismatch,
    lookAlikeDomain: sender.lookAlikeDomain,
    typosquatting: sender.typosquatting,
    hasUrls: urls.hasUrls,
    urlCount: urls.urlCount,
    suspiciousUrls: urls.suspiciousUrls,
    maliciousUrls: urls.maliciousUrls,
    httpUrls: urls.httpUrls,
    urlShorteners: urls.urlShorteners,
    urlData: JSON.stringify(urls.urlData),
    urgencyLanguage: content.urgencyLanguage,
    threatLanguage: content.threatLanguage,
    credentialRequest: content.credentialRequest,
    financialRequest: content.financialRequest,
    otpRequest: content.otpRequest,
    fakeInvoice: content.fakeInvoice,
    prizeScam: content.prizeScam,
    impersonation: content.impersonation,
    contentKeywords: JSON.stringify(content.contentKeywords),
    hasAttachments: attachments.hasAttachments,
    attachmentCount: attachments.attachmentCount,
    suspiciousAttachment: attachments.suspiciousAttachment,
    executableAttachment: attachments.executableAttachment,
    attachmentData: JSON.stringify(attachments.attachmentData),
    securityScore: scoring.securityScore,
    scoreBreakdown: JSON.stringify(scoring.scoreBreakdown),
    classification,
    riskLevel: scoring.riskLevel,
    recommendation,
    evidence: JSON.stringify(allEvidence),
    aiExplanation,
  };
}
