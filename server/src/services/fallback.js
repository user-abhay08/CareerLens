/**
 * Built-in heuristic engine — used when no AI API key is configured so the
 * product stays fully functional (demo mode). Deterministic, offline, free.
 */
import { CAREERS, SKILL_SYNONYMS, INTERVIEW_BANK } from './knowledge.js';

export function normalizeSkill(s) {
  return SKILL_SYNONYMS[String(s || '').trim().toLowerCase()] || String(s || '').trim().toLowerCase();
}

export function normalizeSet(list) {
  return new Set((list || []).map(normalizeSkill).filter(Boolean));
}

const intersect = (setA, listOfB) => listOfB.filter((b) => setA.has(normalizeSkill(b)));

/** Ranks the static career catalog against a candidate profile. */
export function fallbackRecommendations(profile = {}) {
  const userSkills = normalizeSet(profile.skills);
  const userInterests = normalizeSet(profile.interests).add(normalizeSkill(profile.targetRole));

  const scored = CAREERS.map((career) => {
    const careerSkills = normalizeSet(career.skills);
    const matchedSkills = intersect(userSkills, career.skills);
    const matchedInterests = intersect(userInterests, career.interests);
    const skillRatio = career.skills.length ? matchedSkills.length / career.skills.length : 0;
    const interestRatio = career.interests.length ? matchedInterests.length / career.interests.length : 0;
    const score = Math.min(97, Math.round(skillRatio * 70 + interestRatio * 30 + 8));

    const reasons = [];
    if (matchedSkills.length) reasons.push(`You already have ${matchedSkills.slice(0, 5).join(', ')}`);
    if (matchedInterests.length) reasons.push(`Matches your interest in ${matchedInterests.slice(0, 3).join(', ')}`);
    if (!reasons.length) reasons.push('High-growth field with many entry points for beginners');
    reasons.push(`Demand is ${career.demand?.toLowerCase?.() || 'steady'} in the market`);

    const skillsToLearn = [...careerSkills].filter((s) => !userSkills.has(s)).slice(0, 6);

    return {
      title: career.title,
      matchScore: score,
      description: career.description,
      reasons: reasons.slice(0, 4),
      skillsToLearn,
      salaryRange: career.salaryRange,
      demand: career.demand,
    };
  });

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
}

const ACTION_VERBS = ['built', 'developed', 'designed', 'led', 'created', 'implemented', 'improved', 'reduced', 'increased', 'launched', 'optimized', 'automated', 'migrated', 'delivered', 'achieved', 'managed', 'analyzed', 'collaborated', 'mentored', 'shipped'];
const SECTION_HINTS = {
  experience: /experience|employment|internship|work history|professional/i,
  education: /education|b\.?tech|bachelor|master|m\.?tech|b\.?sc|m\.?sc|university|college|school/i,
  skills: /skills|technologies|technical|stack|tools/i,
  projects: /projects?|portfolio|github/i,
  contact: /@|\+?\d[\d\s-]{8,}/,
};

