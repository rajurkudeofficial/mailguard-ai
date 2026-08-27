/**
 * MailGuard AI — Header Analyzer
 * Parses email headers for SPF, DKIM, DMARC authentication results
 * and Received chain anomalies.
 */

export type AuthResult = 'PASS' | 'FAIL' | 'SOFTFAIL' | 'NEUTRAL' | 'NONE' | 'UNKNOWN';

export interface HeaderSignals {
  spfResult: AuthResult;
  dkimResult: AuthResult;
  dmarcResult: AuthResult;
  receivedChainSuspicious: boolean;
  evidence: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
}

function parseAuthResult(text: string, protocol: 'spf' | 'dkim' | 'dmarc'): AuthResult {
  const lower = text.toLowerCase();
  const pattern = new RegExp(`${protocol}=([a-z]+)`);
  const match = lower.match(pattern);
  if (!match) return 'NONE';

  switch (match[1]) {
    case 'pass': return 'PASS';
    case 'fail': return 'FAIL';
    case 'softfail': return 'SOFTFAIL';
    case 'neutral': return 'NEUTRAL';
    case 'none': return 'NONE';
    default: return 'UNKNOWN';
  }
}

export function analyzeHeaders(headers: Record<string, string>): HeaderSignals {
  const evidence: HeaderSignals['evidence'] = [];
  let receivedChainSuspicious = false;

  // Combine Authentication-Results headers (can appear multiple times)
  const authResults = Object.entries(headers)
    .filter(([key]) => key.toLowerCase().includes('authentication-results'))
    .map(([, val]) => val)
    .join(' ');

  const spfResult = parseAuthResult(authResults, 'spf');
  const dkimResult = parseAuthResult(authResults, 'dkim');
  const dmarcResult = parseAuthResult(authResults, 'dmarc');

  // SPF evidence
  if (spfResult === 'FAIL') {
    evidence.push({
      label: 'SPF Fail',
      detail: 'SPF record check failed — email may not be from the claimed domain',
      severity: 'high',
    });
  } else if (spfResult === 'SOFTFAIL') {
    evidence.push({
      label: 'SPF Softfail',
      detail: 'SPF softfail — domain owner considers the source as not authorized but not outright failing',
      severity: 'medium',
    });
  } else if (spfResult === 'NONE') {
    evidence.push({
      label: 'SPF Not Configured',
      detail: 'No SPF record found for the sender domain',
      severity: 'low',
    });
  }

  // DKIM evidence
  if (dkimResult === 'FAIL') {
    evidence.push({
      label: 'DKIM Fail',
      detail: 'DKIM signature verification failed — email contents may have been tampered with',
      severity: 'high',
    });
  } else if (dkimResult === 'NONE') {
    evidence.push({
      label: 'DKIM Not Present',
      detail: 'No DKIM signature found — legitimate senders typically sign their emails',
      severity: 'low',
    });
  }

  // DMARC evidence
  if (dmarcResult === 'FAIL') {
    evidence.push({
      label: 'DMARC Fail',
      detail: 'DMARC policy check failed — email is not aligned with the domain\'s authentication policy',
      severity: 'critical',
    });
  } else if (dmarcResult === 'NONE') {
    evidence.push({
      label: 'DMARC Not Configured',
      detail: 'No DMARC policy found — the domain has no email authentication enforcement',
      severity: 'low',
    });
  }

  // Received chain analysis
  const receivedHeaders = Object.entries(headers)
    .filter(([key]) => key.toLowerCase() === 'received')
    .map(([, val]) => val);

  const suspiciousReceivedPatterns = [
    /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}.*(?:ru|cn|kp|ir)/i,
    /unknown\s+\[/i,
    /from\s+localhost/i,
  ];

  for (const received of receivedHeaders) {
    if (suspiciousReceivedPatterns.some((p) => p.test(received))) {
      receivedChainSuspicious = true;
      evidence.push({
        label: 'Suspicious Mail Relay',
        detail: `Received header contains suspicious relay: ${received.substring(0, 100)}...`,
        severity: 'medium',
      });
      break;
    }
  }

  return {
    spfResult,
    dkimResult,
    dmarcResult,
    receivedChainSuspicious,
    evidence,
  };
}
