/**
 * MailGuard AI — Content Analyzer
 * Detects phishing patterns in email body text:
 * - Urgency language
 * - Threats / warnings
 * - Credential requests (OTP, password, SSN)
 * - Financial requests
 * - Prize / lottery scam patterns
 * - Impersonation phrases
 * - BEC patterns
 */

export interface ContentSignals {
  urgencyLanguage: boolean;
  threatLanguage: boolean;
  credentialRequest: boolean;
  financialRequest: boolean;
  otpRequest: boolean;
  fakeInvoice: boolean;
  prizeScam: boolean;
  impersonation: boolean;
  contentKeywords: string[];
  evidence: Array<{ label: string; detail: string; severity: 'low' | 'medium' | 'high' | 'critical' }>;
}

// Pattern definitions: [regex, label, severity]
const PATTERNS: Array<[RegExp, string, ContentSignals['evidence'][number]['severity'], keyof ContentSignals]> = [
  // Urgency
  [/\b(urgent|immediately|right now|expires? (in|within)|act now|limited time|last chance|don'?t delay|time.?sensitive|deadline|final notice|account (suspended|closed|limited|blocked)|respond (today|immediately|asap)|within \d+ (hours?|minutes?)|24.hour|48.hour)\b/gi, 'Urgency Language', 'medium', 'urgencyLanguage'],

  // Threats
  [/\b(your (account|access) (will be|has been) (suspended|terminated|blocked|closed|disabled|deleted)|permanently (suspend|delete|close|block|terminate)|legal action|law enforcement|police|arrest|penalty|fine|lawsuit|debt collector|collections agency)\b/gi, 'Threat Language', 'high', 'threatLanguage'],

  // Credential requests
  [/\b(enter (your )?password|verify (your )?(identity|account|email|phone|details)|confirm (your )?(credentials|login|account)|username.{0,20}password|social security|ssn|mother'?s maiden name|security (question|answer)|pin number|credit card (number|details|info)|cvv|card number)\b/gi, 'Credential Request', 'critical', 'credentialRequest'],

  // OTP requests
  [/\b(otp|one.time (password|code|pin)|verification code|auth(entication)? code|2fa code|security code|sms code)\b/gi, 'OTP Request', 'high', 'otpRequest'],

  // Financial
  [/\b(wire transfer|bank (transfer|account|routing)|ach (transfer|payment)|western union|money ?gram|bitcoin|crypto(currency)?|gift card|itunes card|google play card|amazon gift card|send ?(money|payment|funds)|payment (required|due|overdue)|invoice (attached|enclosed)|processing fee|claim (your )?prize)\b/gi, 'Financial Request', 'high', 'financialRequest'],

  // Prize/lottery scam
  [/\b(congratulations|you('ve| have) (won|been selected|been chosen)|lottery (winner|prize)|prize (money|fund)|claim (your )?(prize|winnings|reward)|lucky (winner|draw)|million (dollar|pound|euro)|sweepstakes|jackpot)\b/gi, 'Prize/Lottery Scam', 'high', 'prizeScam'],

  // Fake invoice
  [/\b(invoice.{0,30}(attached|enclosed|overdue|payment|due)|payment.{0,20}(overdue|due|invoice|required)|remittance advice|payment reminder|outstanding (balance|invoice|amount))\b/gi, 'Fake Invoice Pattern', 'medium', 'fakeInvoice'],

  // Impersonation
  [/\b(microsoft (security|team|support)|apple (security|id|support)|google (security|account)|facebook (security|team)|amazon (security|customer)|paypal (security|team)|your it (department|team|support)|hr department|ceo|chief executive|board of directors|legal department)\b/gi, 'Impersonation', 'high', 'impersonation'],
];

export function analyzeContent(text: string): ContentSignals {
  const evidence: ContentSignals['evidence'] = [];
  const matchedKeywords: Set<string> = new Set();

  const signals: Partial<ContentSignals> = {
    urgencyLanguage: false,
    threatLanguage: false,
    credentialRequest: false,
    financialRequest: false,
    otpRequest: false,
    fakeInvoice: false,
    prizeScam: false,
    impersonation: false,
  };

  for (const [pattern, label, severity, key] of PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      (signals as Record<string, boolean>)[key as string] = true;
      const uniqueMatches = [...new Set(matches.map((m) => m.toLowerCase()))].slice(0, 5);
      uniqueMatches.forEach((m) => matchedKeywords.add(m));
      evidence.push({
        label,
        detail: `Matched phrases: ${uniqueMatches.join(', ')}`,
        severity,
      });
    }
  }

  return {
    urgencyLanguage: signals.urgencyLanguage ?? false,
    threatLanguage: signals.threatLanguage ?? false,
    credentialRequest: signals.credentialRequest ?? false,
    financialRequest: signals.financialRequest ?? false,
    otpRequest: signals.otpRequest ?? false,
    fakeInvoice: signals.fakeInvoice ?? false,
    prizeScam: signals.prizeScam ?? false,
    impersonation: signals.impersonation ?? false,
    contentKeywords: [...matchedKeywords],
    evidence,
  };
}
