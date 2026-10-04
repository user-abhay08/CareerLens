import { Router } from 'express';
import { z } from 'zod';
import Recommendation from '../models/Recommendation.js';
import Roadmap from '../models/Roadmap.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { recommendCareers, buildRoadmap } from '../services/career.service.js';

const router = Router();

router.post('/recommend', requireAuth, async (req, res, next) => {
  try {
    const { recommendation, notice } = await recommendCareers({ user: req.user.id });
    res.status(201).json({ recommendation, notice: notice || null });
  } catch (err) {
    next(err);
  }
});

router.get('/recommendations', requireAuth, async (req, res, next) => {
  try {
    const recommendations = await Recommendation.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ recommendations });
  } catch (err) {
    next(err);
  }
});

router.post('/roadmap', requireAuth, async (req, res, next) => {
  try {
    const { targetRole } = z.object({ targetRole: z.string().trim().min(2, 'Enter a target role').max(120) }).parse(req.body);
    const { roadmap, notice } = await buildRoadmap({ user: req.user.id, targetRole });
    res.status(201).json({ roadmap, notice: notice || null });
  } catch (err) {
    next(err);
  }
});

router.get('/roadmaps', requireAuth, async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ roadmaps });
  } catch (err) {
    next(err);
  }
});

router.get('/roadmaps/:id', requireAuth, async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, user: req.user.id });
    if (!roadmap) throw AppError('Roadmap not found', 404);
    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
});

export default router;
