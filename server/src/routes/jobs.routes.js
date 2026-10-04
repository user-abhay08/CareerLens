import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { searchJobs } from '../services/jobs.service.js';

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

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { role, location, jobType, experience, postedWithin, minSalary, remoteOnly } = querySchema.parse(req.query);
    const result = await searchJobs({ role, location, filters: { jobType, experience, postedWithin, minSalary, remoteOnly } });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
