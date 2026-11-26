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

const DOMAIN_TRACKS = {
  'Frontend Developer': 'Web',
  'Backend Developer': 'Backend',
  'Full-Stack Developer': 'Web',
  'Mobile App Developer': 'Mobile',
  'Data Analyst': 'Data',
  'Data Scientist': 'Data/AI',
  'Machine Learning Engineer': 'Data/AI',
  'AI / LLM Engineer': 'Data/AI',
  'DevOps / Cloud Engineer': 'Cloud/DevOps',
  'Cybersecurity Analyst': 'Security',
  'QA / Test Automation Engineer': 'QA/Testing',
  'Product Manager': 'Product',
  'Business Analyst': 'Business',
  'Digital Marketing Specialist': 'Marketing',
  'UI/UX Designer': 'Design',
};

const EXP_TIER_AFFINITY = {
  fresher: {
    'Frontend Developer': 24,
    'Data Analyst': 23,
    'QA / Test Automation Engineer': 22,
    'Business Analyst': 20,
    'UI/UX Designer': 19,
    'Backend Developer': 16,
    'Full-Stack Developer': 15,
    'Digital Marketing Specialist': 14,
    'Mobile App Developer': 13,
    'Data Scientist': 10,
    'Cybersecurity Analyst': 8,
    'DevOps / Cloud Engineer': 6,
    'Machine Learning Engineer': 5,
    'AI / LLM Engineer': 4,
    'Product Manager': 3,
  },
  mid: {
    'Full-Stack Developer': 24,
    'Backend Developer': 23,
    'Data Scientist': 22,
    'Mobile App Developer': 21,
    'Frontend Developer': 20,
    'UI/UX Designer': 18,
    'DevOps / Cloud Engineer': 17,
    'Data Analyst': 15,
    'QA / Test Automation Engineer': 14,
    'Cybersecurity Analyst': 14,
    'Machine Learning Engineer': 12,
    'AI / LLM Engineer': 10,
    'Product Manager': 8,
    'Business Analyst': 8,
    'Digital Marketing Specialist': 6,
  },
  senior: {
    'DevOps / Cloud Engineer': 24,
    'Machine Learning Engineer': 23,
    'AI / LLM Engineer': 23,
    'Cybersecurity Analyst': 22,
    'Product Manager': 21,
    'Backend Developer': 20,
    'Full-Stack Developer': 18,
    'Data Scientist': 17,
    'Mobile App Developer': 13,
    'UI/UX Designer': 11,
    'Data Analyst': 10,
    'QA / Test Automation Engineer': 9,
    'Business Analyst': 8,
    'Frontend Developer': 8,
    'Digital Marketing Specialist': 6,
  },
  lead: {
    'Product Manager': 25,
    'AI / LLM Engineer': 24,
    'DevOps / Cloud Engineer': 23,
    'Cybersecurity Analyst': 22,
    'Backend Developer': 20,
    'Machine Learning Engineer': 19,
    'Full-Stack Developer': 17,
    'Data Scientist': 15,
    'Business Analyst': 12,
    'Data Analyst': 8,
    'Mobile App Developer': 8,
    'UI/UX Designer': 8,
    'QA / Test Automation Engineer': 6,
    'Frontend Developer': 6,
    'Digital Marketing Specialist': 5,
  },
};

