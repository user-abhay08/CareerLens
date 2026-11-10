import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..', '..');
const rootDir = path.resolve(serverDir, '..');

// Load environment files from server or root (.env / .env.local only — never .env.example)
const candidatePaths = [
  path.join(serverDir, '.env'),
  path.join(serverDir, '.env.local'),
  path.join(rootDir, '.env'),
  path.join(rootDir, '.env.local'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const PLACEHOLDER_KEY_RE = /^(add[-_]?your[-_]?key([-_]?here)?|your[-_]?.*key.*|(insert|enter)[-_]?your[-_]?key.*|replace[-_]?me|changeme|placeholder|<.*>|xxx+)$/i;
const MODEL_ALIASES = {
  'gemini-flash-lite': 'gemini-flash-lite-latest',
};

function cleanEnv(value) {
  return String(value || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
}

function readApiKey(...values) {
  for (const raw of values) {
    const cleaned = cleanEnv(raw);
    if (cleaned && !PLACEHOLDER_KEY_RE.test(cleaned)) return cleaned;
  }
  return '';
}

function readGeminiModel() {
  const configured = cleanEnv(process.env.GEMINI_MODEL);
  if (!configured) return 'gemini-3.5-flash';
  return MODEL_ALIASES[configured.toLowerCase()] || configured;
}

const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'careerlens-dev-secret-change-me',
  // PostgreSQL + pgvector primary database (Synopsis specification)
  postgresUri: process.env.POSTGRES_URI || process.env.DATABASE_URL || '',
  mongodbUri: process.env.MONGODB_URI || '',
  gemini: {
    get apiKey() {
      return readApiKey(
        process.env.GEMINI_API_KEY,
        process.env.GOOGLE_API_KEY,
        process.env.VITE_GEMINI_API_KEY
      );
    },
    get model() {
      return readGeminiModel();
    },
  },
  groq: {
    apiKey: readApiKey(process.env.GROQ_API_KEY),
    model: cleanEnv(process.env.GROQ_MODEL) || 'llama-3.3-70b-versatile',
  },
  openrouter: {
    apiKey: readApiKey(process.env.OPENROUTER_API_KEY),
    model: cleanEnv(process.env.OPENROUTER_MODEL) || 'meta-llama/llama-3.3-70b-instruct:free',
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  jobs: {
    rapidapiKey: process.env.RAPIDAPI_KEY || '',
  },
};

export default env;
