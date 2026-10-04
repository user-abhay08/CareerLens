import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import AiModeBanner from '../components/AiModeBanner';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

function Timeline({ phases }) {
  return (
    <ol className="relative ml-3 space-y-8 border-l-2 border-slate-200">
      {phases.map((p, i) => (
        <li key={i} className="relative pl-8">
          <span className="absolute -left-[16px] flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-md shadow-indigo-500/25 ring-4 ring-slate-50">
            {i + 1}
          </span>
          <div className="card p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                {p.phase}: {p.title || p.focus?.slice(0, 40)}
              </h3>
              {p.duration && <span className="chip">{p.duration}</span>}
            </div>
            {p.focus && <p className="mt-2 text-sm leading-relaxed text-slate-500">{p.focus}</p>}
            {p.skills?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">{p.skills.map((s) => <span key={s} className="chip-accent">{s}</span>)}</div>
              </div>
            )}
            {p.resources?.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">Free resources</p>
                <div className="flex flex-wrap gap-1.5">{p.resources.map((s) => <span key={s} className="chip">🔗 {s}</span>)}</div>
              </div>
            )}
            {p.milestone && (
              <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100">
                🏁 <span className="font-bold">Milestone:</span> {p.milestone}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function Roadmap() {
  const [params, setParams] = useSearchParams();
  const [role, setRole] = useState(params.get('role') || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api('/careers/roadmaps')
      .then((d) => {
        setHistory(d.roadmaps);
        if (!params.get('role') && d.roadmaps.length) setCurrent(d.roadmaps[0]);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const r = params.get('role');
    if (r && r !== role) setRole(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const generate = async (e) => {
    e.preventDefault();
    if (!role.trim()) return;
    setBusy(true);
    setError('');
    setNotice('');
    setCurrent(null);
    try {
      const d = await api('/careers/roadmap', { method: 'POST', body: { targetRole: role.trim() } });
      setCurrent(d.roadmap);
      setNotice(d.notice || '');
      setParams({ role: role.trim() });
      api('/careers/roadmaps').then((h) => setHistory(h.roadmaps)).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout
      title="Skill-gap roadmap"
      subtitle="Enter a target role — get a personalized, phased learning plan that skips what you already know."
    >
      <AiModeBanner />
      {error && <p className="banner-error mb-4">{error}</p>}
      {notice && <p className="banner-warn mb-4">{notice}</p>}

      <form onSubmit={generate} className="card mb-8 flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="label" htmlFor="targetRole">Target role</label>
          <input id="targetRole" className="input" placeholder="e.g. Data Scientist, DevOps Engineer, UI/UX Designer" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <button type="submit" disabled={busy || !role.trim()} className="btn-primary">
          {busy ? (<><Spinner className="h-4 w-4" /> Planning…</>) : '🗺️ Build roadmap'}
        </button>
      </form>

      {busy && <Loading label="Designing your personalized learning path…" />}

      {!busy && current && (
        <div className="space-y-6">
          {current.overview && (
            <div className="card bg-gradient-to-br from-indigo-50 to-violet-50 p-6 ring-indigo-100">
              <p className="leading-relaxed text-slate-700">{current.overview}</p>
              {current.missingSkills?.length > 0 && (
                <div className="mt-4">
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-indigo-500">Your skill gap (priority order)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {current.missingSkills.map((s, i) => (
                      <span key={s} className="chip-accent">{i + 1}. {s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {current.phases?.length ? <Timeline phases={current.phases} /> : <p className="text-sm text-slate-400">No phases returned — try again.</p>}
        </div>
      )}

      {!busy && !current && (
        <div className="card p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-2xl ring-1 ring-sky-100">🗺️</div>
          <p className="mt-4 text-sm font-semibold text-slate-700">Enter a target role above</p>
          <p className="mt-1 text-xs text-slate-400">You'll get a 4-phase plan with free resources and milestones.</p>
        </div>
      )}

      {history.length > 1 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Past roadmaps</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {history.slice(1).map((h) => (
              <button key={h.id || h._id} onClick={() => { setCurrent(h); setNotice(''); }} className="card card-hover p-4 text-left">
                <p className="text-sm font-bold text-slate-800">{h.targetRole}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()} · {h.phases?.length || 0} phases</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
