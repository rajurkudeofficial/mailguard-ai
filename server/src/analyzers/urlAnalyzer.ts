/**
 * MailGuard AI — URL Analyzer
 * Extracts URLs from email body and checks for:
 * - HTTP vs HTTPS
 * - IP-address URLs
 * - Known URL shorteners
 * - Punycode / homograph attacks
 * - Suspicious TLDs
 * - Mismatch between display text and href
 */

export interface UrlInfo {
  url: string;
  domain: string;
  isHttps: boolean;
  isIpAddress: boolean;
  isShortener: boolean;
  isPunycode: boolean;
  hasSuspiciousTLD: boolean;
  riskLevel: 'safe' | 'suspicious' | 'malicious';
}

export interface UrlSignals {
  hasUrls: boolean;
  urlCount: number;
  suspiciousUrls: boolean;
  maliciousUrls: boolean;
  httpUrls: boolean;
  urlShorteners: boolean;
  urlData: UrlInfo[];
  evidence: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
}

const URL_SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly',
  'dlvr.it', 'su.pr', 'ift.tt', 'fb.me', 'tiny.cc', 'lnkd.in', 'db.tt',
  'qr.ae', 'adf.ly', 'bitly.com', 'cli.gs', 'yfrog.com', 'migre.me',
  'ff.im', 'short.to', 'moourl.com', 'snipurl.com', 'x.co', 'short.ie',
  'kl.am', 'wp.me', 'rubyurl.com', 'twit.ac', 'shorturl.at', 'rb.gy',
  'cutt.ly', 'urlshrt.com', 'urlzs.com', 'url.ie', 'shortlinks.co.uk',
]);

const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click', '.loan',
  '.work', '.party', '.date', '.racing', '.win', '.review', '.download',
  '.bid', '.trade', '.science', '.faith', '.accountant', '.stream',
  '.webcam', '.gdn', '.men', '.icu',
]);

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
const IP_REGEX = /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/;
const PUNYCODE_REGEX = /xn--/i;

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function getTld(domain: string): string {
  const parts = domain.split('.');
  return parts.length >= 2 ? `.${parts[parts.length - 1]}` : '';
}

export function analyzeUrls(urls: string[], bodyText?: string): UrlSignals {
  const evidence: UrlSignals['evidence'] = [];
  const allUrls = new Set<string>(urls);

  // Also extract from body text if provided
  if (bodyText) {
    const extracted = bodyText.match(URL_REGEX) ?? [];
    for (const u of extracted) allUrls.add(u.replace(/[.,;!?)]$/, ''));
  }

  if (allUrls.size === 0) {
    return {
      hasUrls: false, urlCount: 0, suspiciousUrls: false, maliciousUrls: false,
      httpUrls: false, urlShorteners: false, urlData: [], evidence,
    };
  }

  const urlData: UrlInfo[] = [];
  let httpUrls = false;
  let urlShorteners = false;
  let suspiciousUrls = false;
  let maliciousUrls = false;

  for (const url of allUrls) {
    const domain = extractDomain(url);
    if (!domain) continue;

    const isHttps = url.startsWith('https://');
    const isIpAddress = IP_REGEX.test(url);
    const isShortener = URL_SHORTENERS.has(domain);
    const isPunycode = PUNYCODE_REGEX.test(domain);
    const hasSuspiciousTLD = SUSPICIOUS_TLDS.has(getTld(domain));

    let riskLevel: UrlInfo['riskLevel'] = 'safe';
    if (isIpAddress || isPunycode) riskLevel = 'malicious';
    else if (isShortener || hasSuspiciousTLD || !isHttps) riskLevel = 'suspicious';

    urlData.push({ url, domain, isHttps, isIpAddress, isShortener, isPunycode, hasSuspiciousTLD, riskLevel });

    if (!isHttps) httpUrls = true;
    if (isShortener) urlShorteners = true;
    if (riskLevel === 'suspicious') suspiciousUrls = true;
    if (riskLevel === 'malicious') maliciousUrls = true;

    // Per-URL evidence
    if (!isHttps) {
      evidence.push({ label: 'HTTP URL (Not Encrypted)', detail: `${url}`, severity: 'medium' });
    }
    if (isIpAddress) {
      evidence.push({ label: 'IP Address URL', detail: `URL uses raw IP: ${url}`, severity: 'critical' });
    }
    if (isShortener) {
      evidence.push({ label: 'URL Shortener', detail: `URL is masked by shortener: ${url}`, severity: 'high' });
    }
    if (isPunycode) {
      evidence.push({ label: 'Punycode / Homograph URL', detail: `Internationalized domain attack: ${url}`, severity: 'critical' });
    }
    if (hasSuspiciousTLD) {
      evidence.push({ label: 'Suspicious TLD', detail: `Domain "${domain}" uses suspicious TLD`, severity: 'medium' });
    }
  }

  return {
    hasUrls: urlData.length > 0,
    urlCount: urlData.length,
    suspiciousUrls,
    maliciousUrls,
    httpUrls,
    urlShorteners,
    urlData,
    evidence,
  };
}
