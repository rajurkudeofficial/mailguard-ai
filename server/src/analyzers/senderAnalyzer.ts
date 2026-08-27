/**
 * MailGuard AI — Sender Analyzer
 * Checks for display-name spoofing, look-alike domains, Reply-To mismatch,
 * Return-Path mismatch, and typosquatting via Levenshtein distance.
 */

export interface SenderSignals {
  suspiciousSender: boolean;
  displayNameMismatch: boolean;
  replyToMismatch: boolean;
  lookAlikeDomain: boolean;
  typosquatting: boolean;
  evidence: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
}

// Well-known trusted domains for look-alike detection
const TRUSTED_BRANDS = [
  'google.com', 'gmail.com', 'microsoft.com', 'outlook.com', 'hotmail.com',
  'apple.com', 'amazon.com', 'amazon.in', 'paypal.com', 'ebay.com',
  'facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com',
  'netflix.com', 'spotify.com', 'dropbox.com', 'adobe.com',
  'github.com', 'gitlab.com', 'atlassian.com', 'slack.com', 'zoom.us',
  'hdfc.com', 'icici.com', 'sbi.co.in', 'axisbank.com',
  'fedex.com', 'dhl.com', 'ups.com', 'usps.com',
  'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
];

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function extractDomain(email: string): string {
  const match = email.match(/@([^>]+)/);
  return match ? match[1].toLowerCase().trim() : '';
}

function extractBrandName(domain: string): string {
  // e.g. paypa1.com → paypa1, accounts.google.com → google
  const parts = domain.replace(/\.[^.]+$/, '').split('.');
  return parts[parts.length - 1];
}

export function analyzeSender(params: {
  sender: string;
  senderName?: string;
  senderDomain: string;
  replyTo?: string;
  returnPath?: string;
}): SenderSignals {
  const { sender, senderName, senderDomain, replyTo, returnPath } = params;
  const evidence: SenderSignals['evidence'] = [];
  let suspiciousSender = false;
  let displayNameMismatch = false;
  let replyToMismatch = false;
  let lookAlikeDomain = false;
  let typosquatting = false;

  // 1. Display name vs. actual domain mismatch
  if (senderName) {
    for (const brand of TRUSTED_BRANDS) {
      const brandBase = brand.split('.')[0];
      if (
        senderName.toLowerCase().includes(brandBase) &&
        !senderDomain.toLowerCase().includes(brandBase) &&
        !senderDomain.endsWith(`.${brand}`) &&
        senderDomain !== brand
      ) {
        displayNameMismatch = true;
        suspiciousSender = true;
        evidence.push({
          label: 'Display Name Spoofing',
          detail: `Sender claims to be "${senderName}" (${brandBase}) but domain is "${senderDomain}"`,
          severity: 'high',
        });
        break;
      }
    }
  }

  // 2. Reply-To mismatch
  if (replyTo) {
    const replyDomain = extractDomain(replyTo);
    const fromDomain = extractDomain(sender);
    if (replyDomain && fromDomain && replyDomain !== fromDomain) {
      replyToMismatch = true;
      suspiciousSender = true;
      evidence.push({
        label: 'Reply-To Mismatch',
        detail: `From domain "${fromDomain}" differs from Reply-To domain "${replyDomain}"`,
        severity: 'high',
      });
    }
  }

  // 3. Return-Path mismatch (envelope sender)
  if (returnPath) {
    const rpDomain = extractDomain(returnPath);
    if (rpDomain && rpDomain !== senderDomain && rpDomain !== `bounce.${senderDomain}`) {
      suspiciousSender = true;
      evidence.push({
        label: 'Return-Path Mismatch',
        detail: `Return-Path domain "${rpDomain}" doesn't match sender domain "${senderDomain}"`,
        severity: 'medium',
      });
    }
  }

  // 4. Look-alike domain (typosquatting via Levenshtein)
  const senderBrand = extractBrandName(senderDomain);
  for (const trusted of TRUSTED_BRANDS) {
    const trustedBrand = trusted.split('.')[0];
    if (senderDomain === trusted) break; // exact match = legit

    const dist = levenshtein(senderBrand, trustedBrand);
    // Similar name (edit distance ≤ 2) but different domain → suspicious
    if (dist > 0 && dist <= 2 && trustedBrand.length >= 4) {
      lookAlikeDomain = true;
      typosquatting = true;
      suspiciousSender = true;
      evidence.push({
        label: 'Typosquatting / Look-alike Domain',
        detail: `"${senderDomain}" closely resembles trusted domain "${trusted}" (edit distance: ${dist})`,
        severity: 'critical',
      });
      break;
    }
  }

  // 5. Suspicious TLD patterns
  const suspiciousTLDs = ['.ru', '.cn', '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.loan'];
  const tld = `.${senderDomain.split('.').pop() ?? ''}`;
  if (suspiciousTLDs.some((t) => senderDomain.endsWith(t))) {
    suspiciousSender = true;
    evidence.push({
      label: 'Suspicious Domain TLD',
      detail: `Sender domain "${senderDomain}" uses a TLD commonly associated with spam/phishing (${tld})`,
      severity: 'medium',
    });
  }

  // 6. Free email service posing as business
  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  if (senderName && freeEmailDomains.includes(senderDomain)) {
    const lowerName = senderName.toLowerCase();
    const businessKeywords = ['ceo', 'director', 'manager', 'hr', 'finance', 'payroll', 'it department', 'security'];
    if (businessKeywords.some((kw) => lowerName.includes(kw))) {
      suspiciousSender = true;
      evidence.push({
        label: 'Business Impersonation via Free Email',
        detail: `Sender claims business role "${senderName}" but uses free email provider "${senderDomain}"`,
        severity: 'high',
      });
    }
  }

  return {
    suspiciousSender,
    displayNameMismatch,
    replyToMismatch,
    lookAlikeDomain,
    typosquatting,
    evidence,
  };
}
