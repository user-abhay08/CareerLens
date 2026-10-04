# 🔭 CareerLens — AI Career Guidance Platform

CareerLens is a full-stack web app that acts like a personal career counselor: it analyzes your
resume, matches you to careers that fit your profile, builds a skill-gap learning roadmap for your
target role, and drills you with graded mock interviews.

**Instead of running local ML models, all analysis is powered by free-tier AI APIs** (Google Gemini,
Groq, or OpenRouter) — nothing to install, no GPU needed. If no key is configured, a built-in
heuristic engine keeps every feature working, so the app is always demoable.

---

## ✨ Features

| Feature | What it does |
|---|---|
| 📄 **Resume Analyzer** | Upload a PDF or paste text → ATS score, strengths, weaknesses, missing skills, ATS keywords, suggested roles, and rewritten bullet points |
| 🎯 **Career Matching** | Top 5 careers ranked by fit with your skills/interests, with match %, reasons, salary range and demand signal |
| 💼 **Live job listings** | Real openings per role with one-click "Apply on portal" links. Provider chain: JSearch (RapidAPI — includes **LinkedIn**, Indeed, Glassdoor) → Adzuna (India market) → Remotive (remote, no key needed) → deep search links into LinkedIn / Naukri / Indeed |
| 🗺️ **Skill Roadmap** | Pick any target role → 4-phase learning plan (weeks 1–20) that skips what you already know, with free resources and milestones |
| 🎤 **Interview Prep** | Role-specific question sets (easy/medium/hard) → answer in your own words → instant score /10, strengths, improvements and a polished model answer |
| 📊 **Dashboard** | Aggregated progress: resumes analyzed, latest ATS score, top career match, active roadmap, average interview score |
| 🔐 **Auth & Profiles** | JWT auth (bcrypt-hashed passwords), rich profile with skills/interests/education/experience that feeds every analysis |
| 🌐 **Social sign-in** | "Continue with Google" (free OAuth client ID) and "Continue with Apple" buttons on the login/register pages — see *Social sign-in setup* below |

## 🧰 Tech stack

- **Frontend:** React 18 + Vite + Tailwind CSS v4 + React Router
- **Backend:** Node.js + Express + Mongoose (MongoDB) + Zod + JWT + Multer + pdf-parse
- **AI:** free-tier REST APIs — Google Gemini / Groq / OpenRouter (provider abstraction, no SDKs) + offline heuristic fallback
- **Database:** any MongoDB (Atlas free tier) — or zero-setup auto-provisioned in-memory MongoDB for dev

## 🚀 Quick start

```bash
# 1. Install everything (root + server + client)
npm run setup

# 2. Configure the AI key (optional but recommended — see below)
cp server/.env.example server/.env

# 3. Run both servers
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000/api

That's it. With no AI key the app runs in **Demo mode** (built-in heuristic engine, clearly
badged in the UI). Add a free key to unlock real AI analysis — the server picks it up on restart.

## 🔑 Getting a FREE AI API key (1–2 minutes)

Only **one** key is needed. Pick any of these free options and paste the key into `server/.env`:

| Provider | Get a key | Env var | Notes |
|---|---|---|---|
| **Google Gemini** (recommended) | https://aistudio.google.com/app/apikey | `GEMINI_API_KEY` | Generous free tier, no credit card |
| Groq | https://console.groq.com/keys | `GROQ_API_KEY` | Very fast Llama models, free tier |
| OpenRouter | https://openrouter.ai/keys | `OPENROUTER_API_KEY` | Has `:free` model variants |

`server/.env`:

```env
GEMINI_API_KEY=your_key_here          # option 1 (recommended)
# GROQ_API_KEY=...                    # option 2
# OPENROUTER_API_KEY=...              # option 3
JWT_SECRET=any-long-random-string
# MONGODB_URI=...                     # optional, see below
```

Restart the server (`npm run dev`). Check `GET http://localhost:5000/api/ai-status` — it reports
the active provider. If an AI call ever fails (quota, network), CareerLens automatically serves the
heuristic result with a warning banner instead of breaking.

## 🗄️ Database (optional)

