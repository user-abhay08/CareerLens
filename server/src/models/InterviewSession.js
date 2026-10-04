import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: String,
    focus: String,
    sampleAnswer: String,
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    questionIndex: Number,
    answer: String,
    score: Number,
    strengths: [String],
    improvements: [String],
    improvedAnswer: String,
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    provider: { type: String, default: 'fallback' },
    status: { type: String, enum: ['open', 'completed'], default: 'open' },
    questions: { type: [questionSchema], default: [] },
    answers: { type: [answerSchema], default: [] },
  },
  { timestamps: true }
);

interviewSessionSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('InterviewSession', interviewSessionSchema);
