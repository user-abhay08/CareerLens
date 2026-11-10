import { useEffect, useState } from 'react';

let cached = null;
const listeners = new Set();

function notifyListeners(next) {
  cached = next;
  listeners.forEach((fn) => fn(next));
}

/** Forces a fresh /api/ai-status check and updates mounted banners. */
export function refreshAiStatus() {
  return fetch('/api/ai-status')
    .then((r) => r.json())
    .then((data) => {
      notifyListeners(data);
      return data;
    })
    .catch(() => null);
}

/** Fetches the AI provider status once and caches it for the session. */
export function useAiStatus() {
  const [status, setStatus] = useState(cached);

  useEffect(() => {
    listeners.add(setStatus);
    if (!cached) {
      refreshAiStatus();
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return status;
}

export default function AiModeBanner() {
  const status = useAiStatus();
  if (!status || status.enabled) return null;

  const isInvalidKey = status.reason === 'invalid_key';

  return (
    <div className="banner-warn mb-6" role="status">
      <span className="mt-0.5">{isInvalidKey ? '⚠️' : '⚡'}</span>
      <p>
        {isInvalidKey ? (
          <>
            <span className="font-bold">Gemini API key invalid</span> — the configured{' '}
            <span className="font-bold">GEMINI_API_KEY</span> could not be verified. Provide a valid key in{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">server/.env</code> (or environment settings) and restart the server.
            Built-in heuristic analysis remains active.
          </>
        ) : (
          <>
            <span className="font-bold">Demo mode</span> — no AI key configured, so analysis uses the built-in heuristic engine. Provide a free{' '}
            <span className="font-bold">GEMINI_API_KEY</span> in{' '}
            <code className="rounded bg-amber-100 px-1 font-mono text-xs">server/.env</code> (or environment settings) to unlock AI-powered results.
          </>
        )}
      </p>
    </div>
  );
}
