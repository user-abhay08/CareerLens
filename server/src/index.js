import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import env from './config/env.js';
import { aiStatus } from './services/ai/index.js';

async function main() {
  await connectDB();
  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] CareerLens API listening on http://localhost:${env.port}`);
  });
  const status = await aiStatus();
  if (status.enabled) {
    console.log(`[ai] Provider: ${status.provider} (${status.model}) — free-tier API`);
  } else {
    console.log('[ai] No API key configured — running in built-in fallback mode.');
    console.log('     Add GEMINI_API_KEY (or GROQ_API_KEY / OPENROUTER_API_KEY) to server/.env for AI analysis.');
  }
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
