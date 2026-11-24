import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class CareerReadiness {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      targetRole: row.target_role || '',
      careerReadinessScore: Number(row.career_readiness_score || 0),
      breakdown: parseJson(row.breakdown, {}),
      strengths: parseJson(row.strengths, []),
      missingCompetencies: parseJson(row.missing_competencies, []),
      evidenceBasedRecommendations: parseJson(row.evidence_based_recommendations, []),
      explainableSummary: row.explainable_summary || '',
      provider: row.provider || 'fallback',
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM career_readiness';
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
      mapRow: CareerReadiness.fromRow,
    });
  }

  static findOne(filter = {}) {
    let sql = 'SELECT * FROM career_readiness WHERE 1=1';
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
      mapRow: CareerReadiness.fromRow,
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
      throw new Error(`Cannot persist career readiness: user ${rawUserId} not found in database.`);
    }

    const res = await query(
      `INSERT INTO career_readiness (
        user_id, target_role, career_readiness_score, breakdown,
        strengths, missing_competencies, evidence_based_recommendations,
        explainable_summary, provider
      ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9)
      RETURNING *`,
      [
        pgUserId,
        data.targetRole || '',
        data.careerReadinessScore || 0,
        JSON.stringify(data.breakdown || {}),
        JSON.stringify(data.strengths || []),
        JSON.stringify(data.missingCompetencies || []),
        JSON.stringify(data.evidenceBasedRecommendations || []),
        data.explainableSummary || '',
        data.provider || 'fallback',
      ]
    );

    return CareerReadiness.fromRow(res.rows[0]);
  }
}

export default CareerReadiness;
