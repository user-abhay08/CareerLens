import mongoose from 'mongoose';

const careerMatchSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    matchScore: { type: Number, required: true },
    description: { type: String, default: '' },
    reasons: { type: [String], default: [] },
    skillsToLearn: { type: [String], default: [] },
    matchingSkills: { type: [String], default: [] },
    missingCompetencies: { type: [String], default: [] },
    salaryRange: { type: String, default: '' },
    demand: { type: String, default: 'High' },
    recommendedCourses: { type: [String], default: [] },
    recommendedCertifications: { type: [String], default: [] },
    recommendedProjects: { type: [String], default: [] },
  },
  { _id: false }
);

const recommendationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, default: 'fallback' },
    inputSnapshot: {
      skills: { type: [String], default: [] },
      interests: { type: [String], default: [] },
    },
    careers: { type: [careerMatchSchema], default: [] },
  },
  { timestamps: true }
);

recommendationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Recommendation', recommendationSchema);
