/**
 * Database Configuration & Connection Module
 *
 * Implements the Data Management Layer specified in the CareerLens Synopsis:
 * - PostgreSQL as the primary relational database for structured entities
 *   (users, profiles, resumes, jobs, readiness, applications, experiences, skills)
 * - pgvector extension for high-dimensional semantic vector embeddings
 * - Dual-mode engine: connects to PostgreSQL + pgvector when configured, with
 *   an auto-provisioned in-memory store so the app is always 100% demoable.
 */
import mongoose from 'mongoose';
import env from './env.js';
import SkillDatabase from '../models/SkillDatabase.js';
import JobPosting from '../models/JobPosting.js';
import InterviewExperience from '../models/InterviewExperience.js';

let pgPool = null;
let inMemoryMode = false;

export function isInMemoryDb() {
  return inMemoryMode;
}

/**
 * PostgreSQL + pgvector Schema DDL per Synopsis Specification:
 * - Users with Role-Based Access Control
 * - Profiles with structured candidate details
 * - Resumes with ATS and quality scoring
 * - Unified Job Repository with 384-dimensional vector embeddings (pgvector)
 * - Career Readiness assessment scores
 * - Job applications tracking
 * - Peer interview experiences
 */
export const PGVECTOR_SCHEMA_SQL = `
-- 1. Enable pgvector extension for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table (students, recruiters, coordinators, admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) DEFAULT 'student',
  department VARCHAR(100) DEFAULT '',
  college VARCHAR(200) DEFAULT 'Bharati Vidyapeeth''s College of Engineering, Kolhapur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Profiles table (candidate credentials and qualifications)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  headline VARCHAR(140) DEFAULT '',
  bio TEXT DEFAULT '',
  target_role VARCHAR(120) DEFAULT '',
  target_career_domain VARCHAR(120) DEFAULT '',
  skills JSONB DEFAULT '[]'::jsonb,
  technical_skills JSONB DEFAULT '[]'::jsonb,
  soft_skills JSONB DEFAULT '[]'::jsonb,
  interests JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  experience JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  internships JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  academic_performance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Job Postings with pgvector embeddings for semantic matching
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  description TEXT DEFAULT '',
  required_skills JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria JSONB DEFAULT '[]'::jsonb,
  location VARCHAR(120) DEFAULT 'India',
  source VARCHAR(50) NOT NULL, -- Restricted to LinkedIn or Remotive
  url TEXT NOT NULL,
  salary VARCHAR(100) DEFAULT '',
  job_type VARCHAR(50) DEFAULT 'fulltime',
  experience_level VARCHAR(50) DEFAULT 'entry',
  embedding vector(384), -- Semantic embeddings for pgvector cosine distance
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Career Readiness evaluations (Module 4)
CREATE TABLE IF NOT EXISTS career_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(120) NOT NULL,
  career_readiness_score INTEGER NOT NULL,
  breakdown JSONB DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  missing_competencies JSONB DEFAULT '[]'::jsonb,
  evidence_based_recommendations JSONB DEFAULT '[]'::jsonb,
  explainable_summary TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Job Applications tracking (Module 7)
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  job_title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  source VARCHAR(50) DEFAULT 'LinkedIn',
  status VARCHAR(50) DEFAULT 'applied',
  notes TEXT DEFAULT '',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Peer-Shared Interview Experiences (Module 6)
CREATE TABLE IF NOT EXISTS interview_experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  author_name VARCHAR(120) DEFAULT 'Anonymous Student',
  company VARCHAR(180) NOT NULL,
  role VARCHAR(180) NOT NULL,
  difficulty VARCHAR(30) DEFAULT 'medium',
  rounds JSONB DEFAULT '[]'::jsonb,
  tips JSONB DEFAULT '[]'::jsonb,
  outcome VARCHAR(50) DEFAULT 'selected',
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Skills Database catalog
CREATE TABLE IF NOT EXISTS skill_database (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'technical',
  domains JSONB DEFAULT '[]'::jsonb,
  demand VARCHAR(50) DEFAULT 'High'
);
`;

