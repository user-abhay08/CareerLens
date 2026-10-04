import { Router } from 'express';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Recommendation from '../models/Recommendation.js';
import Roadmap from '../models/Roadmap.js';
import InterviewSession from '../models/InterviewSession.js';
import Profile from '../models/Profile.js';
import { requireAuth } from '../middleware/auth.js';
import { aiStatus } from '../services/ai/index.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ ok: true, name: 'CareerLens API', time: new Date().toISOString() });
});

router.get('/ai-status', async (_req, res) => {
  res.json(await aiStatus());
});

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const [profile, resumeCount, bestResume, recommendationCount, latestRecommendation, roadmapCount, latestRoadmap, interviewCount, sessions] =
      await Promise.all([
        Profile.findOne({ user: req.user.id }).lean(),
        ResumeAnalysis.countDocuments({ user: req.user.id }),
        ResumeAnalysis.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
        Recommendation.countDocuments({ user: req.user.id }),
        Recommendation.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
        Roadmap.countDocuments({ user: req.user.id }),
        Roadmap.findOne({ user: req.user.id }).sort({ createdAt: -1 }).lean(),
        InterviewSession.countDocuments({ user: req.user.id }),
        InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(5).lean(),
      ]);

    const graded = [];
    for (const s of sessions) {
      for (const a of s.answers || []) graded.push(a.score);
    }
    const avgInterviewScore = graded.length ? Math.round((graded.reduce((s, x) => s + x, 0) / graded.length) * 10) / 10 : null;

    res.json({
      profile: profile || null,
      stats: {
        resumesAnalyzed: resumeCount,
        latestAtsScore: bestResume?.result?.atsScore ?? null,
        careerMatches: recommendationCount,
        topCareer: latestRecommendation?.careers?.[0]?.title ?? null,
        roadmaps: roadmapCount,
        currentRoadmap: latestRoadmap?.targetRole ?? null,
        interviewSessions: interviewCount,
        avgInterviewScore,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