const SALARY_TIERS = {
  'Frontend Developer': { fresher: '₹4–8 LPA entry (India)', mid: '₹8–16 LPA (India)', senior: '₹18–32 LPA (India)', lead: '₹32–55+ LPA (India)' },
  'Backend Developer': { fresher: '₹4.5–9 LPA entry (India)', mid: '₹9–18 LPA (India)', senior: '₹20–36 LPA (India)', lead: '₹35–65+ LPA (India)' },
  'Full-Stack Developer': { fresher: '₹4.5–9 LPA entry (India)', mid: '₹9–19 LPA (India)', senior: '₹20–38 LPA (India)', lead: '₹35–65+ LPA (India)' },
  'Data Analyst': { fresher: '₹3.5–7 LPA entry (India)', mid: '₹7–14 LPA (India)', senior: '₹15–26 LPA (India)', lead: '₹26–45+ LPA (India)' },
  'Data Scientist': { fresher: '₹6–12 LPA entry (India)', mid: '₹12–22 LPA (India)', senior: '₹22–42 LPA (India)', lead: '₹42–75+ LPA (India)' },
  'Machine Learning Engineer': { fresher: '₹6–13 LPA entry (India)', mid: '₹13–24 LPA (India)', senior: '₹24–45 LPA (India)', lead: '₹45–80+ LPA (India)' },
  'AI / LLM Engineer': { fresher: '₹7–14 LPA entry (India)', mid: '₹14–26 LPA (India)', senior: '₹26–50 LPA (India)', lead: '₹50–90+ LPA (India)' },
  'DevOps / Cloud Engineer': { fresher: '₹4.5–9 LPA entry (India)', mid: '₹10–20 LPA (India)', senior: '₹20–40 LPA (India)', lead: '₹40–70+ LPA (India)' },
  'Mobile App Developer': { fresher: '₹4–8.5 LPA entry (India)', mid: '₹8.5–17 LPA (India)', senior: '₹18–32 LPA (India)', lead: '₹32–55+ LPA (India)' },
  'UI/UX Designer': { fresher: '₹3.5–7.5 LPA entry (India)', mid: '₹7.5–15 LPA (India)', senior: '₹16–28 LPA (India)', lead: '₹28–48+ LPA (India)' },
  'Cybersecurity Analyst': { fresher: '₹4.5–9 LPA entry (India)', mid: '₹9–18 LPA (India)', senior: '₹18–35 LPA (India)', lead: '₹35–65+ LPA (India)' },
  'QA / Test Automation Engineer': { fresher: '₹3.5–7 LPA entry (India)', mid: '₹7–14 LPA (India)', senior: '₹14–25 LPA (India)', lead: '₹25–42+ LPA (India)' },
  'Product Manager': { fresher: '₹6–12 LPA entry (India)', mid: '₹12–22 LPA (India)', senior: '₹22–42 LPA (India)', lead: '₹42–75+ LPA (India)' },
  'Business Analyst': { fresher: '₹4–8 LPA entry (India)', mid: '₹8–16 LPA (India)', senior: '₹16–28 LPA (India)', lead: '₹28–48+ LPA (India)' },
  'Digital Marketing Specialist': { fresher: '₹3–6 LPA entry (India)', mid: '₹6–12 LPA (India)', senior: '₹12–22 LPA (India)', lead: '₹22–38+ LPA (India)' },
};

function getExpTier(expYears) {
  const exp = Number(expYears) || 0;
  if (exp === 0) return 'fresher';
  if (exp <= 4) return 'mid';
  if (exp <= 8) return 'senior';
  return 'lead';
}

