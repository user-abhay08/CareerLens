import mongoose from 'mongoose';

const careerMatchSchema = new mongoose.Schema(
  {
    title: String,
    matchScore: Number,
    description: String,
    reasons: [String],
    skillsToLearn: [String],
    salaryRange: String,
    demand: String,
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
