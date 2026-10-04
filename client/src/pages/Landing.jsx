import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAiStatus } from '../components/AiModeBanner';

const FEATURES = [
  {
    icon: '📄',
    title: 'AI Resume Analyzer',
    text: 'Upload your resume and get an ATS score, strengths, weaknesses, missing skills and rewritten bullet points in seconds.',
    tint: 'bg-indigo-50 ring-indigo-100',
  },
  {
    icon: '🎯',
    title: 'Career Matching',
    text: 'Top 5 careers ranked by how well they fit your skills, interests and education — with salary ranges and demand signals.',
    tint: 'bg-violet-50 ring-violet-100',
  },
  {
    icon: '🗺️',
    title: 'Skill-Gap Roadmaps',
    text: 'Pick a target role and get a 4-phase learning plan tailored to what you already know, with free resources.',
    tint: 'bg-sky-50 ring-sky-100',
  },
  {
    icon: '🎤',
    title: 'Interview Practice',
    text: 'Generate role-specific interview questions, answer them, and get instant AI scoring with a model answer.',
    tint: 'bg-emerald-50 ring-emerald-100',
  },
];

export default function Landing() {
  const { user } = useAuth();
  const ai = useAiStatus();

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-b from-indigo-100 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-[360px] w-[360px] rounded-full bg-violet-100/70 blur-3xl" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg shadow-md shadow-indigo-500/30">🔭</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Career<span className="text-indigo-600">Lens</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-600 transition hover:text-slate-900">Log in</Link>
              <Link to="/register" className="btn-primary">Get started free</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-16 pt-14 text-center lg:pt-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-100 shadow-sm">
          <span className={`h-2 w-2 rounded-full ${ai && !ai.enabled ? 'bg-amber-400' : 'animate-pulse bg-emerald-500'}`} />
          {ai && !ai.enabled ? 'Works instantly — add a free AI key anytime' : 'Powered by free-tier AI APIs — no local models to install'}
        </div>
        <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl">
          See your career clearly with <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">AI</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg">
          CareerLens analyzes your resume, matches you to careers you'll actually enjoy, builds a skill-gap learning roadmap and drills you
          for interviews — everything a career counselor does, in one place.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={user ? '/dashboard' : '/register'} className="btn-primary w-full px-8 py-3 text-base sm:w-auto">
            {user ? 'Go to dashboard' : 'Analyze my career — free'} <span aria-hidden>→</span>
          </Link>
          <Link to="/login" className="btn-secondary w-full px-8 py-3 text-base sm:w-auto">I already have an account</Link>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['4', 'AI tools'],
            ['< 30s', 'Per analysis'],
            ['0', 'Models to install'],
            ['Free', 'To get started'],
          ].map(([n, l]) => (
            <div key={l} className="card px-4 py-4">
              <div className="text-xl font-extrabold text-indigo-600">{n}</div>
              <div className="mt-0.5 text-xs font-medium text-slate-500">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">Features</p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">One platform, four career superpowers</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card card-hover p-6">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-xl ring-1 ${f.tint}`}>{f.icon}</div>
              <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.text}</p>
            </div>
          ))}
        </div>

        <div className="card mt-12 p-8">
          <h3 className="text-center text-xl font-extrabold text-slate-900">How it works</h3>
          <div className="mt-8 grid gap-8 sm:grid-cols-4">
            {[
              ['1', 'Create a profile', 'Add your skills, interests and education'],
              ['2', 'Upload your resume', 'Get an ATS score and honest AI feedback'],
              ['3', 'Pick a career', 'See exactly which skills you are missing'],
              ['4', 'Practice & apply', 'Follow the roadmap and drill interviews'],
            ].map(([n, t, d], i) => (
              <div key={n} className="relative text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-md shadow-indigo-500/25">{n}</div>
                <div className="mt-3 text-sm font-bold text-slate-900">{t}</div>
                <div className="mt-1 text-xs leading-relaxed text-slate-500">{d}</div>
                {i < 3 && <span className="absolute right-[-16%] top-4 hidden text-slate-300 sm:block">→</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 px-8 py-12 text-center shadow-xl shadow-indigo-500/25">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-white/10" />
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">Your next career move starts here</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-indigo-100">
            Free forever in demo mode. Add a free AI API key when you're ready for the full experience.
          </p>
          <Link to={user ? '/dashboard' : '/register'} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50">
            {user ? 'Open dashboard' : 'Create free account'} →
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        CareerLens — AI-powered career guidance · Built with React, Express, MongoDB & free-tier AI APIs
      </footer>
    </div>
  );
}
