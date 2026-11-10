import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Profile from '../models/Profile.js';
import { generateJSON, formatAiFallbackNotice } from './ai/index.js';
import { resumeAnalysisPrompt } from './ai/prompts.js';
import { fallbackResumeAnalysis } from './fallback.js';
import { asString, asArray, asStringArray, asNumber, clamp } from '../utils/sanitize.js';

/** Extracts plain text from an uploaded PDF or text file buffer. */
export async function extractTextFromFile(file) {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    try {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const data = await pdfParse(file.buffer);
      if (data?.text && data.text.trim()) {
        return data.text;
      }
    } catch (pdfErr) {
      console.warn(`[resume] PDF parse warning: ${pdfErr.message}`);
    }

    // Secondary fallback: attempt UTF-8 string extraction
    try {
      const fallbackStr = file.buffer.toString('utf8');
      const printable = fallbackStr.replace(/[^\x20-\x7E\t\n\r]/g, ' ').replace(/\s+/g, ' ');
      if (printable.trim().length >= 80) return printable;
    } catch {
      // ignore
    }

    const err = new Error('Could not extract readable text from this PDF. Please upload a standard text-based PDF or paste your resume text.');
    err.statusCode = 400;
    throw err;
  }
  return file.buffer.toString('utf8');
}

function sanitizeResult(d) {
  if (!d || typeof d !== 'object') d = {};
  const bullets = asArray(d.rewrittenBullets)
    .slice(0, 5)
    .map((b) => ({ original: asString(b?.original), improved: asString(b?.improved) }))
    .filter((b) => b.original && b.improved);

  const atsScore = clamp(asNumber(d.atsScore, 0), 0, 100);
  const resumeQualityScore = clamp(asNumber(d.resumeQualityScore || d.atsScore, 0), 0, 100);

  const rawStructured = d.structuredCandidateProfile && typeof d.structuredCandidateProfile === 'object'
    ? d.structuredCandidateProfile
    : {};

  return {
    summary: asString(d.summary, 'Resume analysis completed successfully.'),
    atsScore,
    resumeQualityScore,
    strengths: asStringArray(d.strengths, 8),
    weaknesses: asStringArray(d.weaknesses, 8),
    missingSkills: asStringArray(d.missingSkills, 12),
    keywords: asStringArray(d.keywords, 15),
    suggestedRoles: asStringArray(d.suggestedRoles, 6),
    rewrittenBullets: bullets,
    structuredCandidateProfile: {
      educationalQualifications: asArray(rawStructured.educationalQualifications || d.education),
      technicalSkills: asStringArray(rawStructured.technicalSkills || d.technicalSkills || d.keywords, 20),
      softSkills: asStringArray(rawStructured.softSkills || d.softSkills, 10),
      projects: asArray(rawStructured.projects || d.projects),
      certifications: asArray(rawStructured.certifications || d.certifications),
      internships: asArray(rawStructured.internships || d.internships),
      workExperience: asArray(rawStructured.workExperience || d.workExperience),
      achievements: asStringArray(rawStructured.achievements || d.achievements, 10),
      extracurricularActivities: asStringArray(rawStructured.extracurricularActivities || d.extracurricularActivities, 10),
    },
  };
}

export async function analyzeResume({ user, file, text, roleContext }) {
  let resumeText = String(text || '').trim();
  let fileName = 'pasted-text';

  if (file) {
    fileName = file.originalname || 'resume.pdf';
    resumeText = await extractTextFromFile(file);
  }

  if (!resumeText || resumeText.trim().length < 80) {
    const err = new Error('Could not read enough text from the resume. Upload a text-based PDF or paste the resume text.');
    err.statusCode = 400;
    throw err;
  }

  let profile = null;
  try {
    profile = await Profile.findOne({ user }).lean();
  } catch (profErr) {
    console.warn(`[resume] Profile lookup skipped: ${profErr.message}`);
  }

  const prompt = resumeAnalysisPrompt({ resumeText, roleContext, profile });

  let result;
  let provider = 'fallback';
  let notice;
  try {
    const { data, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.3 });
    result = sanitizeResult(data);
    provider = p;
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED' && err.code !== 'AI_NOT_CONFIGURED') {
      console.warn(`[ai] resume analysis failed, using fallback: ${err.message}`);
    }
    try {
      result = sanitizeResult(fallbackResumeAnalysis({ resumeText, profile, roleContext }));
    } catch (fbErr) {
      console.error(`[ai] fallback generation error: ${fbErr.message}`);
      result = sanitizeResult({});
    }
    notice = formatAiFallbackNotice(err, 'built-in heuristic analysis');
  }

  if (!result || !result.summary) {
    result = sanitizeResult(fallbackResumeAnalysis({ resumeText, profile, roleContext }));
  }

  const doc = await ResumeAnalysis.create({
    user,
    fileName,
    roleContext: asString(roleContext),
    textLength: resumeText.length,
    provider,
    result,
  });

  return { analysis: doc, notice };
}
