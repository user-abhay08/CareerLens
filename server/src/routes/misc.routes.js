import { Router } from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Recommendation from '../models/Recommendation.js';
import Roadmap from '../models/Roadmap.js';
import InterviewSession from '../models/InterviewSession.js';
import CareerReadiness from '../models/CareerReadiness.js';
import JobApplication from '../models/JobApplication.js';
import SkillDatabase from '../models/SkillDatabase.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { aiStatus } from '../services/ai/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'CareerLens API', time: new Date().toISOString() });
});

router.get('/ai-status', async (_req, res) => {
  res.json(await aiStatus());
});

/** Skills catalog per Data Management Layer */
router.get('/skills', async (req, res, next) => {
  try {
    const category = req.query.category;
    const query = category ? { category } : {};
    const skills = await SkillDatabase.find(query).sort({ name: 1 }).limit(100);
    res.json({ skills });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const [
      profile,
      resumeCount,
      bestResume,
      recommendationCount,
      latestRecommendation,
      roadmapCount,
      latestRoadmap,
      interviewCount,
      sessions,
      latestReadiness,
      applicationCount,
    ] = await Promise.all([
      Profile.findOne({ user: req.user.id }).lean(),
      ResumeAnalysis.countDocuments({ user: req.user.id }),
      ResumeAnalysis.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      Recommendation.countDocuments({ user: req.user.id }),
      Recommendation.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      Roadmap.countDocuments({ user: req.user.id }),
      Roadmap.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      InterviewSession.countDocuments({ user: req.user.id }),
      InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(),
      CareerReadiness.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
      JobApplication.countDocuments({ user: req.user.id }),
    ]);

    const graded = [];
    for (const s of sessions) {
      for (const a of s.answers || []) graded.push(a.score);
    }
    const avgInterviewScore = graded.length ? Math.round((graded.reduce((s, x) => s + x, 0) / graded.length) * 10) / 10 : null;

    const careerReadinessScore =
      latestReadiness?.careerReadinessScore ??
      bestResume?.result?.resumeQualityScore ??
      bestResume?.result?.atsScore ??
      null;

    res.json({
      profile: profile || null,
      stats: {
        resumesAnalyzed: resumeCount,
        latestAtsScore: bestResume?.result?.atsScore ?? null,
        careerReadinessScore,
        latestReadinessScore: careerReadinessScore,
        careerMatches: recommendationCount,
        topCareer: latestRecommendation?.careers?.[0]?.title ?? null,
        roadmaps: roadmapCount,
        currentRoadmap: latestRoadmap?.targetRole ?? null,
        interviewSessions: interviewCount,
        avgInterviewScore,
        jobApplications: applicationCount,
      },
      latestReadiness: latestReadiness || null,
    });
  } catch (err) {
    next(err);
  }
});

/** Module 7: Recruiter and placement-coordinator analytics dashboard */
router.get('/dashboard/cohort', requireAuth, requireRole('recruiter', 'placement_coordinator', 'admin'), async (_req, res, next) => {
  try {
    const [totalStudents, totalResumes, totalApplications, readinessList] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      ResumeAnalysis.countDocuments(),
      JobApplication.countDocuments(),
      CareerReadiness.find().sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    const avgReadiness = readinessList.length
      ? Math.round(readinessList.reduce((acc, r) => acc + (r.careerReadinessScore || 0), 0) / readinessList.length)
      : null;

    res.json({
      cohort: {
        totalStudents,
        totalResumes,
        totalApplications,
        averageReadinessScore: avgReadiness,
        recentReadinessReports: readinessList.slice(0, 10),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
