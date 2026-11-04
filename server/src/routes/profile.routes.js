import { Router } from 'express';
import { z } from 'zod';
import Profile from '../models/Profile.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const educationSchema = z.object({
  degree: z.string().trim().max(120).optional().default(''),
  institution: z.string().trim().max(120).optional().default(''),
  year: z.string().trim().max(20).optional().default(''),
  cgpa: z.number().min(0).max(10).optional().nullable(),
  percentage: z.number().min(0).max(100).optional().nullable(),
});

const experienceSchema = z.object({
  title: z.string().trim().max(120).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  duration: z.string().trim().max(60).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
});

const projectSchema = z.object({
  title: z.string().trim().max(140).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
  technologies: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  githubUrl: z.string().trim().max(200).optional().default(''),
  liveUrl: z.string().trim().max(200).optional().default(''),
  duration: z.string().trim().max(60).optional().default(''),
});

const certificationSchema = z.object({
  title: z.string().trim().max(140).optional().default(''),
  issuer: z.string().trim().max(140).optional().default(''),
  issueDate: z.string().trim().max(40).optional().default(''),
  credentialUrl: z.string().trim().max(200).optional().default(''),
});

const internshipSchema = z.object({
  role: z.string().trim().max(120).optional().default(''),
  company: z.string().trim().max(120).optional().default(''),
  duration: z.string().trim().max(60).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
});

const profileSchema = z.object({
  headline: z.string().trim().max(140).optional().default(''),
  bio: z.string().trim().max(1000).optional().default(''),
  targetRole: z.string().trim().max(120).optional().default(''),
  targetCareerDomain: z.string().trim().max(120).optional().default(''),
  skills: z.array(z.string().trim().max(60)).max(60).optional().default([]),
  technicalSkills: z.array(z.string().trim().max(60)).max(60).optional().default([]),
  softSkills: z.array(z.string().trim().max(60)).max(40).optional().default([]),
  interests: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  education: z.array(educationSchema).max(10).optional().default([]),
  experience: z.array(experienceSchema).max(10).optional().default([]),
  experienceYears: z.number().min(0).max(60).optional().default(0),
  projects: z.array(projectSchema).max(20).optional().default([]),
  certifications: z.array(certificationSchema).max(20).optional().default([]),
  internships: z.array(internshipSchema).max(10).optional().default([]),
  achievements: z.array(z.string().trim().max(200)).max(20).optional().default([]),
  extracurricularActivities: z.array(z.string().trim().max(200)).max(20).optional().default([]),
  academicPerformance: z
    .object({
      cgpa: z.number().min(0).max(10).optional().nullable(),
      percentage: z.number().min(0).max(100).optional().nullable(),
    })
    .optional()
    .default({ cgpa: null, percentage: null }),
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
    const profile = (await Profile.findOne({ user: req.user.id }).lean()) || {
      skills: [],
      technicalSkills: [],
      softSkills: [],
      interests: [],
      education: [],
      experience: [],
      experienceYears: 0,
      projects: [],
      certifications: [],
      internships: [],
      achievements: [],
      extracurricularActivities: [],
      academicPerformance: { cgpa: null, percentage: null },
      links: {},
      headline: '',
      bio: '',
      targetRole: '',
      targetCareerDomain: '',
    };
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

router.put('/', requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    // Keep skills and technicalSkills synchronized if only one is provided
    if (data.skills?.length && !data.technicalSkills?.length) {
      data.technicalSkills = [...data.skills];
    } else if (data.technicalSkills?.length && !data.skills?.length) {
      data.skills = [...data.technicalSkills];
    }
    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: { ...data, user: req.user.id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ profile });
  } catch (err) {
    next(err);
  }
});

export default router;
