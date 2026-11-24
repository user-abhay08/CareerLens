import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class SkillDatabase {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      name: row.name,
      category: row.category || 'technical',
      domains: parseJson(row.domains, []),
      description: '',
      demand: row.demand || 'High',
      createdAt: row.created_at,
    };
  }

  static find(filter = {}) {
    let sql = 'SELECT * FROM skills';
    const params = [];

    if (filter.category) {
      params.push(filter.category);
      sql += ' WHERE category = $1';
    }

    return new QueryBuilder({
      baseSql: sql,
      params,
      isSingle: false,
      mapRow: SkillDatabase.fromRow,
    });
  }

  static async countDocuments() {
    const res = await query('SELECT COUNT(*) AS count FROM skills');
    return parseInt(res.rows[0].count, 10);
  }
}

export default SkillDatabase;
