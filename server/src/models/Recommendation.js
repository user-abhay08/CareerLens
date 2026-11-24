import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class Recommendation {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      provider: row.provider || 'gemini',
      targetRole: row.target_role || '',
      careers: parseJson(row.careers, []),
      inputSnapshot: parseJson(row.input_snapshot, {}),
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM recommendations';
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
      mapRow: Recommendation.fromRow,
    });
  }

  static findOne(filter = {}) {
    let sql = 'SELECT * FROM recommendations WHERE 1=1';
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
      mapRow: Recommendation.fromRow,
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
      throw new Error(`Cannot persist recommendation: user ${rawUserId} not found in database.`);
    }

    const targetRole = data.careers?.[0]?.title || '';
    const res = await query(
      `INSERT INTO recommendations (
        user_id, target_role, provider, careers, input_snapshot
      ) VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
      RETURNING *`,
      [
        pgUserId,
        targetRole,
        data.provider || 'gemini',
        JSON.stringify(data.careers || []),
        JSON.stringify(data.inputSnapshot || {}),
      ]
    );

    return Recommendation.fromRow(res.rows[0]);
  }

  static async countDocuments(filter = {}) {
    const userId = filter.user || filter.userId;
    if (userId) {
      const res = await query('SELECT COUNT(*) AS count FROM recommendations WHERE user_id::text = $1', [userId.toString()]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM recommendations');
    return parseInt(res.rows[0].count, 10);
  }
}

export default Recommendation;
