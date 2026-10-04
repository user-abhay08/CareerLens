import { useEffect, useRef, useState } from 'react';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

const sourceTint = (s) => {
  const n = String(s || '').toLowerCase();
  if (n.includes('linkedin')) return 'bg-sky-100 text-sky-800 ring-sky-300 font-bold';
  if (n.includes('indeed')) return 'bg-blue-100 text-blue-800 ring-blue-200';
  if (n.includes('naukri')) return 'bg-purple-100 text-purple-800 ring-purple-200';
  if (n.includes('glassdoor')) return 'bg-emerald-100 text-emerald-800 ring-emerald-200';
  if (n.includes('remotive')) return 'bg-teal-100 text-teal-800 ring-teal-200';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
};

function postedLabel(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (Number.isNaN(days)) return '';
  if (days <= 0) return 'posted today';
  if (days === 1) return 'posted yesterday';
  if (days < 30) return `posted ${days} days ago`;
  return '';
}

const EMPTY_FILTERS = { jobType: 'any', experience: 'any', postedWithin: 'any', minSalary: '', remoteOnly: false };

/**
 * Live job listings for a target role. Providers run server-side
 * (JSearch/LinkedIn → Adzuna → Remotive); with none configured, shows direct
 * apply links into LinkedIn / Naukri / Indeed searches.
 */
