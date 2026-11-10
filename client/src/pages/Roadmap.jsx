import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import AiModeBanner, { refreshAiStatus } from '../components/AiModeBanner';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

const FREE_PLAYLIST_TAGS = ['freeCodeCamp', 'CodeWithHarry', 'Chai aur Code'];

function buildSkillLinks(skillName) {
  return {
    youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skillName} full course tutorial`)}`,
    coursera: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
    udemy: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(skillName)}`,
    playlistSearch: (creator) =>
      `https://www.youtube.com/results?search_query=${encodeURIComponent(`${skillName} ${creator} playlist`)}`,
  };
}

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}

function CourseraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 2 8.5 12 14l10-5.5L12 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v5.5c0 1.7 2.7 3 6 3s6-1.3 6-3V11" />
    </svg>
  );
}

function UdemyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m7 9 5-4 5 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 10v5a5 5 0 0 0 10 0v-5" />
    </svg>
  );
}

function CourseRecommendations({ skills, fallbackTopic, targetRole }) {
  const rawSkills = (skills || []).filter(Boolean);
  const resolved = rawSkills.length
    ? rawSkills.map((s) =>
        s.toLowerCase() === 'consolidation and practice' && targetRole ? targetRole : s
      )
    : [fallbackTopic || targetRole].filter(Boolean);
  const topics = [...new Set(resolved)];

  if (!topics.length) return null;

  return (
    <div className="mt-4 rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-200/80">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        📚 Recommended Courses & Resources
      </p>
      <div className="space-y-2.5">
        {topics.map((skillName) => {
          const links = buildSkillLinks(skillName);
          return (
            <div key={skillName} className="rounded-xl bg-white p-3 ring-1 ring-slate-200/75">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold capitalize text-slate-800">{skillName}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <a
                    href={links.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200/80 transition hover:bg-rose-100"
                  >
                    <YouTubeIcon />
                    <span>YouTube</span>
                  </a>
                  <a
                    href={links.coursera}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/80 transition hover:bg-sky-100"
                  >
                    <CourseraIcon />
                    <span>Coursera</span>
                  </a>
                  <a
                    href={links.udemy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200/80 transition hover:bg-violet-100"
                  >
                    <UdemyIcon />
                    <span>Udemy</span>
                  </a>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-slate-400">Free playlists:</span>
                {FREE_PLAYLIST_TAGS.map((creator) => (
                  <a
                    key={creator}
                    href={links.playlistSearch(creator)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/80 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200"
                  >
                    <span aria-hidden="true">▶</span>
                    <span>{creator}</span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline({ phases, targetRole }) {
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
            <CourseRecommendations skills={p.skills} fallbackTopic={p.title} targetRole={targetRole} />
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
      if (d.notice) refreshAiStatus();
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
          {current.phases?.length ? <Timeline phases={current.phases} targetRole={current.targetRole || role} /> : <p className="text-sm text-slate-400">No phases returned — try again.</p>}
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