/** Deterministic ATS-style resume scoring used in fallback mode. */
export function fallbackResumeAnalysis({ resumeText, profile, roleContext }) {
  const text = String(resumeText || '');
  const words = text.split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const knownSkills = new Set();
  for (const career of CAREERS) {
    for (const skill of career.skills) {
      if (lower.includes(skill.toLowerCase())) knownSkills.add(skill);
    }
  }
  for (const s of profile?.skills || []) knownSkills.add(s);

  const checks = [];
  const push = (ok, strength, weakness) => checks.push({ ok, strength, weakness });

  push(words.length >= 250 && words.length <= 900, `Good resume length (${words.length} words)`, `Resume length is ${words.length} words — aim for 300–800 words`);
  for (const [name, re] of Object.entries(SECTION_HINTS)) {
    const label = name === 'contact' ? 'contact details' : name;
    push(re.test(text), `${label.charAt(0).toUpperCase() + label.slice(1)} section found`, `No clear ${label} section detected`);
  }
  const quantified = lines.filter((l) => /\d+%|\d+\+|\b\d{2,}\b/.test(l)).length;
  push(quantified >= 2, `${quantified} quantified lines (numbers stand out to recruiters)`, `Only ${quantified} lines contain numbers — quantify your impact (%, users, time saved)`);
  const actionLines = lines.filter((l) => ACTION_VERBS.some((v) => l.toLowerCase().includes(v))).length;
  push(actionLines >= 3, `${actionLines} bullets start with strong action verbs`, `Few action verbs found — start bullets with Built / Led / Improved / Reduced`);
  push(knownSkills.size >= 5, `${knownSkills.size} recognizable technical keywords present`, `Only ${knownSkills.size} recognizable skill keywords — name your tools explicitly`);

  const passed = checks.filter((c) => c.ok);
  const atsScore = Math.round((passed.length / checks.length) * 100);

  const weaknesses = checks.filter((c) => !c.ok).map((c) => c.weakness).slice(0, 6);
  if (!weaknesses.length) weaknesses.push('Minor: add a short professional summary tailored to the target role');

  // Only suggest rewrites for plausible work bullets — skip contact lines,
  // education lines, section headers and bare skill lists.
  const isNoise = (l) =>
    /@|https?:\/\/|www\.|\|\s*\+?\d/.test(l) ||
    SECTION_HINTS.education.test(l) ||
    /^(skills?|technologies|tools|projects?|experience|education|certifications?)\b/i.test(l) ||
    (/^([^,]+,){2,}/.test(l) && !ACTION_VERBS.some((v) => l.toLowerCase().includes(v)));
  const weakBullets = lines
    .filter((l) => l.length > 30 && l.length < 200 && !/[.;]$/.test(l) && !isNoise(l))
    .filter((l) => !/\d/.test(l) || !ACTION_VERBS.some((v) => l.toLowerCase().includes(v)))
    .slice(0, 3)
    .map((original) => ({
      original,
      improved: `${original.replace(/^[-•*\s]+/, '')} — leading to measurable results (add %, users served, or hours saved)`,
    }));

  const targetCareer = CAREERS.find((c) => normalizeSkill(c.title) === normalizeSkill(roleContext || profile?.targetRole || ''));
  const missingSkills = targetCareer
    ? [...targetCareer.skills].filter((s) => !lower.includes(s.toLowerCase()) && ![...(profile?.skills || [])].map(normalizeSkill).includes(normalizeSkill(s))).slice(0, 8)
    : ['System design', 'Testing', 'CI/CD', 'Cloud (AWS/GCP)', 'Docker'].filter((s) => !lower.includes(s.toLowerCase())).slice(0, 6);

  return {
    summary: `Heuristic analysis (no AI key configured): ${words.length} words, ${knownSkills.size} skill keywords detected, ATS-style score ${atsScore}/100. Add GEMINI_API_KEY to server/.env for a full AI review.`,
    atsScore,
    strengths: passed.map((c) => c.strength).slice(0, 6),
    weaknesses,
    missingSkills,
    keywords: [...knownSkills].slice(0, 12),
    suggestedRoles: fallbackRecommendations({ skills: [...knownSkills], interests: profile?.interests, targetRole: roleContext || profile?.targetRole }).map((c) => c.title),
    rewrittenBullets: weakBullets,
  };
}

const ROADMAP_PHASE_TEMPLATES = [
  { title: 'Foundations', focus: 'Master the core concepts and vocabulary of the field before touching advanced tooling.', duration: 'Weeks 1–4' },
  { title: 'Core skills & tooling', focus: 'Learn the day-to-day tools used by professionals and practice them in small exercises.', duration: 'Weeks 5–9' },
  { title: 'Build real projects', focus: 'Ship 2–3 portfolio projects that solve real problems and demonstrate the target skills.', duration: 'Weeks 10–16' },
  { title: 'Job readiness', focus: 'Prepare for interviews, polish your resume and LinkedIn, and apply consistently.', duration: 'Weeks 17–20' },
];

const RESOURCE_SUGGESTIONS = {
  developer: ['freeCodeCamp', 'MDN Web Docs', 'The Odin Project', 'CS50 (free)', 'LeetCode'],
  data: ['Kaggle Learn', 'Google Data Analytics (audit free)', 'StatQuest (YouTube)', 'W3Schools SQL'],
  design: ['Google UX Design (audit free)', 'Figma Academy', 'Laws of UX', 'Dribbble for inspiration'],
  security: ['TryHackMe (free rooms)', 'OverTheWire', 'PortSwigger Web Security Academy'],
  cloud: ['AWS Skill Builder (free tier)', 'KodeKloud labs', 'Linux Journey'],
  default: ['official documentation', 'freeCodeCamp', 'YouTube: freeCodeCamp / Traversy Media', 'roadmap.sh'],
};

