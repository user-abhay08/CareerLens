import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';
import { deterministicSemanticEmbedding, toSql } from '../services/ai/embedding.service.js';

export class JobPosting {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      title: row.title,
      company: row.company,
      companyInfo: '',
      description: row.description || '',
      requiredSkills: parseJson(row.required_skills, []),
      eligibilityCriteria: parseJson(row.eligibility_criteria, []),
      location: row.location || 'India',
      source: row.source || 'LinkedIn',
      url: row.url || '',
      salary: row.salary || '',
      jobType: row.job_type || 'fulltime',
      experienceLevel: row.experience_level || 'entry',
      snippet: row.snippet || '',
      isActive: row.is_active !== false,
      postedAt: row.created_at,
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM job_postings WHERE is_active = true';
    const params = [];

    if (filter.source) {
      if (typeof filter.source === 'string') {
        params.push(filter.source);
        sql += ` AND source = $${params.length}`;
      } else if (filter.source.$in && Array.isArray(filter.source.$in)) {
        params.push(filter.source.$in);
        sql += ` AND source = ANY($${params.length})`;
      }
    }

    if (filter.jobType && filter.jobType !== 'any') {
      params.push(filter.jobType);
      sql += ` AND job_type = $${params.length}`;
    }

    if (filter.experienceLevel && filter.experienceLevel !== 'any') {
      params.push(filter.experienceLevel);
      sql += ` AND experience_level = $${params.length}`;
    }

    return new QueryBuilder({
      baseSql: sql,
      params,
      isSingle: false,
      mapRow: JobPosting.fromRow,
    });
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query('SELECT * FROM job_postings WHERE id::text = $1 LIMIT 1', [id.toString()]);
    return res.rows[0] ? JobPosting.fromRow(res.rows[0]) : null;
  }

  static async countDocuments(filter = {}) {
    const res = await query('SELECT COUNT(*) AS count FROM job_postings WHERE is_active = true');
    return parseInt(res.rows[0].count, 10);
  }

  static async insertMany(jobs = []) {
    const inserted = [];
    for (const job of jobs) {
      const textToEmbed = `${job.title} ${job.company} ${job.description || ''} ${(job.requiredSkills || []).join(' ')}`;
      const embedding = deterministicSemanticEmbedding(textToEmbed, 384);
      const vectorSql = toSql(embedding);

      const res = await query(
        `INSERT INTO job_postings (
          title, company, description, required_skills, eligibility_criteria,
          location, source, url, salary, job_type, experience_level,
          snippet, embedding, is_active
        ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, $13::vector, $14)
        RETURNING *`,
        [
          job.title,
          job.company,
          job.description || '',
          JSON.stringify(job.requiredSkills || []),
          JSON.stringify(job.eligibilityCriteria || []),
          job.location || 'India',
          job.source || 'LinkedIn',
          job.url || '',
          job.salary || '',
          job.jobType || 'fulltime',
          job.experienceLevel || 'entry',
          job.snippet || '',
          vectorSql,
          job.isActive !== false,
        ]
      );
      inserted.push(JobPosting.fromRow(res.rows[0]));
    }
    return inserted;
  }
}

export default JobPosting;
