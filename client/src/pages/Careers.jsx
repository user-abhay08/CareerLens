import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import LiveJobs from '../components/LiveJobs';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

const demandColor = (d) => {
  const s = String(d || '').toLowerCase();
  if (s.includes('high')) return 'chip-success';
  if (s.includes('grow')) return 'inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100';
  return 'chip';
};

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