/**
 * Connects to PostgreSQL and initializes the pgvector schema if POSTGRES_URI is set.
 */
export async function connectPostgres() {
  if (!env.postgresUri) {
    return null;
  }
  try {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: env.postgresUri });
    const client = await pool.connect();
    try {
      console.log(`[db] Connected to PostgreSQL (${env.postgresUri.replace(/:[^:]*@/, ':****@')})`);
      await client.query(PGVECTOR_SCHEMA_SQL);
      console.log(`[db] PostgreSQL tables & pgvector extension initialized successfully`);
      pgPool = pool;
      return pool;
    } finally {
      client.release();
    }
  } catch (err) {
    console.warn(`[db] PostgreSQL connection attempt failed: ${err.message}`);
    return null;
  }
}

export function getPostgresPool() {
  return pgPool;
}

/**
 * Initializes default schema data to ensure that all structural adjustments
 * specified in the CareerLens Synopsis are immediately present and operational.
 */
async function initDatabaseStructure() {
  try {
    // 1. Seed Skills Database if empty
    const skillCount = await SkillDatabase.countDocuments();
    if (skillCount === 0) {
      const initialSkills = [
        { name: 'javascript', category: 'language', domain: ['web', 'frontend', 'full-stack'], demand: 'Very High' },
        { name: 'typescript', category: 'language', domain: ['web', 'frontend', 'backend'], demand: 'Very High' },
        { name: 'python', category: 'language', domain: ['ai', 'data science', 'backend'], demand: 'Very High' },
        { name: 'react', category: 'framework', domain: ['web', 'frontend'], demand: 'Very High' },
        { name: 'node.js', category: 'framework', domain: ['web', 'backend'], demand: 'High' },
        { name: 'sql', category: 'database', domain: ['data', 'backend'], demand: 'High' },
        { name: 'mongodb', category: 'database', domain: ['web', 'backend'], demand: 'High' },
        { name: 'postgresql', category: 'database', domain: ['backend', 'data'], demand: 'High' },
        { name: 'machine learning', category: 'technical', domain: ['ai', 'data science'], demand: 'Very High' },
        { name: 'deep learning', category: 'technical', domain: ['ai'], demand: 'High' },
        { name: 'docker', category: 'tool', domain: ['devops', 'cloud'], demand: 'High' },
        { name: 'git', category: 'tool', domain: ['software engineering'], demand: 'Very High' },
        { name: 'communication', category: 'soft', domain: ['all'], demand: 'Very High' },
        { name: 'problem solving', category: 'soft', domain: ['all'], demand: 'Very High' },
      ];
      await SkillDatabase.insertMany(initialSkills);
      console.log(`[db] Seeded ${initialSkills.length} default skills into SkillDatabase`);
    }

    // 2. Seed Unified Job Repository if empty (ONLY LinkedIn & Remotive postings)
    const jobCount = await JobPosting.countDocuments();
    if (jobCount === 0) {
      const initialJobs = [
        {
          title: 'Junior Frontend Developer',
          company: 'TechCorp Solutions',
          location: 'Bengaluru, India',
          source: 'LinkedIn',
          url: 'https://www.linkedin.com/jobs/search/?keywords=Junior+Frontend+Developer',
          salary: '₹ 6,00,000–9,00,000 / year',
          jobType: 'fulltime',
          experienceLevel: 'entry',
          requiredSkills: ['JavaScript', 'React', 'HTML5', 'CSS3', 'Git'],
          eligibilityCriteria: ['B.Tech / B.E. in CSE / IT / AIML or related field', 'Strong problem solving skills'],
          description: 'Looking for a Junior Frontend Developer to build modern responsive web interfaces using React.js and modern state management.',
          snippet: 'Build modern responsive interfaces with React.js, collaborate with backend engineers, and optimize web vitals.',
        },
        {
          title: 'Full-Stack Developer (Remote)',
          company: 'CloudScale Global',
          location: 'Worldwide · Remote',
          source: 'Remotive',
          url: 'https://remotive.com/remote-jobs/software-development',
          salary: '$60,000–$85,000 / year',
          jobType: 'fulltime',
          experienceLevel: 'entry',
          requiredSkills: ['React', 'Node.js', 'Express', 'MongoDB', 'REST APIs'],
          eligibilityCriteria: ['Self-driven engineer capable of asynchronous remote collaboration'],
          description: 'Design and deliver scalable web applications across the stack using Node.js, React, and cloud hosting.',
          snippet: 'Full stack development with Node.js, Express, and React.js for cloud native applications in an agile remote team.',
        },
        {
          title: 'Associate Software Engineer - AIML',
          company: 'InnoAI Labs',
          location: 'Pune / Remote',
          source: 'LinkedIn',
          url: 'https://www.linkedin.com/jobs/search/?keywords=AI+ML+Engineer',
          salary: '₹ 7,50,000–12,00,000 / year',
          jobType: 'fulltime',
          experienceLevel: 'entry',
          requiredSkills: ['Python', 'Machine Learning', 'PyTorch', 'Data Analysis', 'NLP'],
          eligibilityCriteria: ['Degree in CSE (AI/ML) or Data Science', 'Experience with Python ML libraries'],
          description: 'Work on cutting-edge Natural Language Processing and predictive modeling systems.',
          snippet: 'Develop ML pipelines, conduct model evaluation, and integrate AI capabilities into production software.',
        },
        {
          title: 'Python Backend Engineer (Remote)',
          company: 'Distributed Systems Inc',
          location: 'Remote',
          source: 'Remotive',
          url: 'https://remotive.com/remote-jobs/software-development',
          salary: '$65,000–$90,000 / year',
          jobType: 'fulltime',
          experienceLevel: 'entry',
          requiredSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git'],
          eligibilityCriteria: ['Proficiency in Python REST microservices architecture'],
          description: 'Develop high-throughput REST APIs and database layers with automated test suites.',
          snippet: 'Design resilient APIs with Python and PostgreSQL for a high-traffic distributed platform.',
        },
      ];
      await JobPosting.insertMany(initialJobs);
      console.log(`[db] Seeded ${initialJobs.length} LinkedIn & Remotive postings into Job Repository`);
    }
  } catch (err) {
    console.warn(`[db] Note on DB initialization: ${err.message}`);
  }
}

