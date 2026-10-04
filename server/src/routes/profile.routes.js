import { Router } from 'express';
import { z } from 'zod';
import Profile from '../models/Profile.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const educationSchema = z.object({
  degree: z.string().trim().max(120).optional().default(''),
  institution: z.string().trim().max(120).optional().default(''),
  year: z.string().trim().max(20).optional().default(''),
});

const experienceSchema = z.object({
  title: z.string().trim().max(120).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  duration: z.string().trim().max(60).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
});

const profileSchema = z.object({
  headline: z.string().trim().max(140).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
  skills: z.array(z.string().trim().max(60)).max(60).optional().default([]),
  interests: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  education: z.array(educationSchema).max(10).optional().default([]),
  experience: z.array(experienceSchema).max(10).optional().default([]),
  experienceYears: z.number().min(0).max(60).optional().default(0),
  targetRole: z.string().trim().max(120).optional().default(''),
  links: z
    .object({
      github: z.string().trim().max(200).optional().default(''),
      linkedin: z.string().trim().max(200).optional().default(''),
      portfolio: z.string().trim().max(200).optional().default(''),
    })
    .optional()
    .default({ github: '', linkedin: '', portfolio: '' }),
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const profile = (await Profile.findOne({ user: req.user.id }).lean()) || { skills: [], interests: [], education: [], experience: [], links: {}, headline: '', bio: '', targetRole: '', experienceYears: 0 };
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: { ...data, user: req.user.id } }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
