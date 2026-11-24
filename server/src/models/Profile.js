import { query, parseJson } from '../db/index.js';
import { QueryBuilder } from '../db/queryBuilder.js';

export class Profile {
  static fromRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      _id: row.id,
      user: row.user_id,
      userId: row.user_id,
      headline: row.headline || '',
      bio: row.bio || '',
      targetRole: row.target_role || '',
      targetCareerDomain: row.target_career_domain || '',
      skills: parseJson(row.skills, []),
      technicalSkills: parseJson(row.technical_skills, []),
      softSkills: parseJson(row.soft_skills, []),
      interests: parseJson(row.interests, []),
      education: parseJson(row.education, []),
      experience: parseJson(row.experience, []),
      experienceYears: Number(row.experience_years || 0),
      projects: parseJson(row.projects, []),
      certifications: parseJson(row.certifications, []),
      internships: parseJson(row.internships, []),
      achievements: parseJson(row.achievements, []),
      extracurricularActivities: parseJson(row.extracurricular_activities, []),
      academicPerformance: parseJson(row.academic_performance, { cgpa: null, percentage: null }),
      links: parseJson(row.links, { github: '', linkedin: '', portfolio: '' }),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  static findOne(filter = {}) {
    const userId = filter.user || filter.userId || filter._id || filter.id;
    if (!userId) {
      return new QueryBuilder({
        baseSql: 'SELECT * FROM profiles WHERE 1=0',
        isSingle: true,
        mapRow: Profile.fromRow,
      });
    }

    return new QueryBuilder({
      baseSql: `SELECT p.* FROM profiles p
                JOIN users u ON u.id = p.user_id
                WHERE p.user_id::text = $1 OR u.external_id = $1`,
      params: [userId.toString()],
      isSingle: true,
      mapRow: Profile.fromRow,
    });
  }

  static async findOneAndUpdate(filter, update, options = {}) {
    const rawUserId = filter.user || filter.userId;
    if (!rawUserId) throw new Error('user id is required to update profile');

    // Find PostgreSQL user UUID
    const uRes = await query(
      `SELECT id FROM users WHERE id::text = $1 OR external_id = $1 LIMIT 1`,
      [rawUserId.toString()]
    );
    const pgUserId = uRes.rows[0]?.id;
    if (!pgUserId) {
      throw new Error(`Cannot update profile: user ${rawUserId} not found in PostgreSQL.`);
    }

    const data = update.$set ? update.$set : update;
    const skills = JSON.stringify(data.skills || []);
    const technicalSkills = JSON.stringify(data.technicalSkills || data.skills || []);
    const softSkills = JSON.stringify(data.softSkills || []);
    const interests = JSON.stringify(data.interests || []);
    const education = JSON.stringify(data.education || []);
    const experience = JSON.stringify(data.experience || []);
    const projects = JSON.stringify(data.projects || []);
    const certifications = JSON.stringify(data.certifications || []);
    const internships = JSON.stringify(data.internships || []);
    const achievements = JSON.stringify(data.achievements || []);
    const academicPerformance = JSON.stringify(data.academicPerformance || {});
    const links = JSON.stringify(data.links || {});

    const res = await query(
      `INSERT INTO profiles (
        user_id, headline, bio, target_role, target_career_domain,
        skills, technical_skills, soft_skills, interests,
        education, experience, projects, certifications,
        internships, achievements, academic_performance, links
      ) VALUES (
        $1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb,
        $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16::jsonb, $17::jsonb
      )
      ON CONFLICT (user_id) DO UPDATE SET
        headline = EXCLUDED.headline,
        bio = EXCLUDED.bio,
        target_role = EXCLUDED.target_role,
        target_career_domain = EXCLUDED.target_career_domain,
        skills = EXCLUDED.skills,
        technical_skills = EXCLUDED.technical_skills,
        soft_skills = EXCLUDED.soft_skills,
        interests = EXCLUDED.interests,
        education = EXCLUDED.education,
        experience = EXCLUDED.experience,
        projects = EXCLUDED.projects,
        certifications = EXCLUDED.certifications,
        internships = EXCLUDED.internships,
        achievements = EXCLUDED.achievements,
        academic_performance = EXCLUDED.academic_performance,
        links = EXCLUDED.links,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        pgUserId,
        data.headline || '',
        data.bio || '',
        data.targetRole || '',
        data.targetCareerDomain || '',
        skills,
        technicalSkills,
        softSkills,
        interests,
        education,
        experience,
        projects,
        certifications,
        internships,
        achievements,
        academicPerformance,
        links,
      ]
    );

    return Profile.fromRow(res.rows[0]);
  }
}

export default Profile;
