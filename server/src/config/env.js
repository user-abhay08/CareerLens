import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.resolve(__dirname, '..', '..');
const rootDir = path.resolve(serverDir, '..');

// Load environment files from server or root, with .env.example fallback
const candidatePaths = [
  path.join(serverDir, '.env'),
  path.join(rootDir, '.env'),
  path.join(serverDir, '.env.example'),
  path.join(rootDir, '.env.example'),
];

for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
  }
}

const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'careerlens-dev-secret-change-me',
  // PostgreSQL + pgvector primary database (Synopsis specification)
  postgresUri: process.env.POSTGRES_URI || process.env.DATABASE_URL || '',
  mongodbUri: process.env.MONGODB_URI || '',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  },
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  jobs: {
    rapidapiKey: process.env.RAPIDAPI_KEY || '',
  },
};

export default env;
