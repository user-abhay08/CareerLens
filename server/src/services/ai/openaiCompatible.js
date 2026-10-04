/**
 * OpenAI-compatible provider used for free-tier Groq and OpenRouter APIs.
 * Groq:       https://api.groq.com/openai/v1        (key: https://console.groq.com/keys)
 * OpenRouter: https://openrouter.ai/api/v1          (key: https://openrouter.ai/keys)
 */
import env from '../../config/env.js';

const PROVIDERS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    get apiKey() {
      return env.groq.apiKey;
    },
    get model() {
      return env.groq.model;
    },
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    get apiKey() {
      return env.openrouter.apiKey;
    },
    get model() {
      return env.openrouter.model;
    },
  },
};

function makeProvider(name) {
  return {
    isConfigured() {
      return Boolean(PROVIDERS[name].apiKey);
    },
    info() {
      return { provider: name, model: PROVIDERS[name].model, free: true };
    },
    async chat({ system, user, temperature = 0.4, timeoutMs = 60000 }) {
      const cfg = PROVIDERS[name];
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${cfg.apiKey}`,
          },
          body: JSON.stringify({
            model: cfg.model,
            temperature,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
          }),
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`${name} API ${res.status}: ${body.slice(0, 300)}`);
        }
        const data = await res.json();
        const text = data?.choices?.[0]?.message?.content?.trim();
        if (!text) throw new Error(`${name} returned an empty response`);
        return text;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export const groq = makeProvider('groq');
export const openrouter = makeProvider('openrouter');
