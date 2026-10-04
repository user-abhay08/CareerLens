import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import careerRoutes from './routes/career.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import miscRoutes from './routes/misc.routes.js';
import { notFound, errorHandler } from './middleware/errors.js';
import env from './config/env.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin.split(','), credentials: true }));
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', miscRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/resume', resumeRoutes);
  app.use('/api/careers', careerRoutes);
  app.use('/api/interview', interviewRoutes);
  app.use('/api/jobs', jobsRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