export default function LiveJobs({ role, autoSearchKey = 0 }) {
  const [searchRole, setSearchRole] = useState(role || '');
  const [location, setLocation] = useState('India');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastAuto = useRef(0);

  const buildQuery = (r, l, f) => {
    const p = new URLSearchParams({ role: r.trim(), location: l.trim() });
    if (f.jobType !== 'any') p.set('jobType', f.jobType);
    if (f.experience !== 'any') p.set('experience', f.experience);
    if (f.postedWithin !== 'any') p.set('postedWithin', f.postedWithin);
    if (f.minSalary) p.set('minSalary', f.minSalary);
    if (f.remoteOnly) p.set('remoteOnly', 'true');
    return p.toString();
  };

  const runSearch = async (r = searchRole, l = location, f = filters) => {
    if (!r.trim()) return;
    setLoading(true);
    setError('');
    try {
      const d = await api(`/jobs?${buildQuery(r, l, f)}`);
      setData(d);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when a career card triggers a new role.
  useEffect(() => {
    if (role && role !== searchRole && autoSearchKey !== lastAuto.current) {
      lastAuto.current = autoSearchKey;
      setSearchRole(role);
      runSearch(role, location, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, autoSearchKey]);

  const setF = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'any' && EMPTY_FILTERS[k] !== v).length;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">💼 Live jobs — apply on the portal</h2>
        {data?.source && data.source !== 'links' && (
          <span className="chip">source: {data.source}{data.cached ? ' · cached' : ''}</span>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); runSearch(); }}
        className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="jobRole">Role</label>
          <input id="jobRole" className="input" placeholder="e.g. Frontend Developer" value={searchRole} onChange={(e) => setSearchRole(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="jobLocation">Location</label>
          <input id="jobLocation" className="input" placeholder="e.g. Bengaluru" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <button type="submit" disabled={loading || !searchRole.trim()} className="btn-primary">
          {loading ? (<><Spinner className="h-4 w-4" /> Searching…</>) : 'Find jobs'}
        </button>
      </form>

      {/* Filter rows */}
      <button
        type="button"
        onClick={() => setShowAdvanced((s) => !s)}
        className="mt-3 cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-500"
      >
        {showAdvanced ? '▾ Hide filters' : '▸ Filters'} {activeFilterCount > 0 && <span className="chip-accent ml-1 !px-2 !py-0.5">{activeFilterCount} active</span>}
      </button>

      {showAdvanced && (
        <div className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="label" htmlFor="fJobType">Job type</label>
            <select id="fJobType" className="input cursor-pointer" value={filters.jobType} onChange={(e) => setF('jobType', e.target.value)}>
              <option value="any">Any</option>
              <option value="fulltime">Full-time</option>
              <option value="intern">Internship</option>
              <option value="contractor">Contract</option>
              <option value="parttime">Part-time</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fExp">Experience level</label>
            <select id="fExp" className="input cursor-pointer" value={filters.experience} onChange={(e) => setF('experience', e.target.value)}>
              <option value="any">Any</option>
              <option value="entry">Entry level (0–3 yrs)</option>
              <option value="senior">Senior (3+ yrs)</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fPosted">Posted within</label>
            <select id="fPosted" className="input cursor-pointer" value={filters.postedWithin} onChange={(e) => setF('postedWithin', e.target.value)}>
              <option value="any">Any time</option>
              <option value="today">Today</option>
              <option value="3days">Last 3 days</option>
              <option value="week">Last week</option>
              <option value="month">Last month</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="fSalary">Min salary (₹ / year)</label>
            <input id="fSalary" type="number" min="0" step="50000" className="input" placeholder="e.g. 500000" value={filters.minSalary} onChange={(e) => setF('minSalary', e.target.value)} />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={filters.remoteOnly}
              onChange={(e) => setF('remoteOnly', e.target.checked)}
            />
            <span className="text-sm font-semibold text-slate-700">Remote only</span>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => { setFilters(EMPTY_FILTERS); }} className="btn-ghost !py-2 text-xs">Clear filters</button>
            <button type="button" onClick={() => runSearch()} className="btn-secondary !py-2 text-xs">Apply filters</button>
          </div>
        </div>
      )}

      {error && <p className="banner-error mt-4">{error}</p>}
      {loading && <Loading label="Fetching live listings…" />}

      {!loading && data?.source && data.source !== 'jsearch' && data.source !== 'links' && (
        <p className="banner-warn mt-4">
          Showing <b>{data.source}</b> listings. Want <b>LinkedIn</b> postings inline? Add a free{' '}
          <b>RAPIDAPI_KEY</b> (JSearch) to <code className="rounded bg-amber-100 px-1 font-mono text-xs">server/.env</code> — see README.
          Naukri offers no API, so its listings open directly on naukri.com via the links below when no provider matches.
        </p>
      )}

      {!loading && data?.jobs?.length > 0 && (
        <div className="mt-5 grid gap-3">
          {data.jobs.map((j, i) => (
            <div key={i} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 transition hover:ring-indigo-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{j.title}</p>
                  <p className="text-xs text-slate-500">{j.company || '—'} · {j.location}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${sourceTint(j.source)}`}>{j.source}</span>
              </div>
              {j.salary && <p className="mt-1.5 text-xs font-semibold text-emerald-700">💰 {j.salary}</p>}
              {j.snippet && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{j.snippet}…</p>}
              <div className="mt-3 flex items-center gap-3">
                <a href={j.url} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-1.5 text-xs">
                  Apply on {j.source} ↗
                </a>
                <span className="text-[11px] text-slate-400">{postedLabel(j.posted)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data?.source === 'links' && (
        <div className="mt-5">
          <p className="text-sm text-slate-500">
            No inline listings available for <span className="font-semibold text-slate-700">{searchRole}</span> — apply directly on the portals
            (pre-filled for this role):
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.links.map((l) => (
              <a key={l.name} href={l.url} target="_blank" rel="noopener noreferrer" className="card card-hover flex items-center justify-between p-4">
                <span className="text-sm font-bold text-slate-800">Search “{searchRole}” on {l.name}</span>
                <span className="text-indigo-600">↗</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Tip: add a free <span className="font-semibold">RAPIDAPI_KEY</span> (JSearch) in <code className="rounded bg-slate-100 px-1">server/.env</code> to see
            live <b>LinkedIn</b> / Indeed / Glassdoor listings inline.
          </p>
        </div>
      )}

      {!loading && !data && !error && (
        <p className="mt-5 text-sm text-slate-400">Search a role to see live openings and apply links.</p>
      )}
    </section>
  );
}
