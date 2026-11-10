import Recommendation from '../models/Recommendation.js';
import Roadmap from '../models/Roadmap.js';
import Profile from '../models/Profile.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import CareerReadiness from '../models/CareerReadiness.js';
import { generateJSON, formatAiFallbackNotice } from './ai/index.js';
import { careerRecommendationPrompt, roadmapPrompt, careerReadinessPrompt } from './ai/prompts.js';
import { fallbackRecommendations, fallbackRoadmap, fallbackCareerReadiness, normalizeSkill } from './fallback.js';
import { asString, asArray, asStringArray, asNumber, clamp } from '../utils/sanitize.js';

function sanitizeCareers(d) {
  return asArray(d.careers)
    .slice(0, 8)
    .map((c) => {
      const skillsToLearn = asStringArray(c?.skillsToLearn, 8);
      return {
        title: asString(c?.title),
        matchScore: clamp(asNumber(c?.matchScore, 0), 0, 100),
        description: asString(c?.description),
        reasons: asStringArray(c?.reasons, 5),
        skillsToLearn,
        matchingSkills: asStringArray(c?.matchingSkills, 8),
        missingCompetencies: asStringArray(c?.missingCompetencies || skillsToLearn, 8),
        salaryRange: asString(c?.salaryRange),
        demand: asString(c?.demand, 'Medium'),
        recommendedCourses: asStringArray(c?.recommendedCourses, 5),
        recommendedCertifications: asStringArray(c?.recommendedCertifications, 4),
        recommendedProjects: asStringArray(c?.recommendedProjects, 4),
      };
    })
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
    if (err.message !== 'AI_NOT_CONFIGURED' && err.code !== 'AI_NOT_CONFIGURED') {
      console.warn(`[ai] career recommendation failed, using fallback: ${err.message}`);
    }
    careers = fallbackRecommendations(profile);
    notice = formatAiFallbackNotice(err, 'built-in career matching');
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
    if (err.message !== 'AI_NOT_CONFIGURED' && err.code !== 'AI_NOT_CONFIGURED') {
      console.warn(`[ai] roadmap failed, using fallback: ${err.message}`);
    }
    data = fallbackRoadmap({ profile, targetRole });
    notice = formatAiFallbackNotice(err, 'built-in skill roadmap');
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
    recommendedCourses: asArray(data.recommendedCourses)
      .slice(0, 5)
      .map((c) => (typeof c === 'string' ? { title: c } : { title: asString(c?.title), platform: asString(c?.platform), url: asString(c?.url) }))
      .filter((c) => c.title),
    recommendedCertifications: asArray(data.recommendedCertifications)
      .slice(0, 5)
      .map((c) => (typeof c === 'string' ? { title: c } : { title: asString(c?.title), provider: asString(c?.provider) }))
      .filter((c) => c.title),
    recommendedProjects: asArray(data.recommendedProjects)
      .slice(0, 5)
      .map((p) => (typeof p === 'string' ? { title: p } : { title: asString(p?.title), description: asString(p?.description), skills: asStringArray(p?.skills, 8) }))
      .filter((p) => p.title),
  });
  return { roadmap: doc, notice };
}

/**
 * Module 4: Career Readiness Assessment Engine
 * Evaluates candidate preparedness across 7 dimensions using Explainable AI principles.
 */
export async function assessCareerReadiness({ user, targetRole }) {
  const profile = (await Profile.findOne({ user }).lean()) || {};
  const latestResume = await ResumeAnalysis.findOne({ user }).sort({ createdAt: -1 }).lean();
  const role = targetRole || profile.targetRole || 'Software Engineer';

  const prompt = careerReadinessPrompt({ profile, targetRole: role, resumeAnalysis: latestResume });

  let result;
  let provider = 'fallback';
  let notice;
  try {
    const { data, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.3 });
    result = {
      careerReadinessScore: clamp(asNumber(data.careerReadinessScore, 65), 0, 100),
      breakdown: {
        resumeQuality: clamp(asNumber(data.breakdown?.resumeQuality, 65), 0, 100),
        technicalCompetencies: clamp(asNumber(data.breakdown?.technicalCompetencies, 65), 0, 100),
        projectExperience: clamp(asNumber(data.breakdown?.projectExperience, 65), 0, 100),
        certifications: clamp(asNumber(data.breakdown?.certifications, 65), 0, 100),
        internships: clamp(asNumber(data.breakdown?.internships, 65), 0, 100),
        academicPerformance: clamp(asNumber(data.breakdown?.academicPerformance, 65), 0, 100),
        alignmentWithIndustry: clamp(asNumber(data.breakdown?.alignmentWithIndustry, 65), 0, 100),
      },
      strengths: asStringArray(data.strengths, 6),
      missingCompetencies: asStringArray(data.missingCompetencies, 6),
      evidenceBasedRecommendations: asStringArray(data.evidenceBasedRecommendations, 6),
      explainableSummary: asString(data.explainableSummary),
    };
    provider = p;
  } catch (err) {
    result = fallbackCareerReadiness({ profile, targetRole: role, resumeAnalysis: latestResume });
    provider = 'fallback';
    notice = formatAiFallbackNotice(err, 'built-in readiness evaluation');
  }

  const doc = await CareerReadiness.create({
    user,
    targetRole: role,
    careerReadinessScore: result.careerReadinessScore,
    breakdown: result.breakdown,
    strengths: result.strengths,
    missingCompetencies: result.missingCompetencies,
    evidenceBasedRecommendations: result.evidenceBasedRecommendations,
    explainableSummary: result.explainableSummary,
    provider,
  });

  return { readiness: doc, notice };
}
