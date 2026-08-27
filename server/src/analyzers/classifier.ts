/**
 * MailGuard AI — Email Classifier
 * Maps scoring results + signals → classification enum.
 */

import type { RiskLevel } from './scoringEngine';
import type { SenderSignals } from './senderAnalyzer';
import type { AttachmentSignals } from './attachmentAnalyzer';
import type { ContentSignals } from './contentAnalyzer';

export type EmailClassification =
  | 'SAFE'
  | 'SUSPICIOUS'
  | 'PHISHING'
  | 'SPAM'
  | 'MALWARE'
  | 'BEC'
  | 'UNKNOWN';

export function classify(params: {
  riskLevel: RiskLevel;
  rawRiskScore: number;
  sender: SenderSignals;
  content: ContentSignals;
  attachments: AttachmentSignals;
}): EmailClassification {
  const { riskLevel, rawRiskScore, sender, content, attachments } = params;

  // Malware — executable or macro attachment is the strongest signal
  if (attachments.executableAttachment) return 'MALWARE';
  if (attachments.suspiciousAttachment && rawRiskScore >= 40) return 'MALWARE';

  // Business Email Compromise — financial request + impersonation + no attachments
  if (content.financialRequest && (sender.displayNameMismatch || sender.replyToMismatch) && !attachments.hasAttachments) {
    return 'BEC';
  }

  // Phishing — credential or OTP harvest + domain manipulation
  if (content.credentialRequest || content.otpRequest) return 'PHISHING';
  if (sender.typosquatting && (content.urgencyLanguage || content.threatLanguage)) return 'PHISHING';
  if (riskLevel === 'CRITICAL' && (sender.lookAlikeDomain || sender.displayNameMismatch)) return 'PHISHING';

  // Spam — prize scam or bulk solicitation
  if (content.prizeScam) return 'SPAM';
  if (riskLevel === 'HIGH' && !content.credentialRequest && !content.financialRequest) return 'SPAM';

  // Suspicious — some signals but not definitively classified
  if (riskLevel === 'HIGH' || riskLevel === 'MEDIUM') return 'SUSPICIOUS';

  // Safe
  if (rawRiskScore <= 15) return 'SAFE';

  return 'UNKNOWN';
}
