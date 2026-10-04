import { useEffect, useState } from 'react';

let cached = null;

/** Fetches the AI provider status once and caches it for the session. */
export function useAiStatus() {
  const [status, setStatus] = useState(cached);

  useEffect(() => {
    if (cached) return;
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((data) => {
        cached = data;
        setStatus(data);
      })
      .catch(() => {});
  }, []);

  return status;
}

export default function AiModeBanner() {
  const status = useAiStatus();
  if (!status || status.enabled) return null;
  return (
    <div className="banner-warn mb-6">
      <span className="mt-0.5">⚡</span>
      <p>
        <span className="font-bold">Demo mode</span> — no AI key configured, so analysis uses the built-in heuristic engine. Add a free{' '}
        <span className="font-bold">GEMINI_API_KEY</span> to <code className="rounded bg-amber-100 px-1 font-mono text-xs">server/.env</code> to unlock
        AI-powered results.
      </p>
    </div>
  );
}
