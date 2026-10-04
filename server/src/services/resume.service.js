import ResumeAnalysis from '../models/ResumeAnalysis.js';
import Profile from '../models/Profile.js';
import { generateJSON } from './ai/index.js';
import { resumeAnalysisPrompt } from './ai/prompts.js';
import { fallbackResumeAnalysis } from './fallback.js';
import { asString, asArray, asStringArray, asNumber, clamp } from '../utils/sanitize.js';

/** Extracts plain text from an uploaded PDF or text file buffer. */
export async function extractTextFromFile(file) {
  const isPdf = file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf');
  if (isPdf) {
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
    const data = await pdfParse(file.buffer);
    return data.text || '';
  }
  return file.buffer.toString('utf8');
}

function sanitizeResult(d) {
  const bullets = asArray(d.rewrittenBullets)
    .slice(0, 5)
    .map((b) => ({ original: asString(b?.original), improved: asString(b?.improved) }))
    .filter((b) => b.original && b.improved);
  return {
    summary: asString(d.summary, 'No summary returned.'),
    atsScore: clamp(asNumber(d.atsScore, 0), 0, 100),
    strengths: asStringArray(d.strengths, 8),
    weaknesses: asStringArray(d.weaknesses, 8),
    missingSkills: asStringArray(d.missingSkills, 12),
    keywords: asStringArray(d.keywords, 15),
    suggestedRoles: asStringArray(d.suggestedRoles, 6),
    rewrittenBullets: bullets,
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

  const profile = await Profile.findOne({ user }).lean();
  const prompt = resumeAnalysisPrompt({ resumeText, roleContext, profile });

  let result;
  let provider = 'fallback';
  let notice;
  try {
    const { data, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.3 });
    result = sanitizeResult(data);
    provider = p;
  } catch (err) {
    if (err.message === 'AI_NOT_CONFIGURED') {
      result = sanitizeResult(fallbackResumeAnalysis({ resumeText, profile, roleContext }));
    } else {
      console.warn(`[ai] resume analysis failed, using fallback: ${err.message}`);
      result = sanitizeResult(fallbackResumeAnalysis({ resumeText, profile, roleContext }));
      notice = `AI request failed (${err.message.slice(0, 140)}). Served built-in heuristic analysis instead.`;
    }
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