function resourcesFor(roleTitle) {
  const r = roleTitle.toLowerCase();
  if (r.includes('frontend') || r.includes('backend') || r.includes('full-stack') || r.includes('full stack') || r.includes('developer')) return RESOURCE_SUGGESTIONS.developer;
  if (r.includes('data') || r.includes('analyst') || r.includes('scientist') || r.includes('ml') || r.includes('ai')) return RESOURCE_SUGGESTIONS.data;
  if (r.includes('design') || r.includes('ux')) return RESOURCE_SUGGESTIONS.design;
  if (r.includes('security')) return RESOURCE_SUGGESTIONS.security;
  if (r.includes('devops') || r.includes('cloud')) return RESOURCE_SUGGESTIONS.cloud;
  return RESOURCE_SUGGESTIONS.default;
}

export function fallbackRoadmap({ profile, targetRole }) {
  const userSkills = normalizeSet(profile?.skills);
  const career = CAREERS.find((c) => normalizeSkill(c.title) === normalizeSkill(targetRole));
  const required = career ? career.skills : ['Fundamentals', 'Core tooling', 'Applied practice', 'Professional skills'];
  const missing = [...normalizeSet(required)].filter((s) => !userSkills.has(s));
  const resources = resourcesFor(targetRole);

  // Distribute missing skills across 4 contiguous, non-overlapping chunks.
  const baseSize = Math.floor(missing.length / 4);
  let extra = missing.length % 4;
  let cursor = 0;
  const phases = ROADMAP_PHASE_TEMPLATES.map((t, i) => {
    const size = baseSize + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    const chunk = missing.slice(cursor, cursor + size);
    cursor += size;
    return {
      phase: `Phase ${i + 1}`,
      title: t.title,
      duration: t.duration,
      focus: t.focus,
      skills: chunk.length ? chunk : ['Consolidation and practice'],
      resources,
      milestone: i === 3 ? 'Offer-ready: polished resume, mock interviews done, 20+ applications sent' : `Deliverable: ${chunk.length ? chunk.join(', ') : 'practice set'} demonstrated in a small project`,
    };
  });

  return {
    overview: `Heuristic roadmap for ${targetRole} (no AI key configured). Focus on ${missing.slice(0, 4).join(', ') || 'strengthening existing skills'} across 4 phases, ~20 weeks.`,
    missingSkills: missing.slice(0, 10),
    phases,
  };
}

export function fallbackInterviewQuestions({ role, difficulty }) {
  const lower = role.toLowerCase();
  const hintKey = lower.includes('frontend') || lower.includes('backend') || lower.includes('developer') || lower.includes('full')
    ? 'developer'
    : lower.includes('data') || lower.includes('analyst') || lower.includes('scientist') || lower.includes('ml')
      ? 'data'
      : lower.includes('design') || lower.includes('ux')
        ? 'design'
        : lower.includes('security')
          ? 'security'
          : null;

  const questions = [];
  const techCount = difficulty === 'hard' ? 3 : 2;
  INTERVIEW_BANK.technical.slice(0, techCount).forEach((q) => questions.push(q));
  if (hintKey) questions.push(INTERVIEW_BANK.roleHints[hintKey]);
  INTERVIEW_BANK.behavioral.forEach((q) => {
    if (questions.length < 5) questions.push(q);
  });
  return { questions: questions.slice(0, 5) };
}

export function fallbackAnswerFeedback({ answer, question }) {
  const text = String(answer || '').trim();
  const words = text.split(/\s+/).filter(Boolean);
  const hasNumbers = /\d/.test(text);
  const hasStructure = /(situation|task|action|result|first|then|finally|because)/i.test(text);
  const hasExample = /(for example|for instance|in my|at my|i built|i led|i worked)/i.test(text);

  const score = Math.max(2, Math.min(9, 2 + (words.length >= 60 ? 3 : words.length >= 25 ? 1 : 0) + (hasStructure ? 2 : 0) + (hasNumbers ? 1 : 0) + (hasExample ? 1 : 0)));
  const strengths = [];
  if (hasStructure) strengths.push('The answer follows a clear structure');
  if (hasExample) strengths.push('You grounded it in a concrete personal example');
  if (words.length >= 60) strengths.push('Good depth and detail');
  if (!strengths.length) strengths.push('You addressed the question directly');

  const improvements = [];
  if (!hasStructure) improvements.push('Use STAR (Situation, Task, Action, Result) to structure the answer');
  if (!hasNumbers) improvements.push('Quantify the impact — add numbers (%, time, users)');
  if (words.length < 60) improvements.push('Expand with more specifics about your exact contribution');
  if (!hasExample) improvements.push('Anchor it in a real example from your experience');

  return {
    score,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    improvedAnswer: `${text.replace(/\s+/g, ' ').trim()} (Fallback mode — add an AI key for a fully rewritten model answer. Consider adding: situation context, the specific actions YOU took, and a quantified result for "${(question || '').slice(0, 80)}")`,
  };
}