Out of the box the API auto-starts a **throwaway in-memory MongoDB** (downloaded on first run) —
perfect for demos; data resets when the server restarts. For persistence, create a free
[MongoDB Atlas](https://www.mongodb.com/atlas) cluster and set:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/careerlens
```

## 📁 Project structure

```
CarrerLens/
├── server/                  # Express + Mongoose API
│   └── src/
│       ├── config/          # env + DB (Atlas or auto in-memory)
│       ├── models/          # User, Profile, ResumeAnalysis, Recommendation, Roadmap, InterviewSession
│       ├── routes/          # auth, profile, resume, careers, interview, misc
│       ├── services/
│       │   ├── ai/          # free-API gateway: gemini.js, openaiCompatible.js, prompts.js
│       │   ├── fallback.js  # offline heuristic engine (no-key demo mode)
│       │   └── knowledge.js # career/skill knowledge base
│       └── middleware/      # JWT auth + error handler
├── client/                  # React + Vite + Tailwind v4 SPA
│   └── src/pages/           # Landing, Login/Register, Dashboard, Profile, Resume, Careers, Roadmap, Interview
├── scripts/
│   ├── smoke.mjs            # end-to-end API test (24 checks)
│   └── make-test-pdf.mjs    # test fixture generator
└── package.json             # root scripts: setup / dev / build
```

## 🔌 API overview

| Method & path | Purpose |
|---|---|
| `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` | JWT auth |
| `GET/PUT /api/profile` | Profile (skills, interests, education, experience) |
| `POST /api/resume/analyze` | Multipart PDF upload **or** JSON `{ text, roleContext }` |
| `GET /api/resume` · `GET /api/resume/:id` | Analysis history |
| `POST /api/careers/recommend` · `GET /api/careers/recommendations` | Career matching |
| `POST /api/careers/roadmap` · `GET /api/careers/roadmaps[/:id]` | Skill-gap roadmaps |
| `POST /api/interview/sessions` · `POST /api/interview/sessions/:id/answer` · `GET /api/interview/sessions` | Mock interviews |
| `GET /api/dashboard` | Aggregated stats |
| `GET /api/health` · `GET /api/ai-status` | Liveness + active AI provider |

## ✅ Verified

- `node scripts/smoke.mjs` — 24/24 end-to-end API checks pass (auth, validation errors, all features, dashboard)
- Real-PDF upload parsed and scored (generated via headless Chrome)
- Invalid AI key → graceful fallback with user-visible notice (no crash)
- Full GUI walkthrough in a real browser: register → profile → resume → careers → roadmap → interview → dashboard → logout/login (evidence in `gui-test-screenshots/`)

## 🌐 Social sign-in setup (optional)

The Google and Apple buttons always appear on the login/register pages. They
become clickable one-click sign-ins once you add credentials to `server/.env`
(restart the server afterwards). Until then, clicking them shows setup hints.

**Google (free, ~5 minutes):**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project → **APIs & Services → OAuth consent screen** (External; add your own email as a test user).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. Add `http://localhost:5173` under **Authorized JavaScript origins**.
4. Copy the client ID (ends in `.apps.googleusercontent.com`) into `server/.env` as GOOGLE_CLIENT_ID=386746409323-d00vo70ck2aqk41pkkrn03bieq19938h.apps.googleusercontent.com 

**Apple (requires a paid Apple Developer account, USD 99/yr):**
1. In the Apple Developer portal, register a **Services ID** with *Sign In with Apple* enabled and `http://localhost:5173` as return URL.
2. Create a **Sign in with Apple key**, then set the Services ID as `APPLE_CLIENT_ID=...` in `server/.env`.

How it works: the frontend receives a signed identity token from the provider,
the server verifies it (Google tokeninfo endpoint / Apple JWKS via `jose`),
finds or creates the local user by email, and issues CareerLens' own JWT —
identical to email/password sessions.

## 💼 Live jobs setup (optional)

On the **Career Matches** page, every match has a **"View live jobs & apply"**
button, and the Live Jobs section searches real openings for any role+location.
Applications happen on the portal itself via each job's official apply URL.

- LinkedIn and Naukri have **no public APIs** (scraping them violates their
  terms), so listings come from legitimate providers, tried in order:
  1. **JSearch** (RapidAPI free tier) — real **LinkedIn**, Indeed, Glassdoor,
     ZipRecruiter postings. Get a key: [rapidapi.com](https://rapidapi.com) →
     search "JSearch" → subscribe to the free plan → set `RAPIDAPI_KEY`.
  2. **Adzuna** — India-focused listings. Free at
     [developer.adzuna.com](https://developer.adzuna.com) → set
     `ADZUNA_APP_ID` + `ADZUNA_APP_KEY`.
  3. **Remotive** — remote roles, **works with no key** (default fallback).
- With none configured you still get **one-click search links** that open the
  role pre-filled on LinkedIn, Naukri, Indeed and Google Jobs.
- **Filters** on the jobs section: job type (full-time / internship / contract /
  part-time), experience level, posted-within, minimum salary (₹) and
  remote-only. Job type / experience / posted-within are pushed to the
  provider when supported (JSearch, Adzuna); min-salary and remote-only are
  also applied to any provider's results.
- Results are cached for 10 minutes to protect your free quotas.

## 🛠️ Troubleshooting

- **"Demo mode" banner stays** — no AI key in `server/.env`, or the server wasn't restarted after adding it.
- **Port already in use** — change `PORT` in `server/.env` and the proxy target in `client/vite.config.js`.
- **First run is slow** — the in-memory MongoDB binary (~80 MB) downloads once; set `MONGODB_URI` to skip it.
- **PDF gives "could not read enough text"** — the PDF is scanned/image-based; paste the text instead.
