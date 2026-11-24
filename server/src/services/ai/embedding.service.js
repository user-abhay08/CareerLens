/**
 * Embedding Service & pgvector Serializer
 *
 * Generates 384-dimensional dense semantic vector representations
 * matching the CareerLens Synopsis specification.
 * Formats embeddings for PostgreSQL pgvector using toSql format.
 */
import env from '../../config/env.js';
import { CAREERS, SKILL_SYNONYMS } from '../knowledge.js';

const EMBEDDING_DIMENSION = env.pgvector?.dimension || 384;

/**
 * Formats a vector array to pgvector SQL representation: '[x1,x2,...]'.
 * Compatible with pgvector/pg toSql specification.
 */
export function toSql(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.startsWith('[')) return value;
  if (Array.isArray(value)) {
    const formatted = value.map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(6) : '0.000000';
    });
    return `[${formatted.join(',')}]`;
  }
  return null;
}

/**
 * Polynomial string hash helper.
 */
function hashString(str, seed = 0) {
  let h = seed;
  for (let i = 0; i < str.length; i += 1) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Deterministic semantic embedding fallback.
 * Maps text, domain keywords, and skill concepts into a normalized
 * 384-dimensional unit vector in [-1, 1].
 */
export function deterministicSemanticEmbedding(text, dimension = EMBEDDING_DIMENSION) {
  const vec = new Float64Array(dimension);
  const clean = String(text || '').toLowerCase();
  const tokens = clean.split(/[^a-z0-9+#_.-]+/).filter((t) => t.length > 1);

  if (!tokens.length) {
    vec[0] = 1.0;
    return Array.from(vec);
  }

  // 1. Token n-gram hashing with positional frequency
  tokens.forEach((token, idx) => {
    const h1 = hashString(token, 42) % dimension;
    const h2 = hashString(token, 137) % dimension;
    const weight = 1.0 / Math.sqrt(idx + 1);
    vec[h1] += weight * 0.7;
    vec[h2] -= weight * 0.3;

    // Bigrams
    if (idx < tokens.length - 1) {
      const bigram = `${token}_${tokens[idx + 1]}`;
      const bh = hashString(bigram, 251) % dimension;
      vec[bh] += 0.5;
    }
  });

  // 2. Semantic domain keyword weighting
  for (const [rawSkill, canonical] of Object.entries(SKILL_SYNONYMS)) {
    if (clean.includes(rawSkill)) {
      const idx = hashString(canonical, 7919) % dimension;
      vec[idx] += 1.2;
      vec[(idx + 42) % dimension] += 0.8;
    }
  }

  for (const career of CAREERS) {
    if (clean.includes(career.title.toLowerCase())) {
      const cIdx = hashString(career.title, 9973) % dimension;
      vec[cIdx] += 1.5;
      vec[(cIdx + 100) % dimension] += 0.9;
    }
  }

  // 3. Normalize to unit length (L2 norm)
  let sumSq = 0;
  for (let i = 0; i < dimension; i += 1) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq) || 1.0;
  const result = new Array(dimension);
  for (let i = 0; i < dimension; i += 1) {
    result[i] = Number((vec[i] / norm).toFixed(6));
  }

  return result;
}

/**
 * Generates a 384-dimensional embedding for the provided text.
 * Uses Gemini text-embedding-004 (with outputDimensionality: 384) when configured,
 * or gracefully falls back to deterministic semantic embedding.
 *
 * @param {string} text - Content to embed (resume, job description, skills)
 * @returns {Promise<number[]>} 384-dimensional float array
 */
export async function generateEmbedding(text) {
  const apiKey = env.gemini?.apiKey;
  const snippet = String(text || '').slice(0, 3000).trim();

  if (apiKey && snippet.length >= 10) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'models/text-embedding-004',
          content: { parts: [{ text: snippet }] },
          outputDimensionality: EMBEDDING_DIMENSION,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const values = data?.embedding?.values;
        if (Array.isArray(values) && values.length === EMBEDDING_DIMENSION) {
          return values.map((v) => Number(Number(v).toFixed(6)));
        }
      }
    } catch {
      // Fall through to deterministic semantic embedding
    } finally {
      clearTimeout(timer);
    }
  }

  return deterministicSemanticEmbedding(snippet, EMBEDDING_DIMENSION);
}
