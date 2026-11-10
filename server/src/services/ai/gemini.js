/**
 * Google Gemini provider (free tier — key from https://aistudio.google.com/app/apikey).
 * Plain REST call against v1beta using the ?key=... query parameter, no SDK needed.
 *
 * If the configured model is unavailable or overloaded (404/429/5xx), the request
 * is retried across valid fallback models before failing. Auth/key errors (400/401/403
 * with invalid key) fail immediately so a bad key is surfaced cleanly.
 */
import env from '../../config/env.js';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Fallback models ordered from active free-tier fast models to compatibility models.
const FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const VALIDATION_TTL_MS = 10 * 60 * 1000;
let cachedValidation = null; // { key, valid, reason, message, checkedAt }

export function isConfigured() {
  return Boolean(env.gemini.apiKey);
}

export function isKnownInvalidKey() {
  const key = env.gemini.apiKey;
  return Boolean(
    key &&
      cachedValidation &&
      cachedValidation.key === key &&
      cachedValidation.valid === false &&
      cachedValidation.reason === 'invalid_key'
  );
}

export function info() {
  return { provider: 'gemini', model: env.gemini.model, free: true };
}

function parseErrorBody(rawBody) {
  try {
    const parsed = JSON.parse(rawBody);
    return {
      message: parsed?.error?.message || rawBody,
      status: parsed?.error?.status || '',
    };
  } catch {
    return { message: rawBody, status: '' };
  }
}

function isInvalidKeyError(httpStatus, apiStatus, apiMessage) {
  if (httpStatus === 401) return true;
  if (httpStatus === 400 || httpStatus === 403) {
    return /api key not valid|api_key_invalid|invalid.*api.?key|api.?key.*expired|unregistered callers/i.test(
      `${apiStatus} ${apiMessage}`
    );
  }
  return false;
}

function makeInvalidKeyError(apiKey, apiMessage) {
  cachedValidation = {
    key: apiKey,
    valid: false,
    reason: 'invalid_key',
    message: apiMessage || 'API key not valid.',
    checkedAt: Date.now(),
  };
  const err = new Error('Gemini API key is invalid or expired. Please provide a valid GEMINI_API_KEY.');
  err.code = 'AI_KEY_INVALID';
  return err;
}

/**
 * Validates the configured Gemini API key once (cached per key) against v1beta.
 * Fails open on network timeouts/offline errors so transient connectivity issues
 * do not prematurely disable AI calls.
 */
export async function validateKey() {
  const apiKey = env.gemini.apiKey;
  if (!apiKey) {
    return { valid: false, reason: 'missing_key' };
  }
  if (
    cachedValidation &&
    cachedValidation.key === apiKey &&
    (cachedValidation.valid === false || Date.now() - cachedValidation.checkedAt < VALIDATION_TTL_MS)
  ) {
    return cachedValidation;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(apiKey)}&pageSize=1`, {
      signal: controller.signal,
    });
    if (res.ok) {
      cachedValidation = { key: apiKey, valid: true, reason: null, checkedAt: Date.now() };
      return cachedValidation;
    }
    const rawBody = await res.text().catch(() => '');
    const { message, status } = parseErrorBody(rawBody);
    if (isInvalidKeyError(res.status, status, message)) {
      cachedValidation = {
        key: apiKey,
        valid: false,
        reason: 'invalid_key',
        message,
        checkedAt: Date.now(),
      };
      return cachedValidation;
    }
    return { key: apiKey, valid: true, reason: null, unverified: true };
  } catch {
    return { key: apiKey, valid: true, reason: null, unverified: true };
  } finally {
    clearTimeout(timer);
  }
}

async function callModel(model, { system, user, temperature, timeoutMs }) {
  const apiKey = env.gemini.apiKey;
  if (!apiKey) {
    const err = new Error('AI_NOT_CONFIGURED');
    err.code = 'AI_NOT_CONFIGURED';
    throw err;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature, maxOutputTokens: 4096 },
      }),
    });
    if (!res.ok) {
      const rawBody = await res.text().catch(() => '');
      const { message, status } = parseErrorBody(rawBody);
      if (isInvalidKeyError(res.status, status, message)) {
        throw makeInvalidKeyError(apiKey, message);
      }
      throw new Error(`Gemini API ${res.status}: ${message.slice(0, 200)}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned an empty response');
    cachedValidation = { key: apiKey, valid: true, reason: null, checkedAt: Date.now() };
    return text;
  } finally {
    clearTimeout(timer);
  }
}

export async function chat({ system, user, temperature = 0.4, timeoutMs = 30000 }) {
  if (isKnownInvalidKey()) {
    const err = new Error('Gemini API key is invalid or expired. Please provide a valid GEMINI_API_KEY.');
    err.code = 'AI_KEY_INVALID';
    throw err;
  }

  const models = [env.gemini.model, ...FALLBACK_MODELS.filter((m) => m !== env.gemini.model)];
  let lastError;
  for (const model of models) {
    try {
      return await callModel(model, { system, user, temperature, timeoutMs });
    } catch (err) {
      lastError = err;
      if (err.code === 'AI_KEY_INVALID' || err.code === 'AI_NOT_CONFIGURED') throw err;
      const isRetryable = /\b(404|429|500|503)\b|not_found|not found|overloaded|high demand|quota|abort|timeout|empty response/i.test(err.message);
      if (!isRetryable) throw err;
      console.warn(`[ai] ${model} unavailable (${err.message.slice(0, 60)}), trying next model…`);
    }
  }
  throw lastError;
}
