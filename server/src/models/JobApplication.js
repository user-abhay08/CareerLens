import { query } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class JobApplication {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      job: row.job_id,
      jobTitle: row.job_title,
      company: row.company,
      source: row.source || 'LinkedIn',
      portalUrl: row.portal_url || '',
      status: row.status || 'applied',
      notes: row.notes || '',
      appliedAt: row.applied_at,
      createdAt: row.applied_at,
      updatedAt: row.updated_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM application_history';
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
      mapRow: JobApplication.fromRow,
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
      throw new Error(`Cannot persist application: user ${rawUserId} not found in database.`);
    }

    const res = await query(
      `INSERT INTO application_history (
        user_id, job_title, company, source, portal_url, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        pgUserId,
        data.jobTitle || 'Role',
        data.company || 'Company',
        data.source || 'LinkedIn',
        data.portalUrl || '',
        data.status || 'applied',
        data.notes || '',
      ]
    );

    return JobApplication.fromRow(res.rows[0]);
  }

  static async findOneAndUpdate(filter, update, options = {}) {
    const id = filter._id || filter.id;
    const userId = filter.user || filter.userId;
    const data = update.$set ? update.$set : update;

    const sets = [];
    const params = [];

    if (data.status) {
      params.push(data.status);
      sets.push(`status = $${params.length}`);
    }
    if (data.notes !== undefined) {
      params.push(data.notes);
      sets.push(`notes = $${params.length}`);
    }

    sets.push('updated_at = CURRENT_TIMESTAMP');

    params.push(id.toString());
    const idParam = params.length;

    let whereClause = `WHERE (id::text = $${idParam} OR external_id = $${idParam})`;
    if (userId) {
      params.push(userId.toString());
      whereClause += ` AND user_id::text = $${params.length}`;
    }

    const res = await query(
      `UPDATE application_history SET ${sets.join(', ')} ${whereClause} RETURNING *`,
      params
    );

    return res.rows[0] ? JobApplication.fromRow(res.rows[0]) : null;
  }

  static async findOneAndDelete(filter) {
    const id = filter._id || filter.id;
    const userId = filter.user || filter.userId;

    const params = [id.toString()];
    let sql = 'DELETE FROM application_history WHERE (id::text = $1 OR external_id = $1)';
    if (userId) {
      params.push(userId.toString());
      sql += ' AND user_id::text = $2';
    }
    sql += ' RETURNING *';

    const res = await query(sql, params);
    return res.rows[0] ? JobApplication.fromRow(res.rows[0]) : null;
  }

  static async countDocuments(filter = {}) {
    const userId = filter.user || filter.userId;
    if (userId) {
      const res = await query('SELECT COUNT(*) AS count FROM application_history WHERE user_id::text = $1', [userId.toString()]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM application_history');
    return parseInt(res.rows[0].count, 10);
  }
}

export default JobApplication;
