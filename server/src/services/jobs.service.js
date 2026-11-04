/**
 * Live job listings for the Career Matches page.
 *
 * Provider Restriction: ONLY jobs from LinkedIn and Remotive are supported.
 * All other providers (Adzuna, Naukri, Indeed, Glassdoor, generic search deep links)
 * are completely removed / bypassed.
 *
 * Providers:
 *   1. LinkedIn (via JSearch on RapidAPI, filtered strictly to LinkedIn)
 *   2. Remotive (remote developer and tech jobs, no key needed)
 *   3. Unified Job Repository (in-memory / MongoDB JobPostings for LinkedIn & Remotive)
 *
 * Results are cached in memory for 10 minutes to protect API quotas.
 */
import env from '../config/env.js';
import JobPosting from '../models/JobPosting.js';

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
      return parsed === null || parsed >= filters.minSalary;
    });
  }
  return out;
}

/**
 * Provider 1: LinkedIn (via JSearch / RapidAPI)
 * Filtered strictly to ONLY postings originating from LinkedIn.
 */
async function fetchLinkedIn(role, location, filters = {}) {
  if (!env.jobs.rapidapiKey) return [];

  const query = location ? `${role} LinkedIn jobs in ${location}` : `${role} LinkedIn jobs`;
  const params = new URLSearchParams({
    query,
    page: '1',
    num_pages: '1',
  });
  if (filters.jobType && filters.jobType !== 'any') params.set('job_type', filters.jobType);
  if (filters.experience === 'entry') params.set('job_requirements', 'under_3_years_experience');
  if (filters.experience === 'senior') params.set('job_requirements', 'more_than_3_years_experience');
  if (filters.postedWithin && filters.postedWithin !== 'any') {
    params.set('date_posted', filters.postedWithin);
  }
  if (/india/i.test(location || '') || !location) params.set('country', 'in');

  const data = await fetchJson(`https://jsearch.p.rapidapi.com/search?${params.toString()}`, {
    headers: {
      'x-rapidapi-key': env.jobs.rapidapiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
  });

  return (data?.data || [])
    .filter((j) => {
      const pub = String(j.job_publisher || '').toLowerCase();
      const url = String(j.job_apply_link || '').toLowerCase();
      const emp = String(j.employer_website || '').toLowerCase();
      return pub.includes('linkedin') || url.includes('linkedin.com') || emp.includes('linkedin.com');
    })
    .map((j) => ({
      title: j.job_title || '',
      company: j.employer_name || '',
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || location || 'India',
      salary:
        j.job_min_salary && j.job_max_salary
          ? `${j.job_salary_currency || ''} ${Number(j.job_min_salary).toLocaleString('en-IN')}–${Number(j.job_max_salary).toLocaleString('en-IN')}${j.job_salary_period ? ` / ${j.job_salary_period}` : ''}`
          : '',
      source: 'LinkedIn',
      url: j.job_apply_link || '',
      posted: j.job_posted_at_datetime_utc || '',
      snippet: stripHtml(j.job_description).slice(0, 180),
    }))
    .filter((j) => j.title && j.url);
}

/**
 * Provider 2: Remotive
 * Remote tech roles — requires no API key.
 */
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

/**
 * Fallback to stored JobPosting repository in MongoDB for LinkedIn & Remotive
 */
async function fetchRepositoryJobs(role, location, filters = {}) {
  try {
    const regex = new RegExp(role.replace(/[^a-zA-Z0-9]/g, '.*'), 'i');
    const query = {
      isActive: true,
      source: { $in: ['LinkedIn', 'Remotive'] },
      $or: [{ title: regex }, { requiredSkills: regex }],
    };
    if (filters.jobType && filters.jobType !== 'any') query.jobType = filters.jobType;
    if (filters.experience && filters.experience !== 'any') query.experienceLevel = filters.experience;

    const docs = await JobPosting.find(query).limit(10).lean();
    return docs.map((j) => ({
      title: j.title,
      company: j.company,
      location: j.location || location || 'India',
      salary: j.salary || '',
      source: j.source, // 'LinkedIn' or 'Remotive'
      url: j.url,
      posted: j.postedAt || '',
      snippet: j.snippet || stripHtml(j.description).slice(0, 180),
    }));
  } catch (err) {
    return [];
  }
}

export async function searchJobs({ role, location = '', filters = {} }) {
  const cacheKey = JSON.stringify([role, location, filters]).toLowerCase();
  const hit = cacheGet(cacheKey);
  if (hit) return { ...hit, cached: true };

  const collectedJobs = [];
  const providersUsed = [];

  // 1. LinkedIn provider (via RapidAPI JSearch, filtered strictly to LinkedIn)
  if (env.jobs.rapidapiKey) {
    try {
      const linkedInJobs = applyFilters(await fetchLinkedIn(role, location, filters), filters);
      if (linkedInJobs.length) {
        collectedJobs.push(...linkedInJobs);
        providersUsed.push('LinkedIn');
      }
    } catch (err) {
      console.warn(`[jobs] LinkedIn provider error: ${err.message}`);
    }
  }

  // 2. Remotive provider
  try {
    const remotiveJobs = applyFilters(await fetchRemotive(role), filters);
    if (remotiveJobs.length) {
      collectedJobs.push(...remotiveJobs);
      providersUsed.push('Remotive');
    }
  } catch (err) {
    console.warn(`[jobs] Remotive provider error: ${err.message}`);
  }

  // 3. Database repository provider (curated LinkedIn / Remotive jobs from JobPosting model)
  if (!collectedJobs.length) {
    try {
      const repoJobs = applyFilters(await fetchRepositoryJobs(role, location, filters), filters);
      if (repoJobs.length) {
        collectedJobs.push(...repoJobs);
        providersUsed.push('Job Repository');
      }
    } catch (err) {
      // ignore
    }
  }

  // STRICT REQUIREMENT ENFORCEMENT:
  // ONLY jobs from LinkedIn and Remotive are permitted.
  // Other providers and generic search deep links are completely removed.
  const strictlyFiltered = collectedJobs.filter(
    (j) => j.source === 'LinkedIn' || j.source === 'Remotive'
  );

  const sourceName = providersUsed.length ? providersUsed.join(' & ') : 'none';
  const out = {
    source: sourceName,
    hasLinkedIn: strictlyFiltered.some((j) => j.source === 'LinkedIn'),
    hasRemotive: strictlyFiltered.some((j) => j.source === 'Remotive'),
    jobs: strictlyFiltered,
    links: [], // generic search deep links removed
  };

  cacheSet(cacheKey, out);
  return out;
}
