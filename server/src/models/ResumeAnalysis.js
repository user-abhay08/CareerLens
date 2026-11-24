import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';
import { deterministicSemanticEmbedding, toSql } from '../services/ai/embedding.service.js';

export class ResumeAnalysis {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      fileName: row.file_name || 'pasted-text',
      roleContext: row.role_context || '',
      textLength: row.resume_text ? row.resume_text.length : 0,
      provider: 'gemini',
      result: {
        summary: row.summary || '',
        atsScore: Number(row.ats_score || 0),
        resumeQualityScore: Number(row.resume_quality_score || row.ats_score || 0),
        strengths: parseJson(row.strengths, []),
        weaknesses: parseJson(row.weaknesses, []),
        missingSkills: parseJson(row.missing_skills, []),
        keywords: parseJson(row.keywords, []),
        suggestedRoles: parseJson(row.suggested_roles, []),
        rewrittenBullets: parseJson(row.rewritten_bullets, []),
        structuredCandidateProfile: parseJson(row.structured_profile, {}),
      },
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM resumes';
    const params = [];
    const userId = filter.user || filter.userId;

    if (userId) {
      params.push(userId.toString());
      sql += ' WHERE user_id::text = $1';
    }

    return new QueryBuilder({
      baseSql: sql,
      params,
      isSingle: false,
      mapRow: ResumeAnalysis.fromRow,
    });
  }

  static findOne(filter = {}) {
    let sql = 'SELECT * FROM resumes WHERE 1=1';
    const params = [];

    const id = filter._id || filter.id;
    if (id) {
      params.push(id.toString());
      sql += ` AND (id::text = $${params.length} OR external_id = $${params.length})`;
    }

    const userId = filter.user || filter.userId;
    if (userId) {
      params.push(userId.toString());
      sql += ` AND user_id::text = $${params.length}`;
    }

    return new QueryBuilder({
      baseSql: sql,
      params,
      isSingle: true,
      mapRow: ResumeAnalysis.fromRow,
    });
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query(
      'SELECT * FROM resumes WHERE id::text = $1 OR external_id = $1 LIMIT 1',
      [id.toString()]
    );
    return res.rows[0] ? ResumeAnalysis.fromRow(res.rows[0]) : null;
  }

  static async create(data) {
    const rawUserId = data.user || data.userId;
    // Resolve user UUID
    const uRes = await query(
      `SELECT id FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [rawUserId ? rawUserId.toString() : '']
    );
    const pgUserId = uRes.rows[0]?.id;
    if (!pgUserId) {
      throw new Error(`Cannot persist resume: user ${rawUserId} not found in database.`);
    }

    const r = data.result || {};
    const text = data.resumeText || r.summary || '';
    const textToEmbed = `${data.roleContext || ''} ${r.summary || ''} ${(r.keywords || []).join(' ')} ${(r.suggestedRoles || []).join(' ')}`;
    const embedding = deterministicSemanticEmbedding(textToEmbed, 384);
    const vectorSql = toSql(embedding);

    const res = await query(
      `INSERT INTO resumes (
        user_id, file_name, role_context, resume_text,
        ats_score, resume_quality_score, summary, strengths,
        weaknesses, missing_skills, keywords, suggested_roles,
        rewritten_bullets, structured_profile, embedding
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8::jsonb,
        $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb,
        $13::jsonb, $14::jsonb, $15::vector
      )
      RETURNING *`,
      [
        pgUserId,
        data.fileName || 'pasted-text',
        data.roleContext || '',
        text.slice(0, 15000),
        r.atsScore || 0,
        r.resumeQualityScore || r.atsScore || 0,
        r.summary || '',
        JSON.stringify(r.strengths || []),
        JSON.stringify(r.weaknesses || []),
        JSON.stringify(r.missingSkills || []),
        JSON.stringify(r.keywords || []),
        JSON.stringify(r.suggestedRoles || []),
        JSON.stringify(r.rewrittenBullets || []),
        JSON.stringify(r.structuredCandidateProfile || {}),
        vectorSql,
      ]
    );

    return ResumeAnalysis.fromRow(res.rows[0]);
  }

  static async countDocuments(filter = {}) {
    const userId = filter.user || filter.userId;
    if (userId) {
      const res = await query('SELECT COUNT(*) AS count FROM resumes WHERE user_id::text = $1', [userId.toString()]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM resumes');
    return parseInt(res.rows[0].count, 10);
  }
}

export default ResumeAnalysis;
