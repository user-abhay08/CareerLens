import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import { Loading } from '../components/Spinner';
import ScoreRing from '../components/ScoreRing';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

function StatCard({ icon, tint, label, value, to }) {
  const inner = (
    <div className="card card-hover flex items-center gap-4 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ring-1 ${tint}`}>{icon}</div>
      <div className="min-w-0">
        <div className="truncate text-lg font-extrabold text-slate-900">{value}</div>
        <div className="text-xs font-semibold text-slate-500">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

function ReadinessChecklist({ stats, hasProfile }) {
  const steps = [
    { label: 'Complete your profile', done: hasProfile, to: '/profile', hint: 'Add skills & interests' },
    { label: 'Analyze your resume', done: stats.resumesAnalyzed > 0, to: '/resume', hint: 'Get your ATS score' },
    { label: 'Explore career matches', done: stats.careerMatches > 0, to: '/careers', hint: 'Find your top 5 roles' },
    { label: 'Practice an interview', done: stats.interviewSessions > 0, to: '/interview', hint: 'AI-graded Q&A' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Career readiness</h2>
        <span className="chip-accent">{pct}% ready</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-5 space-y-2">
        {steps.map((s) => (
          <li key={s.to}>
            <Link to={s.to} className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 transition ${
                  s.done ? 'bg-emerald-500 text-white ring-emerald-500' : 'bg-white text-slate-300 ring-slate-200 group-hover:ring-indigo-300'
                }`}
              >
                {s.done ? '✓' : ''}
              </span>
              <span className="flex-1">
                <span className={`block text-sm font-semibold ${s.done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{s.label}</span>
                <span className="block text-xs text-slate-400">{s.hint}</span>
              </span>
              {!s.done && <span className="text-xs font-bold text-indigo-600 opacity-0 transition group-hover:opacity-100">Go →</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const s = data?.stats || {};

  return (
    <Layout
      title={data ? `Welcome back, ${user?.name?.split(' ')[0]} 👋` : 'Welcome back'}
      subtitle="Here's your career progress. Pick up where you left off."
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}
      {!data && !error && <Loading label="Loading your dashboard…" />}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon="📄" tint="bg-indigo-50 ring-indigo-100" label="Resumes analyzed" value={s.resumesAnalyzed} to="/resume" />
            <StatCard icon="🎯" tint="bg-violet-50 ring-violet-100" label="Top career match" value={s.topCareer || '—'} to="/careers" />
            <StatCard icon="🗺️" tint="bg-sky-50 ring-sky-100" label="Active roadmap" value={s.currentRoadmap || '—'} to="/roadmap" />
            <StatCard icon="🎤" tint="bg-emerald-50 ring-emerald-100" label="Interview sessions" value={s.interviewSessions} to="/interview" />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card flex flex-col items-center justify-center gap-3 p-6">
              {s.latestAtsScore != null ? (
                <>
                  <ScoreRing score={s.latestAtsScore} label="Latest ATS score" size={130} />
                  <Link to="/resume" className="btn-ghost !py-1.5 text-xs">Re-analyze resume</Link>
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl ring-1 ring-indigo-100">📄</div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">No resume analyzed yet</p>
                  <p className="mt-1 text-xs text-slate-400">Get your ATS score in under 30 seconds</p>
                  <Link to="/resume" className="btn-primary mt-4">Analyze a resume</Link>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <ReadinessChecklist stats={s} hasProfile={Boolean(data.profile)} />
            </div>
          </div>

          <div className="card p-6">
            <h2 className="section-title">Quick actions</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ['📄', 'Analyze my resume', 'ATS score, strengths & fixes', '/resume', 'bg-indigo-50 ring-indigo-100'],
                ['🎯', 'Find matching careers', 'Top 5 roles ranked by fit', '/careers', 'bg-violet-50 ring-violet-100'],
                ['🗺️', 'Build a skill roadmap', 'Close the gap to your target role', '/roadmap', 'bg-sky-50 ring-sky-100'],
                ['🎤', 'Practice interviews', 'AI-graded Q&A with model answers', '/interview', 'bg-emerald-50 ring-emerald-100'],
              ].map(([icon, t, d, to, tint]) => (
                <Link key={to} to={to} className="card card-hover flex items-start gap-3 p-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ring-1 ${tint}`}>{icon}</span>
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{t}</span>
                    <span className="block text-xs text-slate-500">{d}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {s.avgInterviewScore != null && (
            <div className="card flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl ring-1 ring-emerald-100">🎤</div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Interview performance</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Average score across your graded answers: <span className="font-bold text-indigo-600">{s.avgInterviewScore}/10</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
