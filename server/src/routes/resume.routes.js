import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { analyzeResume } from '../services/resume.service.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf') || file.mimetype.startsWith('text/');
    if (!ok) return cb(new Error('Only PDF or text files are supported'));
    cb(null, true);
  },
});

const textSchema = z.object({
  text: z.string().min(80, 'Paste at least a few lines of your resume text'),
  roleContext: z.string().trim().max(120).optional().default(''),
});

router.post('/analyze', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    let text = '';
    let roleContext = '';
    if (req.file) {
      text = req.body.text || '';
      roleContext = req.body.roleContext || '';
    } else {
      ({ text, roleContext } = textSchema.parse(req.body));
    }
    const { analysis, notice } = await analyzeResume({
      user: req.user.id,
      file: req.file,
      text,
      roleContext,
    });
    res.status(201).json({ analysis, notice: notice || null });
  } catch (err) {
    if (err.message === 'Only PDF or text files are supported') return next(AppError(err.message, 400));
    if (err.code === 'LIMIT_FILE_SIZE') return next(AppError('File too large — max 5 MB', 400));
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const analyses = await ResumeAnalysis.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(20);
    res.json({ analyses });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const analysis = await ResumeAnalysis.findOne({ _id: req.params.id, user: req.user.id });
    if (!analysis) throw AppError('Analysis not found', 404);
    res.json({ analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
