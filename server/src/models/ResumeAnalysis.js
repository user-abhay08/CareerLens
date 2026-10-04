import mongoose from 'mongoose';

const rewrittenBulletSchema = new mongoose.Schema(
  { original: String, improved: String },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileName: { type: String, default: 'pasted-text' },
    roleContext: { type: String, default: '' },
    textLength: { type: Number, default: 0 },
    provider: { type: String, default: 'fallback' },
    result: {
      summary: { type: String, default: '' },
      atsScore: { type: Number, default: 0 },
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingSkills: { type: [String], default: [] },
      keywords: { type: [String], default: [] },
      suggestedRoles: { type: [String], default: [] },
      rewrittenBullets: { type: [rewrittenBulletSchema], default: [] },
    },
  },
  { timestamps: true }
);

resumeAnalysisSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
