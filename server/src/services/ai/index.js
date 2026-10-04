import { groq, openrouter } from './openaiCompatible.js';

/**
 * Unified AI gateway for CareerLens.
 *
 * Uses a FREE-tier API key (no local models to install):
 *   1. Google Gemini  — GEMINI_API_KEY
 *   2. Groq           — GROQ_API_KEY
 *   3. OpenRouter     — OPENROUTER_API_KEY
 * When no key is configured, callers fall back to the built-in heuristic
 * engine (see services/fallback.js) so the app stays fully demoable.
 */

const providers = { gemini: null, groq, openrouter };

export async function getProvider() {
  if (!providers.gemini) {
    providers.gemini = await import('./gemini.js');
  }
  if (providers.gemini.isConfigured()) return providers.gemini;
  if (providers.groq.isConfigured()) return providers.groq;
  if (providers.openrouter.isConfigured()) return providers.openrouter;
  return null;
}

export async function aiStatus() {
  const provider = await getProvider();
  if (!provider) {
    return {
      enabled: false,
      provider: 'fallback',
      model: 'built-in heuristic engine',
      note: 'No AI key configured — set GEMINI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) in server/.env for AI-powered analysis.',
    };
  }
  return { enabled: true, ...provider.info() };
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
 * Generates a JSON object from the model. Retries once on parse/API failure.
 * @returns {Promise<{ data: object, provider: string }>}
 */
export async function generateJSON(system, user, { temperature = 0.3 } = {}) {
  const provider = await getProvider();
  if (!provider) throw new Error('AI_NOT_CONFIGURED');

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
    }
  }
  throw lastError;
}
