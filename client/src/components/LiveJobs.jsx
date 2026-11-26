import { useEffect, useRef, useState } from 'react';
import { Loading, Spinner } from '../components/Spinner';
import { api } from '../api';

const sourceTint = (s) => {
  const n = String(s || '').toLowerCase();
  if (n.includes('linkedin')) return 'bg-sky-100 text-sky-800 ring-sky-300 font-bold';
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

const EMPTY_FILTERS = { jobType: 'any', experience: 'any', experienceYears: 'any', postedWithin: 'any', minSalary: '', remoteOnly: false };

/**
 * Live job listings for a target role.
 * Strictly restricted to LinkedIn and Remotive providers only.
 */
export default function LiveJobs({ role, autoSearchKey = 0, initialExperienceYears = 0 }) {
  const [searchRole, setSearchRole] = useState(role || '');
  const [location, setLocation] = useState('India');
  const [filters, setFilters] = useState(() => ({
    ...EMPTY_FILTERS,
    experienceYears: initialExperienceYears != null ? String(initialExperienceYears) : 'any',
  }));
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastAuto = useRef(0);

  useEffect(() => {
    if (initialExperienceYears != null) {
      setFilters((f) => ({ ...f, experienceYears: String(initialExperienceYears) }));
    }
  }, [initialExperienceYears]);

  const buildQuery = (r, l, f) => {
    const p = new URLSearchParams({ role: r.trim(), location: l.trim() });
    if (f.jobType !== 'any') p.set('jobType', f.jobType);
    if (f.experience !== 'any') p.set('experience', f.experience);
    if (f.experienceYears && f.experienceYears !== 'any') p.set('experienceYears', f.experienceYears);
    if (f.postedWithin !== 'any') p.set('postedWithin', f.postedWithin);
    if (f.minSalary) p.set('minSalary', f.minSalary);
    if (f.remoteOnly) p.set('remoteOnly', 'true');
    return p.toString();
  };

  const runSearch = async (r = searchRole, l = location, f = filters) => {
    if (!r || !r.trim()) return;
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

  // Auto-search when a career card triggers a new role or user changes role selection
  useEffect(() => {
    if (role && (autoSearchKey !== lastAuto.current || role !== searchRole)) {
      lastAuto.current = autoSearchKey;
      setSearchRole(role);
      const activeFilters = {
        ...filters,
        experienceYears: initialExperienceYears != null ? String(initialExperienceYears) : filters.experienceYears,
      };
      runSearch(role, location, activeFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, autoSearchKey, initialExperienceYears]);

  const setF = (key, value) => setFilters((f) => ({ ...f, [key]: value }));
  const activeFilterCount = Object.entries(filters).filter(([k, v]) => v && v !== 'any' && EMPTY_FILTERS[k] !== v).length;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="section-title">💼 Live jobs — LinkedIn & Remotive</h2>
        {data?.source && data.source !== 'none' && data?.jobs?.length > 0 && (
          <span className="chip">source: {data.source}{data.cached ? ' · cached' : ''}</span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(searchRole, location, filters);
        }}
        className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end"
      >
        <div>
          <label className="label" htmlFor="jobRole">Role</label>
          <input
            id="jobRole"
            className="input"
            placeholder="e.g. Frontend Developer"
            value={searchRole}
            onChange={(e) => setSearchRole(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="jobLocation">Location</label>
          <input
            id="jobLocation"
            className="input"
            placeholder="e.g. Bengaluru"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
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
            <label className="label" htmlFor="fExpYears">Experience Level (0 to 15 Yrs)</label>
            <select id="fExpYears" className="input cursor-pointer font-medium" value={filters.experienceYears} onChange={(e) => setF('experienceYears', e.target.value)}>
              <option value="any">Any experience</option>
              <option value="0">0 yrs (Fresher / Entry level)</option>
              <option value="1">1 year (Junior Associate)</option>
              <option value="2">2 years (Junior)</option>
              <option value="3">3 years (Mid-level)</option>
              <option value="4">4 years (Mid-level)</option>
              <option value="5">5 years (Senior)</option>
              <option value="6">6 years (Senior)</option>
              <option value="7">7 years (Tech Lead)</option>
              <option value="8">8 years (Lead Engineer)</option>
              <option value="9">9 years (Staff Engineer)</option>
              <option value="10">10 years (Principal / Manager)</option>
              <option value="12">12 years (Director / Architect)</option>
              <option value="15">15+ years (Enterprise Architect / Exec)</option>
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
            <button type="button" onClick={() => runSearch(searchRole, location, filters)} className="btn-secondary !py-2 text-xs">Apply filters</button>
          </div>
        </div>
      )}

      {error && <p className="banner-error mt-4">{error}</p>}
      {loading && <Loading label="Fetching live listings from LinkedIn & Remotive…" />}

      {!loading && data?.jobs?.length > 0 && !data.hasLinkedIn && (
        <p className="banner-warn mt-4">
          Showing <b>Remotive</b> listings. To also fetch live <b>LinkedIn</b> postings inline, configure{' '}
          <b>RAPIDAPI_KEY</b> in <code className="rounded bg-amber-100 px-1 font-mono text-xs">server/.env</code>.
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
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <a href={j.url} target="_blank" rel="noopener noreferrer" className="btn-primary !px-4 !py-1.5 text-xs">
                    Apply on {j.source} ↗
                  </a>
                  <span className="text-[11px] text-slate-400">{postedLabel(j.posted)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && data && data.jobs?.length === 0 && (
        <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-700">No jobs found on LinkedIn or Remotive</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search keywords, location, or filter criteria.</p>
        </div>
      )}

      {!loading && !data && !error && (
        <p className="mt-5 text-sm text-slate-400">Search a role to view LinkedIn and Remotive openings.</p>
      )}
    </section>
  );
}
