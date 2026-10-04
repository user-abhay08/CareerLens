import Recommendation from '../models/Recommendation.js';
import Roadmap from '../models/Roadmap.js';
import Profile from '../models/Profile.js';
import { generateJSON } from './ai/index.js';
import { careerRecommendationPrompt, roadmapPrompt } from './ai/prompts.js';
import { fallbackRecommendations, fallbackRoadmap, normalizeSkill } from './fallback.js';
import { asString, asArray, asStringArray, asNumber, clamp } from '../utils/sanitize.js';

function sanitizeCareers(d) {
  return asArray(d.careers)
    .slice(0, 8)
    .map((c) => ({
      title: asString(c?.title),
      matchScore: clamp(asNumber(c?.matchScore, 0), 0, 100),
      description: asString(c?.description),
      reasons: asStringArray(c?.reasons, 5),
      skillsToLearn: asStringArray(c?.skillsToLearn, 8),
      salaryRange: asString(c?.salaryRange),
      demand: asString(c?.demand, 'Medium'),
    }))
    .filter((c) => c.title)
    .sort((a, b) => b.matchScore - a.matchScore);
}

export async function recommendCareers({ user }) {
  const profile = (await Profile.findOne({ user }).lean()) || {};
  const prompt = careerRecommendationPrompt({ profile });

  let careers;
  let provider = 'fallback';
  let notice;
  try {
    const { data, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.4 });
    careers = sanitizeCareers(data);
    provider = p;
    if (!careers.length) throw new Error('AI returned no careers');
  } catch (err) {
    if (err.message === 'AI_NOT_CONFIGURED') {
      careers = fallbackRecommendations(profile);
    } else {
      console.warn(`[ai] career recommendation failed, using fallback: ${err.message}`);
      careers = fallbackRecommendations(profile);
      notice = `AI request failed (${err.message.slice(0, 140)}). Served built-in matching instead.`;
    }
    provider = 'fallback';
  }

  const doc = await Recommendation.create({
    user,
    provider,
    inputSnapshot: {
      skills: profile.skills || [],
      interests: profile.interests || [],
    },
    careers,
  });
  return { recommendation: doc, notice };
}

function sanitizePhases(d) {
  return asArray(d.phases)
    .slice(0, 8)
    .map((p, i) => ({
      phase: asString(p?.phase, `Phase ${i + 1}`),
      title: asString(p?.title),
      duration: asString(p?.duration),
      focus: asString(p?.focus),
      skills: asStringArray(p?.skills, 8),
      resources: asStringArray(p?.resources, 6),
      milestone: asString(p?.milestone),
    }))
    .filter((p) => p.focus || p.title);
}

export async function buildRoadmap({ user, targetRole }) {
  const profile = (await Profile.findOne({ user }).lean()) || {};
  const prompt = roadmapPrompt({ profile, targetRole });

  let data;
  let provider = 'fallback';
  let notice;
  try {
    const { data: d, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.4 });
    data = d;
    provider = p;
  } catch (err) {
    if (err.message === 'AI_NOT_CONFIGURED') {
      data = fallbackRoadmap({ profile, targetRole });
    } else {
      console.warn(`[ai] roadmap failed, using fallback: ${err.message}`);
      data = fallbackRoadmap({ profile, targetRole });
      notice = `AI request failed (${err.message.slice(0, 140)}). Served built-in roadmap instead.`;
    }
    provider = 'fallback';
  }

  const doc = await Roadmap.create({
    user,
    targetRole,
    provider,
    overview: asString(data.overview),
    currentSkills: profile.skills || [],
    missingSkills: asStringArray(data.missingSkills, 12),
    phases: sanitizePhases(data),
  });
  return { roadmap: doc, notice };
}
