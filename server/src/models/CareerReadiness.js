import mongoose from 'mongoose';

const careerReadinessSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true, trim: true },
    careerReadinessScore: { type: Number, required: true, min: 0, max: 100 },
    breakdown: {
      resumeQuality: { type: Number, default: 0 },
      technicalCompetencies: { type: Number, default: 0 },
      projectExperience: { type: Number, default: 0 },
      certifications: { type: Number, default: 0 },
      internships: { type: Number, default: 0 },
      academicPerformance: { type: Number, default: 0 },
      alignmentWithIndustry: { type: Number, default: 0 },
    },
    strengths: { type: [String], default: [] },
    missingCompetencies: { type: [String], default: [] },
    evidenceBasedRecommendations: { type: [String], default: [] },
    explainableSummary: { type: String, default: '' },
    provider: { type: String, default: 'fallback' },
  },
  { timestamps: true }
);

careerReadinessSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('CareerReadiness', careerReadinessSchema);
