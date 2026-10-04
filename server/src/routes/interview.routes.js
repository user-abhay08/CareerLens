import { Router } from 'express';
import { z } from 'zod';
import InterviewSession from '../models/InterviewSession.js';
import { requireAuth } from '../middleware/auth.js';
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
    const { role, difficulty } = z
      .object({
        role: z.string().trim().min(2, 'Enter a target role').max(120),
        difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
      })
      .parse(req.body);
    const { session, notice } = await createInterviewSession({ user: req.user.id, role, difficulty });
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

export default router;
