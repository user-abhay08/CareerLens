/**
 * Google Gemini provider (free tier — key from https://aistudio.google.com/app/apikey).
 * Plain REST call, no SDK needed.
 *
 * If the configured model is overloaded (429/5xx — common on free-tier peak
 * models), the request is retried on progressively lighter models before
 * failing. Auth/config errors (400/401/403/404) fail immediately so a bad
 * key is surfaced right away.
 */
import env from '../../config/env.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Used only when the primary model returns a capacity or availability error.
const FALLBACK_MODELS = ['gemini-3.5-flash-lite', 'gemini-2.5-flash', 'gemini-3.7-flash'];

export function isConfigured() {
  return Boolean(env.gemini.apiKey);
}

export function info() {
  return { provider: 'gemini', model: env.gemini.model, free: true };
}

async function callModel(model, { system, user, temperature, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/${model}:generateContent`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.gemini.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned an empty response');
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function chat({ system, user, temperature = 0.4, timeoutMs = 20000 }) {
  const models = [env.gemini.model, ...FALLBACK_MODELS.filter((m) => m !== env.gemini.model)];
  let lastError;
  for (const model of models) {
    try {
      return await callModel(model, { system, user, temperature, timeoutMs });
    } catch (err) {
      lastError = err;
      const isRetryable = /\b(429|500|503)\b|overloaded|high demand|quota|abort|timeout|empty response/i.test(err.message);
      if (!isRetryable) throw err;
      console.warn(`[ai] ${model} unavailable (${err.message.slice(0, 60)}), trying next model…`);
    }
  }
  throw lastError;
}
