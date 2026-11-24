/**
 * PostgreSQL Database Query & Helper Layer
 * 100% Pure PostgreSQL with pgvector extension.
 */
import { getPostgresPool } from '../config/db.js';

/**
 * Executes a parameterized SQL query using the PostgreSQL connection pool.
 */
export async function query(text, params = []) {
  const pool = getPostgresPool();
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized. Please ensure POSTGRES_URI is configured.');
  }
  return pool.query(text, params);
}

/**
 * Transforms a PostgreSQL snake_case row into camelCase object with both id and _id.
 */
export function toCamel(row) {
  if (!row || typeof row !== 'object') return row;
  const out = {};
  for (const [key, val] of Object.entries(row)) {
    const camel = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
    out[camel] = val;
  }
  if (out.id && !out._id) {
    out._id = out.id;
  }
  return out;
}

/**
 * Helper to parse JSONB / string fields safely.
 */
export function parseJson(val, fallback = null) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}
