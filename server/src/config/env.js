import 'dotenv/config';

const env = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'careerlens-dev-secret-change-me',
  mongodbUri: process.env.MONGODB_URI || '',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    // 'flash-latest' always resolves to the current Flash model, so the
    // default never goes stale when Google retires old model names.
    model: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || '',
    model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free',
  },
  // Social login (optional). Google: free OAuth client ID from
  // https://console.cloud.google.com (Authorized JavaScript origin must
  // include the client URL, e.g. http://localhost:5173).
  // Apple requires a paid Apple Developer account (Services ID + Key).
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  appleClientId: process.env.APPLE_CLIENT_ID || '',
  // Live job listings (optional, all free):
  //   JSearch (RapidAPI)  — aggregates LinkedIn/Indeed/Glassdoor postings
  //   Adzuna              — India-focused listings   (developer.adzuna.com)
  //   Remotive            — remote jobs, no key needed (always on as fallback)
  jobs: {
    rapidapiKey: process.env.RAPIDAPI_KEY || '',
    adzunaAppId: process.env.ADZUNA_APP_ID || '',
    adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  },
};

export default env;
