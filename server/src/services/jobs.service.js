/**
 * Live job listings for the Career Matches page.
 *
 * LinkedIn and Naukri have no public APIs (and scraping them violates their
 * terms), so listings come through legitimate providers, tried in order:
 *   1. JSearch (RapidAPI) — aggregates LinkedIn, Indeed, Glassdoor, ZipRecruiter
 *   2. Adzuna — India-focused job board listings
 *   3. Remotive — remote jobs (no key needed, always available)
 * If every provider fails or returns nothing, we return deep search links so
 * the user can apply on LinkedIn / Naukri / Indeed directly.
 *
 * Results are cached in memory for 10 minutes to protect API quotas.
 */
import env from '../config/env.js';

const CACHE_TTL = 10 * 60 * 1000;
const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function cacheSet(key, data) {
  if (cache.size > 100) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), data });
}

const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Parses "₹ 5,00,000–8,00,000 / year" / "INR 6 LPA" style strings to a number. */
function parseInrSalary(salary) {
  if (!salary || !/₹|inr|lpa/i.test(salary)) return null;
  const lpa = /lpa/i.test(salary);
  const n = Number(salary.replace(/[^0-9.]/g, ' ').trim().split(/\s+/)[0]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return lpa ? n * 100000 : n;
}

function applyFilters(jobs, filters = {}) {
  let out = jobs;
  if (filters.remoteOnly) {
    out = out.filter((j) => /remote|work from home|wfh/i.test(j.location) || j.source === 'Remotive');
  }
  if (filters.postedWithin && filters.postedWithin !== 'any') {
    const maxDays = { today: 1, '3days': 3, week: 7, month: 30 }[filters.postedWithin];
    if (maxDays) {
      out = out.filter((j) => {
        if (!j.posted) return false;
        const days = (Date.now() - new Date(j.posted).getTime()) / 86400000;
        return Number.isFinite(days) && days <= maxDays;
      });
    }
  }
  if (filters.minSalary) {
    out = out.filter((j) => {
      const parsed = parseInrSalary(j.salary);
      return parsed === null || parsed >= filters.minSalary; // keep jobs with unknown salary
    });
  }
  return out;
}

/** Provider 1: JSearch via RapidAPI — includes LinkedIn-published postings. */
async function fetchJSearch(role, location, filters) {
  const query = location ? `${role} jobs in ${location}` : `${role} jobs`;
  const params = new URLSearchParams({
    query,
    page: '1',
    num_pages: '1',
  });
  if (filters.jobType && filters.jobType !== 'any') params.set('job_type', filters.jobType);
  if (filters.experience === 'entry') params.set('job_requirements', 'under_3_years_experience');
  if (filters.experience === 'senior') params.set('job_requirements', 'more_than_3_years_experience');
  if (filters.postedWithin && filters.postedWithin !== 'any') {
    params.set('date_posted', filters.postedWithin); // today | 3days | week | month
  }
  if (/india/i.test(location || '') || !location) params.set('country', 'in');

  const data = await fetchJson(`https://jsearch.p.rapidapi.com/search?${params.toString()}`, {
    headers: {
      'x-rapidapi-key': env.jobs.rapidapiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });
  return (data?.data || [])
    .slice(0, 15)
    .map((j) => ({
      title: j.job_title || '',
      company: j.employer_name || '',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || '—',
      salary:
        j.job_min_salary && j.job_max_salary
          ? `${j.job_salary_currency || ''} ${Number(j.job_min_salary).toLocaleString('en-IN')}–${Number(j.job_max_salary).toLocaleString('en-IN')}${j.job_salary_period ? ` / ${j.job_salary_period}` : ''}`
          : '',
      source: j.job_publisher || 'JSearch',
      url: j.job_apply_link || '',
      posted: j.job_posted_at_datetime_utc || '',
      snippet: stripHtml(j.job_description).slice(0, 180),
    }))
    .filter((j) => j.title && j.url);
}

/** Provider 2: Adzuna — good coverage of the Indian job market. */
async function fetchAdzuna(role, location, filters) {
  const where = location ? `&where=${encodeURIComponent(location)}` : '';
  const daysOld = { today: 1, '3days': 3, week: 7, month: 30 }[filters.postedWithin] || 30;
  const fullTime = filters.jobType === 'fulltime' ? '&full_time=1' : '';
  const minSalary = filters.minSalary ? `&salary_min=${encodeURIComponent(filters.minSalary)}` : '';
  const data = await fetchJson(
    `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${env.jobs.adzunaAppId}&app_key=${env.jobs.adzunaAppKey}&what=${encodeURIComponent(role)}&results_per_page=15&max_days_old=${daysOld}&content-type=application/json${where}${fullTime}${minSalary}`
  );
  return (data?.results || [])
    .slice(0, 15)
    .map((j) => ({
      title: j.title?.replace(/<[^>]+>/g, '') || '',
      company: j.company?.display_name || '',
      location: j.location?.display_name || 'India',
      salary:
        j.salary_min && j.salary_max
          ? `₹ ${Number(j.salary_min).toLocaleString('en-IN')}–${Number(j.salary_max).toLocaleString('en-IN')} / year`
          : '',
      source: j.source?.name || 'Adzuna',
      url: j.redirect_url || '',
      posted: j.created || '',
      snippet: stripHtml(j.description).slice(0, 180),
    }))
    .filter((j) => j.title && j.url);
}

/** Provider 3: Remotive — remote roles, no API key required. */
async function fetchRemotive(role) {
  const data = await fetchJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}&limit=15`);
  return (data?.jobs || [])
    .slice(0, 15)
    .map((j) => ({
      title: j.title || '',
      company: j.company_name || '',
      location: j.candidate_required_location ? `${j.candidate_required_location} · Remote` : 'Remote',
      salary: j.salary || '',
      source: 'Remotive',
      url: j.url || '',
      posted: j.publication_date || '',
      snippet: stripHtml(j.description).slice(0, 180),
    }))
    .filter((j) => j.title && j.url);
}

/** Zero-config fallback: deep links into the portals' own search. */
export function buildSearchLinks(role, location) {
  const r = encodeURIComponent(role);
  const l = encodeURIComponent(location || 'India');
  const slug = String(role).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const locSlug = String(location || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return [
    { name: 'LinkedIn', url: `https://www.linkedin.com/jobs/search/?keywords=${r}&location=${l}` },
    { name: 'Naukri', url: locSlug ? `https://www.naukri.com/${slug}-jobs-in-${locSlug}` : `https://www.naukri.com/${slug}-jobs` },
    { name: 'Indeed', url: `https://in.indeed.com/jobs?q=${r}&l=${l}` },
    { name: 'Google Jobs', url: `https://www.google.com/search?q=${r}+jobs+${l}&ibp=htl;jobs` },
  ];
}

export async function searchJobs({ role, location = '', filters = {} }) {
  const cacheKey = JSON.stringify([role, location, filters]).toLowerCase();
  const hit = cacheGet(cacheKey);
  if (hit) return { ...hit, cached: true };

  const providers = [];
  if (env.jobs.rapidapiKey) providers.push(['jsearch', fetchJSearch]);
  if (env.jobs.adzunaAppId && env.jobs.adzunaAppKey) providers.push(['adzuna', fetchAdzuna]);
  providers.push(['remotive', fetchRemotive]);

  for (const [name, fn] of providers) {
    try {
      const jobs = applyFilters(await fn(role, location, filters), filters);
      if (jobs.length) {
        const out = { source: name, jobs, links: [] };
        cacheSet(cacheKey, out);
        return out;
      }
    } catch (err) {
      console.warn(`[jobs] provider ${name} failed: ${err.message}`);
    }
  }

  return { source: 'links', jobs: [], links: buildSearchLinks(role, location) };
}
