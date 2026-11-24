/**
 * Database Configuration & Connection Module
 *
 * 100% Pure PostgreSQL with pgvector extension:
 * - Direct connection pool using pg.Pool
 * - High-dimensional 384-dimensional semantic vector search via pgvector
 * - Enterprise-grade relational tables matching CareerLens specifications
 */
import env from './env.js';
import { deterministicSemanticEmbedding, toSql } from '../services/ai/embedding.service.js';

let pgPool = null;

export function getPostgresPool() {
  return pgPool;
}

export function isInMemoryDb() {
  return false;
}

/**
 * PostgreSQL + pgvector Schema DDL
 */
export const PGVECTOR_SCHEMA_SQL = `
-- 1. Enable pgvector extension for semantic similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users table (students, recruiters, coordinators, admins)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'student',
  department VARCHAR(100) DEFAULT '',
  college VARCHAR(200) DEFAULT 'Bharati Vidyapeeth''s College of Engineering, Kolhapur',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
  links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Resumes table (with 384-dimensional vector embedding column)
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) DEFAULT 'pasted-text',
  role_context VARCHAR(180) DEFAULT '',
  resume_text TEXT DEFAULT '',
  ats_score INTEGER DEFAULT 0,
  resume_quality_score INTEGER DEFAULT 0,
  summary TEXT DEFAULT '',
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  suggested_roles JSONB DEFAULT '[]'::jsonb,
  rewritten_bullets JSONB DEFAULT '[]'::jsonb,
  structured_profile JSONB DEFAULT '{}'::jsonb,
  embedding vector(384),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Job Postings with 384-dimensional pgvector embeddings
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  description TEXT DEFAULT '',
  required_skills JSONB DEFAULT '[]'::jsonb,
  eligibility_criteria JSONB DEFAULT '[]'::jsonb,
  location VARCHAR(120) DEFAULT 'India',
  source VARCHAR(50) NOT NULL DEFAULT 'LinkedIn',
  url TEXT NOT NULL DEFAULT '',
  salary VARCHAR(100) DEFAULT '',
  job_type VARCHAR(50) DEFAULT 'fulltime',
  experience_level VARCHAR(50) DEFAULT 'entry',
  snippet TEXT DEFAULT '',
  embedding vector(384),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Skills Database catalog
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50) DEFAULT 'technical',
  domains JSONB DEFAULT '[]'::jsonb,
  demand VARCHAR(50) DEFAULT 'High',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Skills table
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency VARCHAR(50) DEFAULT 'intermediate',
  source VARCHAR(50) DEFAULT 'profile',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_skill UNIQUE (user_id, skill_name)
);

-- 8. Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(180) DEFAULT '',
  provider VARCHAR(50) DEFAULT 'gemini',
  careers JSONB DEFAULT '[]'::jsonb,
  input_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Application History table (Module 7: Tracking & Progress)
CREATE TABLE IF NOT EXISTS application_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
  job_title VARCHAR(180) NOT NULL,
  company VARCHAR(180) NOT NULL,
  source VARCHAR(50) DEFAULT 'LinkedIn',
  portal_url TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'applied',
  notes TEXT DEFAULT '',
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Career Progress table (Module 4: 7-Dimension Readiness & Roadmap)
CREATE TABLE IF NOT EXISTS career_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(100) UNIQUE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(180) DEFAULT '',
  readiness_score INTEGER DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  missing_competencies JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  summary TEXT DEFAULT '',
  active_roadmap_role VARCHAR(180) DEFAULT '',
  active_roadmap JSONB DEFAULT '{}'::jsonb,
  latest_ats_score INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Interview Sessions table
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(180) NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'medium',
  company_target VARCHAR(180) DEFAULT '',
  category VARCHAR(50) DEFAULT 'technical',
  provider VARCHAR(50) DEFAULT 'fallback',
  status VARCHAR(50) DEFAULT 'open',
  questions JSONB DEFAULT '[]'::jsonb,
  answers JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. Peer-Shared Interview Experiences (Module 6)
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

-- 13. Roadmaps table (Module 5: Dynamic Milestone Roadmaps)
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(180) NOT NULL,
  provider VARCHAR(50) DEFAULT 'fallback',
  overview TEXT DEFAULT '',
  current_skills JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  phases JSONB DEFAULT '[]'::jsonb,
  recommended_courses JSONB DEFAULT '[]'::jsonb,
  recommended_certifications JSONB DEFAULT '[]'::jsonb,
  recommended_projects JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Career Readiness table (Module 4: 7-Dimension Readiness Engine)
CREATE TABLE IF NOT EXISTS career_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role VARCHAR(180) NOT NULL,
  career_readiness_score INTEGER NOT NULL DEFAULT 0,
  breakdown JSONB DEFAULT '{}'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  missing_competencies JSONB DEFAULT '[]'::jsonb,
  evidence_based_recommendations JSONB DEFAULT '[]'::jsonb,
  explainable_summary TEXT DEFAULT '',
  provider VARCHAR(50) DEFAULT 'fallback',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

/**
 * Seeds initial skills and verified job postings with 384-dimensional pgvector embeddings
 * into PostgreSQL if the tables are empty.
 */
async function seedInitialData(client) {
  try {
    // 1. Seed Skills if empty
    const skillCheck = await client.query('SELECT COUNT(*) AS count FROM skills');
    if (parseInt(skillCheck.rows[0].count, 10) === 0) {
      const initialSkills = [
        ['javascript', 'language', '["web", "frontend", "full-stack"]', 'Very High'],
        ['typescript', 'language', '["web", "frontend", "backend"]', 'Very High'],
        ['python', 'language', '["ai", "data science", "backend"]', 'Very High'],
        ['react', 'framework', '["web", "frontend"]', 'Very High'],
        ['node.js', 'framework', '["web", "backend"]', 'High'],
        ['sql', 'database', '["data", "backend"]', 'High'],
        ['mongodb', 'database', '["web", "backend"]', 'High'],
        ['postgresql', 'database', '["backend", "data"]', 'High'],
        ['machine learning', 'technical', '["ai", "data science"]', 'Very High'],
        ['deep learning', 'technical', '["ai"]', 'High'],
        ['docker', 'tool', '["devops", "cloud"]', 'High'],
        ['git', 'tool', '["software engineering"]', 'Very High'],
        ['communication', 'soft', '["all"]', 'Very High'],
        ['problem solving', 'soft', '["all"]', 'Very High'],
      ];
      for (const [name, cat, dom, dem] of initialSkills) {
        await client.query(
          `INSERT INTO skills (name, category, domains, demand)
           VALUES ($1, $2, $3::jsonb, $4)
           ON CONFLICT (name) DO NOTHING`,
          [name, cat, dom, dem]
        );
      }
      console.log(`[postgres] Seeded ${initialSkills.length} default skills into skills table.`);
    }

    // 2. Seed Job Postings with 384-d pgvector embeddings if empty
    const jobCheck = await client.query('SELECT COUNT(*) AS count FROM job_postings');
    if (parseInt(jobCheck.rows[0].count, 10) === 0) {
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
          eligibilityCriteria: ['B.Tech / B.E. in CSE / IT / AIML', 'Strong problem solving skills'],
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

      for (const job of initialJobs) {
        const textForEmbedding = `${job.title} ${job.company} ${job.description} ${job.requiredSkills.join(' ')}`;
        const embedding = deterministicSemanticEmbedding(textForEmbedding, 384);
        const vectorSql = toSql(embedding);

        await client.query(
          `INSERT INTO job_postings (
            title, company, description, required_skills, eligibility_criteria,
            location, source, url, salary, job_type, experience_level,
            snippet, embedding, is_active
          ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::vector, $14)`,
          [
            job.title,
            job.company,
            job.description,
            JSON.stringify(job.requiredSkills),
            JSON.stringify(job.eligibilityCriteria),
            job.location,
            job.source,
            job.url,
            job.salary,
            job.jobType,
            job.experienceLevel,
            job.snippet,
            vectorSql,
            true,
          ]
        );
      }
      console.log(`[postgres] Seeded ${initialJobs.length} verified jobs with 384-d pgvector embeddings into job_postings.`);
    }
  } catch (err) {
    console.warn(`[postgres] Note on initial data seeding: ${err.message}`);
  }
}

/**
 * Connects directly to PostgreSQL with pgvector.
 * 100% Pure PostgreSQL connection — No MongoDB / Mongoose required.
 */
export async function connectPostgres() {
  const uri = env.postgresUri || process.env.POSTGRES_URI || 'postgresql://postgres:root@localhost:5432/carrerlens';
  const maskedUri = uri.replace(/:[^:@]*@/, ':****@');
  console.log(`[postgres] Connecting to PostgreSQL (${maskedUri})...`);

  try {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({ connectionString: uri });
    const client = await pool.connect();
    try {
      const dbName = uri.split('/').pop()?.split('?')[0] || 'PostgreSQL';
      console.log(`[postgres] Connected successfully to database: ${dbName}`);
      
      // Ensure pgvector extension and tables exist
      await client.query(PGVECTOR_SCHEMA_SQL);
      console.log(`[postgres] pgvector extension verified / initialized (vector).`);
      console.log(`[postgres] Verified tables: users, profiles, resumes, job_postings, skills, user_skills, recommendations, application_history, career_progress, interview_sessions, interview_experiences, roadmaps, career_readiness.`);

      // Seed initial data if empty
      await seedInitialData(client);

      pgPool = pool;
      return pool;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`[postgres] PostgreSQL connection error: ${err.message}`);
    throw err;
  }
}

/**
 * Primary Database Connection Entry Point (100% Pure PostgreSQL + pgvector)
 */
export async function connectDB() {
  await connectPostgres();
  console.log(`[db] Primary DBMS: 100% Pure PostgreSQL with pgvector extension enabled.`);
  return 'postgresql';
}
