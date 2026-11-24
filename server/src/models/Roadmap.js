import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class Roadmap {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      targetRole: row.target_role || '',
      provider: row.provider || 'fallback',
      overview: row.overview || '',
      currentSkills: parseJson(row.current_skills, []),
      missingSkills: parseJson(row.missing_skills, []),
      phases: parseJson(row.phases, []),
      recommendedCourses: parseJson(row.recommended_courses, []),
      recommendedCertifications: parseJson(row.recommended_certifications, []),
      recommendedProjects: parseJson(row.recommended_projects, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM roadmaps';
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
      mapRow: Roadmap.fromRow,
    });
  }

  static findOne(filter = {}) {
    let sql = 'SELECT * FROM roadmaps WHERE 1=1';
    const params = [];

    const id = filter._id || filter.id;
    if (id) {
      params.push(id.toString());
      sql += ` AND id::text = $${params.length}`;
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
      mapRow: Roadmap.fromRow,
    });
  }

  static async create(data) {
    const rawUserId = data.user || data.userId;
    const uRes = await query(
      `SELECT id FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [rawUserId ? rawUserId.toString() : '']
    );
    const pgUserId = uRes.rows[0]?.id;
    if (!pgUserId) {
      throw new Error(`Cannot persist roadmap: user ${rawUserId} not found in database.`);
    }

    const res = await query(
      `INSERT INTO roadmaps (
        user_id, target_role, provider, overview, current_skills,
        missing_skills, phases, recommended_courses, recommended_certifications, recommended_projects
      ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb)
      RETURNING *`,
      [
        pgUserId,
        data.targetRole || '',
        data.provider || 'fallback',
        data.overview || '',
        JSON.stringify(data.currentSkills || []),
        JSON.stringify(data.missingSkills || []),
        JSON.stringify(data.phases || []),
        JSON.stringify(data.recommendedCourses || []),
        JSON.stringify(data.recommendedCertifications || []),
        JSON.stringify(data.recommendedProjects || []),
      ]
    );

    return Roadmap.fromRow(res.rows[0]);
  }

  static async countDocuments(filter = {}) {
    const userId = filter.user || filter.userId;
    if (userId) {
      const res = await query('SELECT COUNT(*) AS count FROM roadmaps WHERE user_id::text = $1', [userId.toString()]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM roadmaps');
    return parseInt(res.rows[0].count, 10);
  }
}

export default Roadmap;
