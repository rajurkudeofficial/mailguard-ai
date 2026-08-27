/**
 * MailGuard AI — Gmail Service
 * Wraps the Gmail REST API for fetching messages, profiles, and headers.
 */

import logger from '../utils/logger';

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailFetch(path: string, accessToken: string): Promise<unknown> {
  const res = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } })) as { error?: { message?: string } };
    throw Object.assign(new Error(err.error?.message ?? `Gmail API error ${res.status}`), { statusCode: res.status });
  }
  return res.json();
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export async function getProfile(accessToken: string): Promise<GmailProfile> {
  return gmailFetch('/profile', accessToken) as Promise<GmailProfile>;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  internalDate: string;
  payload: GmailPayload;
}

export interface GmailPayload {
  partId?: string;
  mimeType: string;
  filename?: string;
  headers: Array<{ name: string; value: string }>;
  body?: { size: number; data?: string };
  parts?: GmailPayload[];
}

export async function getMessage(messageId: string, accessToken: string): Promise<GmailMessage> {
  return gmailFetch(`/messages/${messageId}?format=full`, accessToken) as Promise<GmailMessage>;
}

export interface GmailListResult {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export async function listMessages(
  accessToken: string,
  params: { maxResults?: number; pageToken?: string; q?: string } = {}
): Promise<GmailListResult> {
  const qs = new URLSearchParams();
  if (params.maxResults) qs.set('maxResults', String(params.maxResults));
  if (params.pageToken) qs.set('pageToken', params.pageToken);
  if (params.q) qs.set('q', params.q);
  return gmailFetch(`/messages?${qs}`, accessToken) as Promise<GmailListResult>;
}

export function extractHeader(payload: GmailPayload, name: string): string | undefined {
  return payload.headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;
}

export function extractHeaders(payload: GmailPayload): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of payload.headers) {
    result[h.name] = h.value;
  }
  return result;
}

export function extractBodyText(payload: GmailPayload): string {
  function decode(data: string): string {
    try {
      return Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
    } catch {
      return '';
    }
  }

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decode(payload.body.data);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBodyText(part);
      if (text) return text;
    }
  }

  return '';
}

export function extractAttachments(
  payload: GmailPayload
): Array<{ filename: string; mimeType: string; size: number; attachmentId?: string }> {
  const attachments: Array<{ filename: string; mimeType: string; size: number; attachmentId?: string }> = [];

  function walk(part: GmailPayload) {
    if (part.filename && part.filename.length > 0 && part.body) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size,
        attachmentId: (part.body as Record<string, unknown>).attachmentId as string | undefined,
      });
    }
    if (part.parts) {
      for (const p of part.parts) walk(p);
    }
  }

  walk(payload);
  return attachments;
}

export function extractUrls(bodyText: string): string[] {
  const matches = bodyText.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/gi) ?? [];
  return [...new Set(matches.map((u) => u.replace(/[.,;!?)]$/, '')))];
}

export function parseSenderDomain(senderEmail: string): string {
  const match = senderEmail.match(/@([^>]+)/);
  return match ? match[1].toLowerCase().trim() : '';
}

export async function batchGetMessages(
  messageIds: string[],
  accessToken: string,
  concurrency = 5
): Promise<GmailMessage[]> {
  const results: GmailMessage[] = [];
  for (let i = 0; i < messageIds.length; i += concurrency) {
    const batch = messageIds.slice(i, i + concurrency);
    const fetched = await Promise.allSettled(batch.map((id) => getMessage(id, accessToken)));
    for (const r of fetched) {
      if (r.status === 'fulfilled') results.push(r.value);
      else logger.warn('Failed to fetch message', { error: r.reason });
    }
  }
  return results;
}
