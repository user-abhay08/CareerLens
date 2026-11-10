import { groq, openrouter } from './openaiCompatible.js';

/**
 * Unified AI gateway for CareerLens.
 *
 * Uses a FREE-tier API key (no local models to install):
 *   1. Google Gemini  — GEMINI_API_KEY
 *   2. Groq           — GROQ_API_KEY
 *   3. OpenRouter     — OPENROUTER_API_KEY
 * When no key is configured or a key is invalid, callers fall back to the built-in
 * heuristic engine (see services/fallback.js) so the app stays fully functional.
 */

const providers = { gemini: null, groq, openrouter };

async function ensureGeminiLoaded() {
  if (!providers.gemini) {
    providers.gemini = await import('./gemini.js');
  }
}

export async function getProvider() {
  await ensureGeminiLoaded();
  if (providers.gemini.isConfigured() && !providers.gemini.isKnownInvalidKey()) {
    return providers.gemini;
  }
  if (providers.groq.isConfigured()) return providers.groq;
  if (providers.openrouter.isConfigured()) return providers.openrouter;
  return null;
}

export async function aiStatus() {
  await ensureGeminiLoaded();

  if (providers.gemini.isConfigured()) {
    const check = await providers.gemini.validateKey();
    if (check.valid) {
      return { enabled: true, ...providers.gemini.info() };
    }
    if (providers.groq.isConfigured()) return { enabled: true, ...providers.groq.info() };
    if (providers.openrouter.isConfigured()) return { enabled: true, ...providers.openrouter.info() };
    return {
      enabled: false,
      provider: 'fallback',
      reason: 'invalid_key',
      configuredProvider: 'gemini',
      model: 'built-in heuristic engine',
      note: 'Configured GEMINI_API_KEY is invalid. Add a valid GEMINI_API_KEY in server/.env (or environment settings) and restart the server.',
    };
  }

  if (providers.groq.isConfigured()) return { enabled: true, ...providers.groq.info() };
  if (providers.openrouter.isConfigured()) return { enabled: true, ...providers.openrouter.info() };

  return {
    enabled: false,
    provider: 'fallback',
    reason: 'missing_key',
    model: 'built-in heuristic engine',
    note: 'No AI key configured — set GEMINI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) in server/.env for AI-powered analysis.',
  };
}

/** Formats a clean, non-blocking fallback notice without exposing raw JSON errors. */
export function formatAiFallbackNotice(err, fallbackLabel = 'built-in heuristic results') {
  if (!err || err.message === 'AI_NOT_CONFIGURED' || err.code === 'AI_NOT_CONFIGURED') {
    return undefined;
  }
  if (err.code === 'AI_KEY_INVALID' || /api key not valid|api_key_invalid/i.test(err.message)) {
    return `Gemini API key is missing or invalid. Please provide a valid GEMINI_API_KEY in server/.env or environment settings — showing ${fallbackLabel} instead.`;
  }
  const shortReason = String(err.message || 'AI service unavailable').replace(/\s+/g, ' ').slice(0, 120);
  return `AI service temporarily unavailable (${shortReason}). Showing ${fallbackLabel} instead.`;
}

function extractJSON(text) {
  let t = text.trim();
  // Strip markdown code fences the model may add.
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('No JSON object found in AI response');
  return JSON.parse(t.slice(start, end + 1));
}

/**
 * Generates a JSON object from the model. Retries once on parse/transient API failure.
 * @returns {Promise<{ data: object, provider: string }>}
 */
export async function generateJSON(system, user, { temperature = 0.3 } = {}) {
  const provider = await getProvider();
  if (!provider) {
    if (providers.gemini?.isKnownInvalidKey?.()) {
      const err = new Error('Gemini API key is invalid or expired. Please provide a valid GEMINI_API_KEY.');
      err.code = 'AI_KEY_INVALID';
      throw err;
    }
    throw new Error('AI_NOT_CONFIGURED');
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await provider.chat({
        system,
        user: attempt === 0 ? user : `${user}\n\nIMPORTANT: Output ONLY a single valid JSON object matching the requested schema. No markdown, no commentary.`,
        temperature: attempt === 0 ? temperature : 0.1,
      });
      return { data: extractJSON(raw), provider: provider.info().provider };
    } catch (err) {
      lastError = err;
      if (err.code === 'AI_KEY_INVALID' || err.code === 'AI_NOT_CONFIGURED') {
        throw err;
      }
    }
  }
  throw lastError;
}
