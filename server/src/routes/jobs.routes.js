import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errors.js';
import { searchJobs } from '../services/jobs.service.js';
import JobApplication from '../models/JobApplication.js';

const router = Router();

const querySchema = z.object({
  role: z.string().trim().min(2).max(120),
  location: z.string().trim().max(120).optional().default(''),
  jobType: z.enum(['any', 'fulltime', 'intern', 'contractor', 'parttime']).optional().default('any'),
  experience: z.enum(['any', 'entry', 'senior']).optional().default('any'),
  postedWithin: z.enum(['any', 'today', '3days', 'week', 'month']).optional().default('any'),
  minSalary: z.coerce.number().min(0).max(100000000).optional(),
  remoteOnly: z
    .enum(['true', 'false'])
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
});

const applicationSchema = z.object({
  jobTitle: z.string().trim().min(2).max(140),
  company: z.string().trim().min(1).max(140),
  source: z.enum(['LinkedIn', 'Remotive', 'Direct']).optional().default('LinkedIn'),
  portalUrl: z.string().trim().max(500).optional().default(''),
  status: z
    .enum(['applied', 'screening', 'interviewing', 'offered', 'rejected', 'accepted'])
    .optional()
    .default('applied'),
  notes: z.string().trim().max(1000).optional().default(''),
});

/** Live job search restricted strictly to LinkedIn & Remotive */
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { role, location, jobType, experience, postedWithin, minSalary, remoteOnly } = querySchema.parse(req.query);
    const result = await searchJobs({ role, location, filters: { jobType, experience, postedWithin, minSalary, remoteOnly } });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** Module 7: Application Tracking & Progress Management */
router.get('/applications', requireAuth, async (req, res, next) => {
  try {
    const applications = await JobApplication.find({ user: req.user.id }).sort({ appliedAt: -1 }).limit(50);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
});

router.post('/applications', requireAuth, async (req, res, next) => {
  try {
    const data = applicationSchema.parse(req.body);
    const application = await JobApplication.create({
      ...data,
      user: req.user.id,
    });
    res.status(201).json({ application });
  } catch (err) {
    next(err);
  }
});

router.patch('/applications/:id', requireAuth, async (req, res, next) => {
  try {
    const { status, notes } = z
      .object({
        status: z.enum(['applied', 'screening', 'interviewing', 'offered', 'rejected', 'accepted']).optional(),
        notes: z.string().trim().max(1000).optional(),
      })
      .parse(req.body);

    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { ...(status ? { status } : {}), ...(notes !== undefined ? { notes } : {}) } },
      { new: true }
    );
    if (!application) throw AppError('Application not found', 404);
    res.json({ application });
  } catch (err) {
    next(err);
  }
});

router.delete('/applications/:id', requireAuth, async (req, res, next) => {
  try {
    const application = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!application) throw AppError('Application not found', 404);
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    next(err);
  }
});

export default router;
