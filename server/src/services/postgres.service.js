/**
 * PostgreSQL + pgvector Persistence Service
 *
 * Implements secondary enterprise persistence for all structured user data,
 * resumes, vector embeddings, recommendations, applications, and progress
 * directly into PostgreSQL whenever POSTGRES_URI is configured.
 */
import { getPostgresPool } from '../config/db.js';
import { generateEmbedding, toSql } from './ai/embedding.service.js';
import User from '../models/User.js';

/**
 * Resolves or creates a PostgreSQL user by external MongoDB ID or email.
 * Returns the PostgreSQL user UUID string, or null if Postgres is not active.
 */
export async function getOrCreatePgUser(mongoUserOrId) {
  const pool = getPostgresPool();
  if (!pool) return null;

  try {
    let mongoId = '';
    let email = '';
    let name = '';
    let role = 'student';
    let department = '';
    let college = "Bharati Vidyapeeth's College of Engineering, Kolhapur";
    let passwordHash = '';

    if (mongoUserOrId && typeof mongoUserOrId === 'object') {
      mongoId = mongoUserOrId._id?.toString() || mongoUserOrId.id?.toString() || '';
      email = (mongoUserOrId.email || '').toLowerCase().trim();
      name = mongoUserOrId.name || '';
      role = mongoUserOrId.role || 'student';
      department = mongoUserOrId.department || '';
      college = mongoUserOrId.college || college;
      passwordHash = mongoUserOrId.passwordHash || '';
    } else if (typeof mongoUserOrId === 'string') {
      mongoId = mongoUserOrId;
    }

    // 1. Try finding existing PG user by external_id or email
    const findRes = await pool.query(
      `SELECT id, email FROM users WHERE (external_id IS NOT NULL AND external_id = $1) OR (email IS NOT NULL AND email = $2) LIMIT 1`,
      [mongoId || null, email || null]
    );

    if (findRes.rows.length) {
      const existingId = findRes.rows[0].id;
      // Update external_id if it was missing
      if (mongoId) {
        await pool.query(
          `UPDATE users SET external_id = COALESCE(external_id, $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [mongoId, existingId]
        );
      }
      return existingId;
    }

    // 2. If details missing, fetch from MongoDB User model
    if (!email && mongoId) {
      try {
        const u = await User.findById(mongoId).lean();
        if (u) {
          email = (u.email || '').toLowerCase().trim();
          name = u.name || name || 'CareerLens User';
          role = u.role || role;
          department = u.department || department;
          college = u.college || college;
          passwordHash = u.passwordHash || passwordHash;
        }
      } catch {
        // ignore
      }
    }

    if (!email) {
      email = `user_${mongoId || Date.now()}@careerlens.local`;
    }
    if (!name) {
      name = 'CareerLens User';
    }

    // 3. Upsert user in PostgreSQL
    const insertRes = await pool.query(
      `INSERT INTO users (external_id, name, email, password_hash, role, department, college)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         external_id = COALESCE(users.external_id, EXCLUDED.external_id),
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [mongoId || null, name, email, passwordHash || 'hash-managed-by-mongo', role, department, college]
    );

    const pgUserId = insertRes.rows[0]?.id || null;
    if (pgUserId) {
      console.log(`[postgres] Synced user to PostgreSQL: ${email} (PG UUID: ${pgUserId})`);
    }
    return pgUserId;
  } catch (err) {
    console.warn(`[postgres] User resolution warning: ${err.message}`);
    return null;
  }
}

/**
 * Persists a user upon registration / social login.
 */
export async function syncUserToPg(userDoc, rawPassword = '') {
  const pool = getPostgresPool();
  if (!pool || !userDoc) return null;

  try {
    const mongoId = userDoc._id ? userDoc._id.toString() : userDoc.id?.toString() || '';
    const email = (userDoc.email || '').toLowerCase().trim();
    const name = userDoc.name || 'CareerLens User';
    const role = userDoc.role || 'student';
    const department = userDoc.department || '';
    const college = userDoc.college || "Bharati Vidyapeeth's College of Engineering, Kolhapur";
    const passwordHash = userDoc.passwordHash || '';

    const res = await pool.query(
      `INSERT INTO users (external_id, name, email, password_hash, role, department, college)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         external_id = EXCLUDED.external_id,
         name = EXCLUDED.name,
         password_hash = CASE WHEN EXCLUDED.password_hash <> '' THEN EXCLUDED.password_hash ELSE users.password_hash END,
         role = EXCLUDED.role,
         department = EXCLUDED.department,
         college = EXCLUDED.college,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [mongoId, name, email, passwordHash, role, department, college]
    );

    const pgId = res.rows[0]?.id;
    console.log(`[postgres] Persisted user to PostgreSQL: ${email} (PG UUID: ${pgId})`);
    return pgId;
  } catch (err) {
    console.warn(`[postgres] syncUserToPg warning: ${err.message}`);
    return null;
  }
}

/**
 * Persists an analyzed resume and its 384-dimensional pgvector embedding.
 */
export async function syncResumeToPg(resumeDoc, resumeText = '') {
  const pool = getPostgresPool();
  if (!pool || !resumeDoc) return null;

  try {
    const pgUserId = await getOrCreatePgUser(resumeDoc.user);
    if (!pgUserId) return null;

    const mongoId = resumeDoc._id ? resumeDoc._id.toString() : resumeDoc.id?.toString() || '';
    const r = resumeDoc.result || {};
    const textToEmbed = `${resumeText || ''} ${(r.keywords || []).join(' ')} ${(r.suggestedRoles || []).join(' ')} ${r.summary || ''}`.trim();
    const embedding = await generateEmbedding(textToEmbed);
    const vectorSql = toSql(embedding);

    const res = await pool.query(
      `INSERT INTO resumes (
        external_id, user_id, file_name, role_context, resume_text,
        ats_score, resume_quality_score, summary, strengths, weaknesses,
        missing_skills, keywords, suggested_roles, rewritten_bullets,
        structured_profile, embedding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::vector)
      RETURNING id`,
      [
        mongoId,
        pgUserId,
        resumeDoc.fileName || 'resume.pdf',
        resumeDoc.roleContext || '',
        resumeText ? resumeText.slice(0, 15000) : '',
        r.atsScore || 0,
        r.resumeQualityScore || r.atsScore || 0,
        r.summary || '',
        JSON.stringify(r.strengths || []),
        JSON.stringify(r.weaknesses || []),
        JSON.stringify(r.missingSkills || []),
        JSON.stringify(r.keywords || []),
        JSON.stringify(r.suggestedRoles || []),
        JSON.stringify(r.rewrittenBullets || []),
        JSON.stringify(r.structuredCandidateProfile || {}),
        vectorSql,
      ]
    );

    const pgResumeId = res.rows[0]?.id;
    console.log(`[postgres] Persisted resume with 384-d pgvector embedding to PostgreSQL (ID: ${pgResumeId}, ATS: ${r.atsScore}/100)`);

    // Also sync extracted skills into user_skills and skills catalog
    const skillsToSync = [...(r.keywords || []), ...(r.structuredCandidateProfile?.technicalSkills || [])];
    if (skillsToSync.length) {
      await syncSkillsToPg(pgUserId, skillsToSync, 'resume');
    }

    return pgResumeId;
  } catch (err) {
    console.warn(`[postgres] syncResumeToPg warning: ${err.message}`);
    return null;
  }
}

/**
 * Syncs user skills into user_skills and catalog skills.
 */
export async function syncSkillsToPg(pgUserOrMongoUser, skillNames = [], source = 'profile') {
  const pool = getPostgresPool();
  if (!pool || !skillNames || !skillNames.length) return;

  try {
    let pgUserId = pgUserOrMongoUser;
    // Check if it's already a UUID string
    if (typeof pgUserOrMongoUser === 'string' && !pgUserOrMongoUser.includes('-')) {
      pgUserId = await getOrCreatePgUser(pgUserOrMongoUser);
    } else if (typeof pgUserOrMongoUser === 'object') {
      pgUserId = await getOrCreatePgUser(pgUserOrMongoUser);
    }
    if (!pgUserId) return;

    for (const raw of skillNames.slice(0, 40)) {
      const name = String(raw || '').trim().toLowerCase();
      if (!name || name.length > 90) continue;

      // 1. Ensure in catalog skills
      await pool.query(
        `INSERT INTO skills (name, category, domains, demand)
         VALUES ($1, 'technical', '["general"]'::jsonb, 'High')
         ON CONFLICT (name) DO NOTHING`,
        [name]
      );

      // 2. Ensure in user_skills
      await pool.query(
        `INSERT INTO user_skills (user_id, skill_name, proficiency, source)
         VALUES ($1, $2, 'intermediate', $3)
         ON CONFLICT (user_id, skill_name) DO UPDATE SET
           source = EXCLUDED.source,
           proficiency = EXCLUDED.proficiency`,
        [pgUserId, name, source]
      );
    }
  } catch (err) {
    console.warn(`[postgres] syncSkillsToPg warning: ${err.message}`);
  }
}

/**
 * Persists career match recommendations.
 */
export async function syncRecommendationToPg(recDoc) {
  const pool = getPostgresPool();
  if (!pool || !recDoc) return null;

  try {
    const pgUserId = await getOrCreatePgUser(recDoc.user);
    if (!pgUserId) return null;

    const mongoId = recDoc._id ? recDoc._id.toString() : recDoc.id?.toString() || '';
    const topCareer = recDoc.careers?.[0]?.title || '';

    const res = await pool.query(
      `INSERT INTO recommendations (
        external_id, user_id, target_role, provider, careers, input_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id`,
      [
        mongoId,
        pgUserId,
        topCareer,
        recDoc.provider || 'gemini',
        JSON.stringify(recDoc.careers || []),
        JSON.stringify(recDoc.inputSnapshot || {}),
      ]
    );

    const pgRecId = res.rows[0]?.id;
    console.log(`[postgres] Persisted career recommendation to PostgreSQL (ID: ${pgRecId}, Top: "${topCareer}")`);
    return pgRecId;
  } catch (err) {
    console.warn(`[postgres] syncRecommendationToPg warning: ${err.message}`);
    return null;
  }
}

/**
 * Persists job application tracking records into application_history.
 */
export async function syncApplicationToPg(appDoc) {
  const pool = getPostgresPool();
  if (!pool || !appDoc) return null;

  try {
    const pgUserId = await getOrCreatePgUser(appDoc.user);
    if (!pgUserId) return null;

    const mongoId = appDoc._id ? appDoc._id.toString() : appDoc.id?.toString() || '';

    const res = await pool.query(
      `INSERT INTO application_history (
        external_id, user_id, job_title, company, source, portal_url, status, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (external_id) DO UPDATE SET
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id`,
      [
        mongoId,
        pgUserId,
        appDoc.jobTitle || 'Role',
        appDoc.company || 'Company',
        appDoc.source || 'LinkedIn',
        appDoc.portalUrl || '',
        appDoc.status || 'applied',
        appDoc.notes || '',
      ]
    );

    const pgAppId = res.rows[0]?.id;
    console.log(`[postgres] Persisted application_history to PostgreSQL: "${appDoc.jobTitle}" @ ${appDoc.company} (Status: ${appDoc.status})`);
    return pgAppId;
  } catch (err) {
    console.warn(`[postgres] syncApplicationToPg warning: ${err.message}`);
    return null;
  }
}

export async function updateApplicationInPg(mongoId, status, notes) {
  const pool = getPostgresPool();
  if (!pool || !mongoId) return;

  try {
    await pool.query(
      `UPDATE application_history
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE external_id = $3`,
      [status || null, notes !== undefined ? notes : null, mongoId]
    );
    console.log(`[postgres] Updated application_history in PostgreSQL (external_id: ${mongoId})`);
  } catch (err) {
    console.warn(`[postgres] updateApplicationInPg warning: ${err.message}`);
  }
}

export async function deleteApplicationFromPg(mongoId) {
  const pool = getPostgresPool();
  if (!pool || !mongoId) return;

  try {
    await pool.query(`DELETE FROM application_history WHERE external_id = $1`, [mongoId]);
    console.log(`[postgres] Deleted application_history record from PostgreSQL (external_id: ${mongoId})`);
  } catch (err) {
    console.warn(`[postgres] deleteApplicationFromPg warning: ${err.message}`);
  }
}

/**
 * Persists career readiness and roadmap progress into career_progress.
 */
export async function syncCareerProgressToPg({
  userId,
  targetRole = '',
  readinessScore = 0,
  breakdown = {},
  strengths = [],
  missingCompetencies = [],
  recommendations = [],
  summary = '',
  activeRoadmapRole = '',
  activeRoadmap = null,
  latestAtsScore = null,
  externalId = '',
}) {
  const pool = getPostgresPool();
  if (!pool || !userId) return null;

  try {
    const pgUserId = await getOrCreatePgUser(userId);
    if (!pgUserId) return null;

    const res = await pool.query(
      `INSERT INTO career_progress (
        external_id, user_id, target_role, readiness_score, breakdown,
        strengths, missing_competencies, recommendations, summary,
        active_roadmap_role, active_roadmap, latest_ats_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [
        externalId || null,
        pgUserId,
        targetRole,
        readinessScore,
        JSON.stringify(breakdown || {}),
        JSON.stringify(strengths || []),
        JSON.stringify(missingCompetencies || []),
        JSON.stringify(recommendations || []),
        summary,
        activeRoadmapRole,
        JSON.stringify(activeRoadmap || {}),
        latestAtsScore,
      ]
    );

    const pgProgId = res.rows[0]?.id;
    console.log(`[postgres] Persisted career_progress to PostgreSQL (ID: ${pgProgId}, Role: "${targetRole}", Readiness: ${readinessScore}%)`);
    return pgProgId;
  } catch (err) {
    console.warn(`[postgres] syncCareerProgressToPg warning: ${err.message}`);
    return null;
  }
}
