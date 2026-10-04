const JSON_RULE = 'Respond with a SINGLE valid JSON object only. No markdown fences, no commentary, no text outside the JSON.';

export const ANALYST_PERSONA =
  'You are CareerLens, an expert career coach and technical recruiter with 15 years of experience reviewing resumes for software, data, design and business roles. You give honest, specific, actionable feedback.';

export function resumeAnalysisPrompt({ resumeText, roleContext, profile }) {
  const profileLine = profile
    ? `Candidate profile — skills: ${profile.skills?.join(', ') || 'unknown'}; interests: ${profile.interests?.join(', ') || 'unknown'}; education: ${profile.education?.map((e) => e.degree).filter(Boolean).join(', ') || 'unknown'}.`
    : 'No profile available.';
  return {
    system: `${ANALYST_PERSONA}\n${JSON_RULE}
Analyze the resume and return JSON exactly in this shape:
{
  "summary": "2-3 sentence overall assessment",
  "atsScore": 0-100 integer estimating how well this resume passes ATS screening,
  "strengths": ["3-6 specific strengths, each one sentence"],
  "weaknesses": ["3-6 specific weaknesses or red flags, each one sentence"],
  "missingSkills": ["5-10 in-demand skills missing from this resume for the target direction"],
  "keywords": ["8-12 ATS keywords the resume already contains"],
  "suggestedRoles": ["3-5 concrete job titles that fit this resume, best first"],
  "rewrittenBullets": [{"original": "a weak bullet from the resume", "improved": "rewritten with action verb, quantified impact and tools"}]
}
Include 2-4 rewrittenBullets. If the resume is too short or unreadable, still return the JSON with honest low-score content.`,
    user: `Target direction: ${roleContext || 'general — infer the best fit'}\n${profileLine}\n\nRESUME TEXT:\n"""\n${resumeText.slice(0, 12000)}\n"""`,
  };
}

export function careerRecommendationPrompt({ profile }) {
  return {
    system: `${ANALYST_PERSONA}\n${JSON_RULE}
Recommend careers for the candidate. Return JSON exactly in this shape:
{
  "careers": [
    {
      "title": "career title",
      "matchScore": 0-100 integer,
      "description": "1-2 sentences about this career",
      "reasons": ["2-4 short reasons why it fits this candidate"],
      "skillsToLearn": ["3-6 skills the candidate should acquire or strengthen"],
      "salaryRange": "typical entry-level range, mention currency (e.g. INR for Indian context unless stated otherwise)",
      "demand": "High | Medium | Growing"
    }
  ]
}
Return exactly 5 careers, sorted by matchScore descending. Be realistic and specific to the candidate's actual skills and interests.`,
    user: `Candidate profile:
- Skills: ${profile.skills?.join(', ') || 'not specified'}
- Interests: ${profile.interests?.join(', ') || 'not specified'}
- Education: ${profile.education?.map((e) => `${e.degree || ''} ${e.institution || ''}`).filter(Boolean).join('; ') || 'not specified'}
- Experience: ${profile.experienceYears || 0} years${profile.experience?.length ? ` (${profile.experience.map((e) => e.title).filter(Boolean).join(', ')})` : ''}
- Current target: ${profile.targetRole || 'open to suggestions'}`,
  };
}

export function roadmapPrompt({ profile, targetRole }) {
  return {
    system: `${ANALYST_PERSONA}\n${JSON_RULE}
Create a personalized learning roadmap to become a ${targetRole}. Return JSON exactly in this shape:
{
  "overview": "2-3 sentence strategy overview",
  "missingSkills": ["4-10 skills the candidate must learn, priority order"],
  "phases": [
    {
      "phase": "Phase 1",
      "title": "short phase title",
      "duration": "e.g. Weeks 1-4",
      "focus": "2-3 sentences on what to do in this phase",
      "skills": ["skills practiced in this phase"],
      "resources": ["2-4 specific free resources (docs, free courses, YouTube channels)"],
      "milestone": "a concrete deliverable or checkpoint"
    }
  ]
}
Return exactly 4 phases progressing from foundations to job readiness. Tailor to what the candidate ALREADY knows — do not re-teach known skills.`,
    user: `Target role: ${targetRole}
Candidate already knows: ${profile.skills?.join(', ') || 'nothing listed — assume complete beginner'}
Interests: ${profile.interests?.join(', ') || 'not specified'}
Experience: ${profile.experienceYears || 0} years`,
  };
}

export function interviewQuestionsPrompt({ role, difficulty, profile }) {
  return {
    system: `${ANALYST_PERSONA}\n${JSON_RULE}
Generate interview questions for a ${difficulty} level ${role} interview. Return JSON exactly in this shape:
{
  "questions": [
    {
      "question": "the interview question",
      "focus": "what skill or trait this evaluates",
      "sampleAnswer": "a strong 3-5 sentence model answer"
    }
  ]
}
Return exactly 5 questions: mix of 2 technical, 2 behavioral/situational and 1 role-specific challenge. The sample answers must use the STAR structure when behavioral.`,
    user: `Candidate background: ${profile?.skills?.join(', ') || 'entry level candidate'}`,
  };
}

export function answerFeedbackPrompt({ role, question, sampleAnswer, answer }) {
  return {
    system: `${ANALYST_PERSONA}\n${JSON_RULE}
Grade the candidate's interview answer. Return JSON exactly in this shape:
{
  "score": 0-10 integer,
  "strengths": ["1-4 things done well"],
  "improvements": ["1-4 concrete improvements"],
  "improvedAnswer": "a polished version of the candidate's own answer (keep their ideas, fix structure using STAR, quantify where possible)"
}`,
    user: `Role: ${role}
Question: ${question}
Reference answer: ${sampleAnswer || 'n/a'}
Candidate answer: ${answer.slice(0, 4000)}`,
  };
}
