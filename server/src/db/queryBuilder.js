import { query, toCamel, parseJson } from './index.js';

/**
 * Maps JS camelCase property names to PostgreSQL snake_case columns.
 */
export function toSnake(key) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Flexible QueryBuilder that matches Mongoose chainable query syntax:
 * .find(), .findOne(), .sort(), .limit(), .lean(), and can be directly awaited.
 */
export class QueryBuilder {
  constructor({ baseSql, params = [], isSingle = false, mapRow = (r) => toCamel(r) }) {
    this.baseSql = baseSql;
    this.params = [...params];
    this.isSingle = isSingle;
    this.mapRow = mapRow;
    this.sortClause = '';
    this.limitClause = '';
  }

  sort(sortObj) {
    if (!sortObj || typeof sortObj !== 'object') return this;
    const parts = [];
    for (const [key, val] of Object.entries(sortObj)) {
      const col = toSnake(key);
      const dir = Number(val) < 0 || String(val).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
      parts.push(`${col} ${dir}`);
    }
    if (parts.length) {
      this.sortClause = ` ORDER BY ${parts.join(', ')}`;
    }
    return this;
  }

  limit(num) {
    const n = parseInt(num, 10);
    if (!isNaN(n) && n > 0) {
      this.limitClause = ` LIMIT ${n}`;
    }
    return this;
  }

  lean() {
    return this;
  }

  async execute() {
    let sql = this.baseSql;
    if (this.sortClause) {
      sql += this.sortClause;
    }
    if (this.limitClause) {
      sql += this.limitClause;
    } else if (this.isSingle) {
      sql += ' LIMIT 1';
    }

    const res = await query(sql, this.params);
    if (this.isSingle) {
      return res.rows[0] ? this.mapRow(res.rows[0]) : null;
    }
    return res.rows.map((r) => this.mapRow(r));
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }

  catch(reject) {
    return this.execute().catch(reject);
  }

  finally(callback) {
    return this.execute().finally(callback);
  }
}
