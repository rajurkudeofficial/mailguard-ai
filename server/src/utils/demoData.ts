/**
 * MailGuard AI — Demo Data
 * 9 synthetic email categories covering all classification types.
 * Used in APP_MODE=demo so the app works without real Gmail credentials.
 */

export interface DemoEmail {
  id: string;
  gmailMessageId: string;
  threadId: string;
  sender: string;
  senderName: string;
  senderDomain: string;
  replyTo?: string;
  returnPath?: string;
  subject: string;
  snippet: string;
  bodyText: string;
  receivedAt: string;
  headers: Record<string, string>;
  attachments: DemoAttachment[];
  urls: string[];
}

export interface DemoAttachment {
  filename: string;
  mimeType: string;
  size: number;
}

export const DEMO_EMAILS: DemoEmail[] = [
  // ─── 1. PHISHING — credential harvest ────────────────────────────────────
  {
    id: 'demo_001',
    gmailMessageId: 'demo_001',
    threadId: 'thread_001',
    sender: 'security@paypa1.com',
    senderName: 'PayPal Security',
    senderDomain: 'paypa1.com',
    replyTo: 'noreply@phish-collect.ru',
    returnPath: 'bounce@paypa1.com',
    subject: '⚠️ URGENT: Your PayPal account has been limited — Verify now',
    snippet: 'We noticed unusual activity on your PayPal account. Your account access has been limited. Click below to verify your identity...',
    bodyText: `Dear Customer,

We noticed unusual activity on your PayPal account. For your security, we have temporarily limited access to your account.

To restore full access, you must verify your identity within 24 hours or your account will be permanently suspended.

[Verify Account Now]

This is a security requirement. Failure to comply will result in permanent account closure.

PayPal Security Team`,
    receivedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=fail smtp.mailfrom=paypa1.com; dkim=none; dmarc=fail',
      'X-Spam-Status': 'Yes',
      'Received': 'from mail.phish-collect.ru (mail.phish-collect.ru [185.220.101.45])',
    },
    attachments: [],
    urls: ['http://paypa1.com/verify?token=abc123', 'http://bit.ly/2xR4mL'],
  },

  // ─── 2. MALWARE — dangerous attachment ───────────────────────────────────
  {
    id: 'demo_002',
    gmailMessageId: 'demo_002',
    threadId: 'thread_002',
    sender: 'hr@acme-corp-payroll.com',
    senderName: 'ACME HR Department',
    senderDomain: 'acme-corp-payroll.com',
    subject: 'Your Q3 Salary Slip — Action Required',
    snippet: 'Please find your salary slip for Q3 attached. Open the document to review and confirm your bank details for next month...',
    bodyText: `Dear Employee,

Please find your Q3 salary slip attached. Please open the document to review your payment details and confirm your bank account information for next month's payroll.

Please enable macros when prompted to view the full document.

Kind regards,
HR Department`,
    receivedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=softfail smtp.mailfrom=acme-corp-payroll.com; dkim=none; dmarc=fail',
    },
    attachments: [
      { filename: 'Salary_Slip_Q3.doc.exe', mimeType: 'application/x-msdownload', size: 245760 },
    ],
    urls: [],
  },

  // ─── 3. SPAM — prize scam ────────────────────────────────────────────────
  {
    id: 'demo_003',
    gmailMessageId: 'demo_003',
    threadId: 'thread_003',
    sender: 'winner@lottery-international-prize.com',
    senderName: 'International Lottery Commission',
    senderDomain: 'lottery-international-prize.com',
    subject: 'CONGRATULATIONS! You have won $1,000,000 — Claim Now!!!',
    snippet: 'You have been selected as the winner of our international lottery. To claim your prize of $1,000,000 please contact us immediately...',
    bodyText: `CONGRATULATIONS LUCKY WINNER!

You have been randomly selected as the WINNER of our $1,000,000 International Lottery Prize!

To claim your prize you must:
1. Reply with your full name, address, and bank details
2. Pay a small $50 processing fee
3. Your prize will be transferred within 48 hours!

Contact our claims agent IMMEDIATELY: agent@prize-claims.net

THIS OFFER EXPIRES IN 24 HOURS!!!`,
    receivedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=none; dkim=none; dmarc=none',
      'X-Spam-Score': '9.5',
    },
    attachments: [],
    urls: ['http://prize-claims.net/claim?id=WIN2024'],
  },

  // ─── 4. SUSPICIOUS — BEC / impersonation ─────────────────────────────────
  {
    id: 'demo_004',
    gmailMessageId: 'demo_004',
    threadId: 'thread_004',
    sender: 'ceo@your-company.co',
    senderName: 'John Smith (CEO)',
    senderDomain: 'your-company.co',
    replyTo: 'jsmith.exec@gmail.com',
    subject: 'Urgent Wire Transfer — Confidential',
    snippet: 'I need you to process an urgent wire transfer of $85,000 to one of our new vendors. This is time-sensitive and confidential...',
    bodyText: `Hi,

I need you to process an urgent wire transfer today. This is extremely time-sensitive.

Amount: $85,000
Account: First National Bank
Routing: 021000021
Account: 4567890123

This deal is confidential — do not discuss with anyone until it closes. Reply to confirm you can handle this immediately.

Thanks,
John Smith
CEO`,
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=pass smtp.mailfrom=your-company.co; dkim=fail; dmarc=fail',
    },
    attachments: [],
    urls: [],
  },

  // ─── 5. SAFE — legitimate Google security alert ──────────────────────────
  {
    id: 'demo_005',
    gmailMessageId: 'demo_005',
    threadId: 'thread_005',
    sender: 'no-reply@accounts.google.com',
    senderName: 'Google',
    senderDomain: 'accounts.google.com',
    subject: 'Security alert: New sign-in on Windows',
    snippet: 'We noticed a new sign-in to your Google Account from a Windows device. If this was you, you can ignore this email...',
    bodyText: `Security alert

New sign-in on Windows

We noticed a new sign-in to your Google Account from a Windows device in Mumbai, India.

If this was you, you can ignore this email.

If this wasn't you, take action at myaccount.google.com/security

Google LLC, 1600 Amphitheatre Pkwy, Mountain View, CA 94043`,
    receivedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=pass smtp.mailfrom=accounts.google.com; dkim=pass header.d=accounts.google.com; dmarc=pass',
      'DKIM-Signature': 'd=accounts.google.com; s=20210112',
    },
    attachments: [],
    urls: ['https://myaccount.google.com/security', 'https://support.google.com/accounts'],
  },

  // ─── 6. PHISHING — fake bank alert ───────────────────────────────────────
  {
    id: 'demo_006',
    gmailMessageId: 'demo_006',
    threadId: 'thread_006',
    sender: 'alerts@hdfc-bank-secure.net',
    senderName: 'HDFC Bank',
    senderDomain: 'hdfc-bank-secure.net',
    subject: 'ALERT: Suspicious transaction detected — OTP Required',
    snippet: 'A suspicious transaction of ₹45,000 has been attempted on your account. Enter your OTP to block this transaction immediately...',
    bodyText: `Dear HDFC Bank Customer,

A suspicious transaction of ₹45,000 has been attempted on your account ending in **4521**.

To BLOCK this transaction immediately, please verify your identity:

[BLOCK TRANSACTION - ENTER OTP]

Your OTP will be sent to your registered mobile. You must act within 10 minutes.

If you authorized this transaction, you can ignore this message.

HDFC Bank Security Team`,
    receivedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=fail; dkim=none; dmarc=fail',
    },
    attachments: [],
    urls: ['http://hdfc-bank-secure.net/block?otp=1', 'http://tinyurl.com/hdfc-verify'],
  },

  // ─── 7. SAFE — legitimate newsletter ─────────────────────────────────────
  {
    id: 'demo_007',
    gmailMessageId: 'demo_007',
    threadId: 'thread_007',
    sender: 'weekly@github.com',
    senderName: 'GitHub',
    senderDomain: 'github.com',
    subject: 'GitHub Trending: Top repositories this week',
    snippet: 'Discover what the GitHub community is most excited about this week. See trending repositories across all programming languages...',
    bodyText: `GitHub Trending — Week of August 2025

Top Repositories This Week

⭐ microsoft/TypeScript — 12,432 stars this week
⭐ vercel/next.js — 8,901 stars this week
⭐ openai/openai-python — 7,234 stars this week

Explore all trending repositories: https://github.com/trending

You're receiving this email because you signed up for GitHub Trending.
Unsubscribe: https://github.com/settings/notifications`,
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=pass smtp.mailfrom=github.com; dkim=pass header.d=github.com; dmarc=pass',
      'List-Unsubscribe': '<https://github.com/settings/notifications>',
    },
    attachments: [],
    urls: ['https://github.com/trending', 'https://github.com/settings/notifications'],
  },

  // ─── 8. MALWARE — invoice with macro ─────────────────────────────────────
  {
    id: 'demo_008',
    gmailMessageId: 'demo_008',
    threadId: 'thread_008',
    sender: 'billing@invoice-sys.biz',
    senderName: 'Invoice System',
    senderDomain: 'invoice-sys.biz',
    subject: 'Invoice #INV-2024-8871 — Payment Due Immediately',
    snippet: 'Please find attached invoice #INV-2024-8871 for $12,450. Payment is overdue. Open the attachment for details...',
    bodyText: `Dear Accounts Department,

Please find attached Invoice #INV-2024-8871 for services rendered.

Amount Due: $12,450.00
Due Date: OVERDUE

Please open the attached invoice and process payment immediately to avoid service suspension.

Note: You may need to enable editing and macros to view the full invoice.

Regards,
Billing Department`,
    receivedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=softfail; dkim=none; dmarc=fail',
    },
    attachments: [
      { filename: 'Invoice_INV-2024-8871.xlsm', mimeType: 'application/vnd.ms-excel.sheet.macroEnabled.12', size: 87040 },
    ],
    urls: ['http://invoice-sys.biz/download'],
  },

  // ─── 9. SAFE — legitimate Amazon order ───────────────────────────────────
  {
    id: 'demo_009',
    gmailMessageId: 'demo_009',
    threadId: 'thread_009',
    sender: 'order-update@amazon.in',
    senderName: 'Amazon',
    senderDomain: 'amazon.in',
    subject: 'Your Amazon order #402-1234567-8901234 has been shipped',
    snippet: 'Great news! Your order has been shipped and is on its way. Track your package to get real-time updates...',
    bodyText: `Hello,

Your order has been shipped!

Order #402-1234567-8901234
Estimated Delivery: Tomorrow by 8 PM

Items:
• USB-C Hub 7-in-1 — Qty: 1

Track your package: https://www.amazon.in/progress-tracker/package/ref=ppx_yo_dt_b_track_pkg

Thanks for shopping with us,
Amazon.in`,
    receivedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    headers: {
      'Authentication-Results': 'spf=pass smtp.mailfrom=amazon.in; dkim=pass header.d=amazon.in; dmarc=pass',
    },
    attachments: [],
    urls: ['https://www.amazon.in/progress-tracker/package/ref=ppx_yo_dt_b_track_pkg'],
  },
];

export function getDemoEmailById(id: string): DemoEmail | undefined {
  return DEMO_EMAILS.find((e) => e.id === id);
}
