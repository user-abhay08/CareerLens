import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AiModeBanner, { refreshAiStatus } from '../components/AiModeBanner';
import LiveJobs from '../components/LiveJobs';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

const demandColor = (d) => {
  const s = String(d || '').toLowerCase();
  if (s.includes('high')) return 'chip-success';
  if (s.includes('grow')) return 'inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100';
  return 'chip';
};

function linkedInJobUrl(jobTitle) {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(jobTitle)}&location=India`;
}

function internshalaJobUrl(jobTitle) {
  const slug = String(jobTitle || '')
    .toLowerCase()
    .replace(/[/\\]+/g, ' ')
    .trim()
    .replace(/\s+/g, '-');
  return `https://internshala.com/jobs/keywords-${encodeURIComponent(slug)}/`;
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z" />
    </svg>
  );
}

function InternshalaIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
    </svg>
  );
}

function CareerCard({ career, rank, onViewJobs }) {
  const navigate = useNavigate();
  return (
    <div className="card card-hover relative p-6">
      {rank === 0 && (
        <span className="absolute -top-2.5 left-5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
          Best match
        </span>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">{career.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{career.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className={`text-2xl font-extrabold ${career.matchScore >= 75 ? 'text-emerald-600' : career.matchScore >= 50 ? 'text-indigo-600' : 'text-amber-600'}`}>
            {career.matchScore}
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">match</div>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
          style={{ width: `${career.matchScore}%` }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className={demandColor(career.demand)}>{career.demand} demand</span>
        {career.salaryRange && <span className="chip">💰 {career.salaryRange}</span>}
      </div>

      {career.reasons?.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {career.reasons.map((r, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600"><span className="text-indigo-500">✓</span>{r}</li>
          ))}
        </ul>
      )}

      {career.skillsToLearn?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Learn next</p>
          <div className="flex flex-wrap gap-1.5">
            {career.skillsToLearn.map((s) => <span key={s} className="chip-accent">{s}</span>)}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-2">
        <button onClick={() => navigate(`/roadmap?role=${encodeURIComponent(career.title)}`)} className="btn-secondary w-full">
          🗺️ Build a roadmap for this
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <a
            href={linkedInJobUrl(career.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-100 hover:text-sky-800"
          >
            <LinkedInIcon />
            <span>View on LinkedIn</span>
          </a>
          <a
            href={internshalaJobUrl(career.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-50 px-3.5 py-2 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200 transition hover:bg-cyan-100 hover:text-cyan-800"
          >
            <InternshalaIcon />
            <span>Find on Internshala</span>
          </a>
        </div>
        <button onClick={() => onViewJobs(career.title)} className="btn-ghost w-full !py-2 text-xs">
          💼 View live jobs & apply
        </button>
      </div>
    </div>
  );
}

export default function Careers() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobRole, setJobRole] = useState('');
  const [autoSearchKey, setAutoSearchKey] = useState(0);
  const jobsRef = useRef(null);

  const loadHistory = () =>
    api('/careers/recommendations')
      .then((d) => {
        setHistory(d.recommendations);
        if (!current && d.recommendations.length) setCurrent(d.recommendations[0]);
      })
      .catch(() => {});

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recommend = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const d = await api('/careers/recommend', { method: 'POST' });
      setCurrent(d.recommendation);
      setNotice(d.notice || '');
      if (d.notice) refreshAiStatus();
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title="Career matches"
      subtitle="Ranked from your profile's skills, interests and education. Update your profile for sharper matches."
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}
      {notice && <p className="banner-warn mb-4">{notice}</p>}

      <button onClick={recommend} disabled={busy} className="btn-primary mb-8 px-8">
        {busy ? (<><Spinner className="h-4 w-4" /> Matching careers…</>) : '🎯 Find my top 5 careers'}
      </button>

      {busy && <Loading label="Comparing your profile against the job market…" />}

      {!busy && current && current.careers?.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {current.careers.map((c, i) => (
            <CareerCard
              key={c.title}
              career={c}
              rank={i}
              onViewJobs={(title) => {
                setJobRole(title);
                setAutoSearchKey((k) => k + 1);
                setTimeout(() => jobsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
              }}
            />
          ))}
        </div>
      )}

      {!busy && (!current || !current.careers?.length) && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-2xl ring-1 ring-violet-100">🎯</div>
          <p className="mt-4 text-sm font-semibold text-slate-700">No career matches yet</p>
          <p className="mt-1 text-xs text-slate-400">Click "Find my top 5 careers" to generate your first match report.</p>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Past match reports</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {history.slice(1).map((h) => (
              <button key={h.id || h._id} onClick={() => { setCurrent(h); setNotice(''); }} className="card card-hover p-4 text-left">
                <p className="text-sm font-bold text-slate-800">{new Date(h.createdAt).toLocaleString()}</p>
                <p className="mt-1 truncate text-xs text-slate-400">Top match: {h.careers?.[0]?.title || '—'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div ref={jobsRef} className="mt-10 scroll-mt-6">
        <LiveJobs role={jobRole} autoSearchKey={autoSearchKey} />
      </div>
    </Layout>
  );
}
