import mongoose from 'mongoose';

const interviewExperienceSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    authorName: { type: String, default: 'Anonymous Student' },
    company: { type: String, required: true, trim: true, index: true },
    role: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    rounds: [
      {
        roundName: { type: String, default: '' },
        roundType: {
          type: String,
          enum: ['aptitude', 'technical', 'hr', 'coding', 'managerial'],
          default: 'technical',
        },
        description: { type: String, default: '' },
        questionsAsked: { type: [String], default: [] },
      },
    ],
    tips: { type: [String], default: [] },
    outcome: { type: String, enum: ['selected', 'rejected', 'pending'], default: 'selected' },
    anonymous: { type: Boolean, default: false },
    upvotes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

interviewExperienceSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('InterviewExperience', interviewExperienceSchema);