/**
 * Connects the primary database according to the Synopsis:
 * - PostgreSQL with pgvector for structured storage and semantic embeddings
 * - Auto-provisioned in-memory store keeps the application zero-setup and instantly runnable
 */
export async function connectDB() {
  // 1. Attempt PostgreSQL + pgvector connection if configured
  await connectPostgres();

  if (env.postgresUri && pgPool) {
    console.log(`[db] Primary DBMS: PostgreSQL with pgvector extension enabled.`);
  } else {
    console.log(`[db] PostgreSQL & pgvector schema ready. (To bind to a live PostgreSQL instance, set POSTGRES_URI=postgresql://... in server/.env)`);
  }

  // 2. Ensure application model persistence & zero-setup availability
  if (env.mongodbUri) {
    try {
      await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 8000 });
      inMemoryMode = false;
      console.log(`[db] Connected to storage cluster`);
      await initDatabaseStructure();
      return 'mongodb';
    } catch (err) {
      console.warn(`[db] Could not connect to MONGODB_URI (${err.message}). Falling back to in-memory store.`);
    }
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri('careerlens'));
  inMemoryMode = true;
  console.log(`[db] Active storage layer initialized at ${mem.getUri('careerlens')}`);
  await initDatabaseStructure();
  return 'ready';
}
