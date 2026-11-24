import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class InterviewSessionInstance {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = this.id;
  }

  async save() {
    const res = await query(
      `UPDATE interview_sessions
       SET status = $1, answers = $2::jsonb, updated_at = CURRENT_TIMESTAMP
       WHERE id::text = $3
       RETURNING *`,
      [this.status || 'open', JSON.stringify(this.answers || []), this.id.toString()]
    );
    if (res.rows[0]) {
      Object.assign(this, InterviewSession.fromRow(res.rows[0]));
    }
    return this;
  }
}

export class InterviewSession {
  static fromRow(row) {
    if (!row) return null;
    return new InterviewSessionInstance({
      id: row.id,
      _id: row.id,
      user: row.user_id,
      role: row.role,
      difficulty: row.difficulty || 'medium',
      companyTarget: row.company_target || '',
      category: row.category || 'technical',
      provider: row.provider || 'fallback',
      status: row.status || 'open',
      questions: parseJson(row.questions, []),
      answers: parseJson(row.answers, []),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM interview_sessions';
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
      mapRow: InterviewSession.fromRow,
    });
  }

  static findOne(filter = {}) {
    let sql = 'SELECT * FROM interview_sessions WHERE 1=1';
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
      mapRow: InterviewSession.fromRow,
    });
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query('SELECT * FROM interview_sessions WHERE id::text = $1 LIMIT 1', [id.toString()]);
    return res.rows[0] ? InterviewSession.fromRow(res.rows[0]) : null;
  }

  static async create(data) {
    const rawUserId = data.user || data.userId;
    const uRes = await query(
      `SELECT id FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [rawUserId ? rawUserId.toString() : '']
    );
    const pgUserId = uRes.rows[0]?.id;
    if (!pgUserId) {
      throw new Error(`Cannot persist interview session: user ${rawUserId} not found in database.`);
    }

    const res = await query(
      `INSERT INTO interview_sessions (
        user_id, role, difficulty, company_target, category,
        provider, status, questions, answers
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
      RETURNING *`,
      [
        pgUserId,
        data.role,
        data.difficulty || 'medium',
        data.companyTarget || '',
        data.category || 'technical',
        data.provider || 'fallback',
        data.status || 'open',
        JSON.stringify(data.questions || []),
        JSON.stringify(data.answers || []),
      ]
    );

    return InterviewSession.fromRow(res.rows[0]);
  }

  static async countDocuments(filter = {}) {
    const userId = filter.user || filter.userId;
    if (userId) {
      const res = await query('SELECT COUNT(*) AS count FROM interview_sessions WHERE user_id::text = $1', [userId.toString()]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM interview_sessions');
    return parseInt(res.rows[0].count, 10);
  }
}

export default InterviewSession;
