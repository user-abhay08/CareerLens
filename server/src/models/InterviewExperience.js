import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class InterviewExperience {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      author: row.author_id,
      authorName: row.author_name || 'Anonymous Student',
      company: row.company,
      role: row.role,
      difficulty: row.difficulty || 'medium',
      rounds: parseJson(row.rounds, []),
      tips: parseJson(row.tips, []),
      outcome: row.outcome || 'selected',
      upvotes: Number(row.upvotes || 0),
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM interview_experiences WHERE 1=1';
    const params = [];

    if (filter.company) {
      params.push(`%${filter.company.source || filter.company}%`);
      sql += ` AND company ILIKE $${params.length}`;
    }

    return new QueryBuilder({
      baseSql: sql,
      params,
      isSingle: false,
      mapRow: InterviewExperience.fromRow,
    });
  }

  static async create(data) {
    const rawAuthorId = data.author || data.authorId;
    const uRes = await query(
      `SELECT id FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [rawAuthorId ? rawAuthorId.toString() : '']
    );
    const pgAuthorId = uRes.rows[0]?.id;
    if (!pgAuthorId) {
      throw new Error(`Cannot persist experience: author ${rawAuthorId} not found in database.`);
    }

    const res = await query(
      `INSERT INTO interview_experiences (
        author_id, author_name, company, role, difficulty,
        rounds, tips, outcome, upvotes
      ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
      RETURNING *`,
      [
        pgAuthorId,
        data.authorName || 'Anonymous Student',
        data.company,
        data.role,
        data.difficulty || 'medium',
        JSON.stringify(data.rounds || []),
        JSON.stringify(data.tips || []),
        data.outcome || 'selected',
        data.upvotes || 0,
      ]
    );

    return InterviewExperience.fromRow(res.rows[0]);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const res = await query(
      `UPDATE interview_experiences
       SET upvotes = upvotes + 1
       WHERE id::text = $1
       RETURNING *`,
      [id.toString()]
    );
    return res.rows[0] ? InterviewExperience.fromRow(res.rows[0]) : null;
  }
}

export default InterviewExperience;