/** Ranks the static career catalog against a candidate profile, calibrated for 0–15 years experience and domain diversity. */
export function fallbackRecommendations(profile = {}) {
  const expYrs = Number(profile.experienceYears) || 0;
  const tier = getExpTier(expYrs);
  const affinity = EXP_TIER_AFFINITY[tier];

  const userSkills = normalizeSet(profile.skills);
  const userInterests = normalizeSet(profile.interests);
  if (profile.targetRole) userInterests.add(normalizeSkill(profile.targetRole));

  const scored = CAREERS.map((career) => {
    const careerSkills = normalizeSet(career.skills);
    const matchedSkills = intersect(userSkills, career.skills);
    const matchedInterests = intersect(userInterests, career.interests);

    const expBoost = affinity[career.title] || 10;
    const skillBoost = Math.min(35, matchedSkills.length * 12);
    const interestBoost = Math.min(15, matchedInterests.length * 8);
    const demandBoost = career.demand === 'High' ? 6 : career.demand === 'Growing' ? 4 : 2;

    const rawScore = 48 + expBoost + skillBoost + interestBoost + demandBoost;
    const score = Math.min(98, Math.max(45, Math.round(rawScore)));

    const reasons = [];
    if (matchedSkills.length) {
      reasons.push(`You already have core competencies: ${matchedSkills.slice(0, 4).join(', ')}`);
    }
    if (matchedInterests.length) {
      reasons.push(`Matches your target focus in ${matchedInterests.slice(0, 3).join(', ')}`);
    }
    if (tier === 'fresher') {
      reasons.push('High entry-level hiring pipeline with strong campus and graduate onboarding');
    } else if (tier === 'mid') {
      reasons.push(`Calibrated for ${expYrs} year${expYrs > 1 ? 's' : ''} experience with high industry demand`);
    } else if (tier === 'senior') {
      reasons.push(`Senior specialist & technical leadership scope (${expYrs} yrs experience)`);
    } else {
      reasons.push(`Strategic architecture & organizational leadership scope (${expYrs} yrs experience)`);
    }
    reasons.push(`Industry hiring demand is ${career.demand?.toLowerCase?.() || 'steady'} in the market`);

    const skillsToLearn = [...careerSkills].filter((s) => !userSkills.has(s)).slice(0, 6);

    return {
      title: career.title,
      matchScore: score,
      description: career.description,
      reasons: reasons.slice(0, 4),
      skillsToLearn,
      matchingSkills: matchedSkills,
      missingCompetencies: skillsToLearn,
      salaryRange: SALARY_TIERS[career.title]?.[tier] || career.salaryRange,
      demand: career.demand,
      track: DOMAIN_TRACKS[career.title],
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  // Domain diversity filter: at most 2 from the same domain track in top 5
  const selected = [];
  const trackCount = {};
  for (const item of scored) {
    const t = item.track || 'Other';
    if ((trackCount[t] || 0) < 2) {
      selected.push(item);
      trackCount[t] = (trackCount[t] || 0) + 1;
      if (selected.length === 5) break;
    }
  }
  // Ensure exactly 5 items if available
  if (selected.length < 5) {
    for (const item of scored) {
      if (!selected.includes(item)) {
        selected.push(item);
        if (selected.length === 5) break;
      }
    }
  }
  return selected;
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
    resumeQualityScore: atsScore,
    strengths: passed.map((c) => c.strength).slice(0, 6),
    weaknesses,
    missingSkills,
    keywords: [...knownSkills].slice(0, 12),
    suggestedRoles: fallbackRecommendations({ skills: [...knownSkills], interests: profile?.interests, targetRole: roleContext || profile?.targetRole, experienceYears: profile?.experienceYears }).map((c) => c.title),
    rewrittenBullets: weakBullets,
    structuredCandidateProfile: {
      educationalQualifications: profile?.education || [],
      technicalSkills: [...knownSkills],
      softSkills: ['Communication', 'Problem Solving', 'Team Collaboration'],
      projects: profile?.projects || [],
      certifications: profile?.certifications || [],
      internships: profile?.internships || [],
      workExperience: profile?.experience || [],
      achievements: profile?.achievements || [],
      extracurricularActivities: profile?.extracurricularActivities || [],
    },
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

/**
 * Explainable Career Readiness Assessment (Module 4) in fallback mode.
 * Evaluates candidate preparedness across 7 dimensions.
 */
export function fallbackCareerReadiness({ profile = {}, targetRole = '', resumeAnalysis = null }) {
  const roleName = targetRole || profile.targetRole || 'Software Engineer';
  const userSkills = normalizeSet(profile.skills || profile.technicalSkills || []);
  const career = CAREERS.find((c) => normalizeSkill(c.title) === normalizeSkill(roleName));
  const requiredSkills = career ? career.skills : ['Core Programming', 'Data Structures', 'Git', 'Problem Solving', 'System Design'];

  const matched = intersect(userSkills, requiredSkills);
  const missing = requiredSkills.filter((s) => !userSkills.has(normalizeSkill(s)));

  const technicalCompetencies = Math.min(100, Math.round((matched.length / Math.max(1, requiredSkills.length)) * 80 + 20));
  const resumeQuality = resumeAnalysis?.result?.resumeQualityScore || resumeAnalysis?.result?.atsScore || (profile.headline ? 75 : 60);

  const projectCount = (profile.projects || []).length;
  const projectExperience = Math.min(100, Math.round(projectCount >= 3 ? 90 : projectCount === 2 ? 78 : projectCount === 1 ? 65 : 45));

  const certCount = (profile.certifications || []).length;
  const certifications = Math.min(100, Math.round(certCount >= 2 ? 88 : certCount === 1 ? 72 : 50));

  const internCount = (profile.internships || []).length + (profile.experience || []).length;
  const internships = Math.min(100, Math.round(internCount >= 2 ? 90 : internCount === 1 ? 75 : 48));

  const cgpa = profile.academicPerformance?.cgpa || profile.education?.[0]?.cgpa;
  const academicPerformance = cgpa ? Math.min(100, Math.round(cgpa >= 8.5 ? 92 : cgpa >= 7.5 ? 82 : cgpa >= 6.5 ? 72 : 60)) : 75;

  const alignmentWithIndustry = Math.min(100, Math.round(technicalCompetencies * 0.4 + projectExperience * 0.3 + internships * 0.3));

  const careerReadinessScore = Math.min(
    100,
    Math.round(
      resumeQuality * 0.15 +
      technicalCompetencies * 0.25 +
      projectExperience * 0.20 +
      certifications * 0.10 +
      internships * 0.15 +
      academicPerformance * 0.15
    )
  );

  const strengths = [];
  if (matched.length) strengths.push(`Verified competency in key target skills: ${matched.slice(0, 4).join(', ')}`);
  if (resumeQuality >= 70) strengths.push(`Strong ATS-compatible resume profile (Score: ${resumeQuality}/100)`);
  if (projectCount > 0) strengths.push(`Demonstrated hands-on experience through ${projectCount} project(s)`);
  if (academicPerformance >= 80) strengths.push('Consistent academic track record');
  if (!strengths.length) strengths.push('Active career development orientation and profile setup');

  const missingCompetencies = missing.slice(0, 6);
  if (!missingCompetencies.length) missingCompetencies.push('Advanced system architecture & high-scale optimization');

  const recommendations = [];
  if (missing.length) recommendations.push(`Bridge skill gaps by learning: ${missing.slice(0, 3).join(', ')}`);
  if (projectCount < 2) recommendations.push(`Build and deploy an additional end-to-end portfolio project tailored to ${roleName}`);
  if (certCount === 0) recommendations.push(`Obtain an industry-recognized certification in ${roleName} core technologies`);
  if (resumeQuality < 75) recommendations.push('Refine resume bullet points with quantified results and strong action verbs');

  return {
    careerReadinessScore,
    breakdown: {
      resumeQuality,
      technicalCompetencies,
      projectExperience,
      certifications,
      internships,
      academicPerformance,
      alignmentWithIndustry,
    },
    strengths,
    missingCompetencies,
    evidenceBasedRecommendations: recommendations.slice(0, 4),
    explainableSummary: `Based on an evaluation of your profile for ${roleName}, your overall Career Readiness Score is ${careerReadinessScore}/100. Technical skill alignment is at ${technicalCompetencies}%, resume quality is at ${resumeQuality}%, and practical project experience is at ${projectExperience}%. Following the evidence-based recommendations will accelerate placement readiness.`,
  };
}
