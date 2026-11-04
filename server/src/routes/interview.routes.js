import { Router } from 'express';
import { z } from 'zod';
import InterviewSession from '../models/InterviewSession.js';
import InterviewExperience from '../models/InterviewExperience.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { createInterviewSession, gradeAnswer } from '../services/interview.service.js';

const router = Router();

router.get('/sessions', requireAuth, async (req, res, next) => {
  try {
    const sessions = await InterviewSession.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions', requireAuth, async (req, res, next) => {
  try {
    const { role, difficulty, companyTarget, category } = z
      .object({
        role: z.string().trim().min(2, 'Enter a target role').max(120),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
        companyTarget: z.string().trim().max(120).optional().default(''),
        category: z.enum(['technical', 'hr', 'aptitude', 'general']).optional().default('technical'),
      })
      .parse(req.body);
    const { session, notice } = await createInterviewSession({ user: req.user.id, role, difficulty, companyTarget, category });
    res.status(201).json({ session, notice: notice || null });
  } catch (err) {
    next(err);
  }
});

router.post('/sessions/:id/answer', requireAuth, async (req, res, next) => {
  try {
    const { questionIndex, answer } = z
      .object({
        questionIndex: z.number().int().min(0).max(20),
        answer: z.string().trim().min(5, 'Write your answer first (at least a sentence)').max(6000),
      })
      .parse(req.body);
    const { session, feedback, notice } = await gradeAnswer({ user: req.user.id, sessionId: req.params.id, questionIndex, answer });
    res.json({ session, feedback, notice: notice || null });
  } catch (err) {
    next(err);
  }
});

/** Module 6: Peer-shared interview experiences */
const roundSchema = z.object({
  roundName: z.string().trim().max(100).optional().default(''),
  roundType: z.enum(['aptitude', 'technical', 'hr', 'coding', 'managerial']).optional().default('technical'),
  description: z.string().trim().max(1000).optional().default(''),
  questionsAsked: z.array(z.string().trim().max(300)).max(20).optional().default([]),
});

const experienceSchema = z.object({
  company: z.string().trim().min(2, 'Company name is required').max(120),
  role: z.string().trim().min(2, 'Role is required').max(120),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
  rounds: z.array(roundSchema).max(10).optional().default([]),
  tips: z.array(z.string().trim().max(300)).max(10).optional().default([]),
  outcome: z.enum(['selected', 'rejected', 'pending']).optional().default('selected'),
  anonymous: z.boolean().optional().default(false),
});

router.get('/experiences', requireAuth, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.company) {
      filter.company = new RegExp(String(req.query.company).trim(), 'i');
    }
    const experiences = await InterviewExperience.find(filter).sort({ createdAt: -1 }).limit(30);
    res.json({ experiences });
  } catch (err) {
    next(err);
  }
});

router.post('/experiences', requireAuth, async (req, res, next) => {
  try {
    const data = experienceSchema.parse(req.body);
    const experience = await InterviewExperience.create({
      ...data,
      author: req.user.id,
      authorName: data.anonymous ? 'Anonymous Student' : req.user.name,
    });
    res.status(201).json({ experience });
  } catch (err) {
    next(err);
  }
});

router.post('/experiences/:id/upvote', requireAuth, async (req, res, next) => {
  try {
    const exp = await InterviewExperience.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    if (!exp) throw AppError('Experience not found', 404);
    res.json({ experience: exp });
  } catch (err) {
    next(err);
  }
});

export default router;
