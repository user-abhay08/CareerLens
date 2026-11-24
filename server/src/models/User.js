import bcrypt from 'bcryptjs';
import { query } from '../db/index.js';

export class User {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = this.id;
  }

  async comparePassword(plain) {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plain, this.passwordHash);
  }

  toPublic() {
    return {
      id: this.id?.toString(),
      name: this.name,
      email: this.email,
      role: this.role || 'student',
      department: this.department || '',
      college: this.college || '',
      createdAt: this.createdAt,
    };
  }

  static fromRow(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      _id: row.id,
      externalId: row.external_id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role || 'student',
      department: row.department || '',
      college: row.college || '',
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static async findOne(filter = {}) {
    if (filter.email) {
      const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [filter.email.trim()]);
      return res.rows[0] ? User.fromRow(res.rows[0]) : null;
    }
    if (filter._id || filter.id) {
      return User.findById(filter._id || filter.id);
    }
    return null;
  }

  static async findById(id) {
    if (!id) return null;
    const res = await query(
      `SELECT * FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [id.toString()]
    );
    return res.rows[0] ? User.fromRow(res.rows[0]) : null;
  }

  static async create(data) {
    const {
      name,
      email,
      passwordHash,
      role = 'student',
      department = '',
      college = "Bharati Vidyapeeth's College of Engineering, Kolhapur",
    } = data;

    const res = await query(
      `INSERT INTO users (name, email, password_hash, role, department, college)
       VALUES ($1, LOWER($2), $3, $4, $5, $6)
       RETURNING *`,
      [name, email.trim(), passwordHash, role, department, college]
    );
    return User.fromRow(res.rows[0]);
  }

  static async countDocuments(filter = {}) {
    if (filter.role) {
      const res = await query('SELECT COUNT(*) AS count FROM users WHERE role = $1', [filter.role]);
      return parseInt(res.rows[0].count, 10);
    }
    const res = await query('SELECT COUNT(*) AS count FROM users');
    return parseInt(res.rows[0].count, 10);
  }
}

export default User;
