import InterviewSession from '../models/InterviewSession.js';
import Profile from '../models/Profile.js';
import { generateJSON, formatAiFallbackNotice } from './ai/index.js';
import { interviewQuestionsPrompt, answerFeedbackPrompt } from './ai/prompts.js';
import { fallbackInterviewQuestions, fallbackAnswerFeedback } from './fallback.js';
import { asString, asArray, asStringArray, asNumber, clamp } from '../utils/sanitize.js';

function sanitizeQuestions(d) {
  return asArray(d.questions)
    .slice(0, 8)
    .map((q) => ({
      question: asString(q?.question),
      focus: asString(q?.focus),
      sampleAnswer: asString(q?.sampleAnswer),
    }))
    .filter((q) => q.question);
}

export async function createInterviewSession({ user, role, difficulty, companyTarget = '', category = 'technical' }) {
  const profile = await Profile.findOne({ user }).lean();
  const prompt = interviewQuestionsPrompt({ role, difficulty, profile });

  let questions;
  let provider = 'fallback';
  let notice;
  try {
    const { data, provider: p } = await generateJSON(prompt.system, prompt.user, { temperature: 0.5 });
    questions = sanitizeQuestions(data);
    provider = p;
    if (!questions.length) throw new Error('AI returned no questions');
  } catch (err) {
    if (err.message !== 'AI_NOT_CONFIGURED' && err.code !== 'AI_NOT_CONFIGURED') {
      console.warn(`[ai] interview questions failed, using fallback: ${err.message}`);
    }
    questions = fallbackInterviewQuestions({ role, difficulty }).questions;
    notice = formatAiFallbackNotice(err, 'built-in question bank');
    provider = 'fallback';
  }

  const session = await InterviewSession.create({
    user,
    role,
    difficulty,
    companyTarget,
    category,
    provider,
    questions,
  });
  return { session, notice };
}

export async function gradeAnswer({ user, sessionId, questionIndex, answer }) {
  const session = await InterviewSession.findOne({ _id: sessionId, user });
  if (!session) {
    const err = new Error('Interview session not found');
    err.statusCode = 404;
    throw err;
  }
  const qIndex = Number(questionIndex);
  const question = session.questions[qIndex];
  if (!question) {
    const err = new Error('Invalid question index');
    err.statusCode = 400;
    throw err;
  }

  const prompt = answerFeedbackPrompt({
    role: session.role,
    question: question.question,
    sampleAnswer: question.sampleAnswer,
    answer,
  });

  let feedback;
  let notice;
  try {
    const { data } = await generateJSON(prompt.system, prompt.user, { temperature: 0.2 });
    feedback = {
      score: clamp(asNumber(data.score, 5), 0, 10),
      strengths: asStringArray(data.strengths, 4),
      improvements: asStringArray(data.improvements, 4),
      improvedAnswer: asString(data.improvedAnswer),
    };
  } catch (err) {
    feedback = fallbackAnswerFeedback({ answer, question: question.question });
    notice = formatAiFallbackNotice(err, 'heuristic interview feedback');
  }

  const existingAnswerIdx = session.answers.findIndex((a) => a.questionIndex === qIndex);
  const entry = { questionIndex: qIndex, answer, ...feedback };
  if (existingAnswerIdx >= 0) {
    session.answers[existingAnswerIdx] = entry;
  } else {
    session.answers.push(entry);
  }

  if (session.answers.length >= session.questions.length) {
    session.status = 'completed';
  }

  await session.save();
  return { session, feedback, notice };
}
