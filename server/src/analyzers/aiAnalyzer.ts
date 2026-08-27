/**
 * MailGuard AI — AI Analyzer (Optional)
 * Generates a human-readable threat narrative using OpenAI or Gemini.
 * Falls back gracefully if no API key is configured.
 */

import config from '../config/env';
import logger from '../utils/logger';

export async function generateAiExplanation(params: {
  subject: string;
  sender: string;
  classification: string;
  riskLevel: string;
  securityScore: number;
  topSignals: string[];
}): Promise<string | null> {
  const { aiProvider, openaiApiKey, geminiApiKey } = config;

  if (!aiProvider) return null;

  const prompt = `You are a cybersecurity analyst. Analyze this email and provide a concise threat assessment in 2-3 sentences.

Email Details:
- Subject: "${params.subject}"
- Sender: "${params.sender}"
- Classification: ${params.classification}
- Risk Level: ${params.riskLevel}
- Security Score: ${params.securityScore}/100 (higher = safer)
- Key Threat Indicators: ${params.topSignals.join(', ')}

Provide a clear, non-technical explanation of why this email is ${params.classification.toLowerCase()} and what the user should do.`;

  try {
    if (aiProvider === 'openai' && openaiApiKey) {
      return await callOpenAI(prompt, openaiApiKey);
    } else if (aiProvider === 'gemini' && geminiApiKey) {
      return await callGemini(prompt, geminiApiKey);
    }
  } catch (err) {
    logger.error('AI analyzer failed', { error: String(err) });
  }

  return null;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    }),
  });
  const data = await res.json() as { choices?: Array<{ message: { content: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  const data = await res.json() as { candidates?: Array<{ content: { parts: Array<{ text: string }> } }> };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}
