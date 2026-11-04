import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPosting', default: null },
    jobTitle: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    source: { type: String, enum: ['LinkedIn', 'Remotive', 'Direct'], default: 'LinkedIn' },
    portalUrl: { type: String, default: '' },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interviewing', 'offered', 'rejected', 'accepted'],
      default: 'applied',
      index: true,
    },
    appliedAt: { type: Date, default: Date.now },
    notes: { type: String, default: '' },
    resumeUsed: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeAnalysis', default: null },
  },
  { timestamps: true }
);

jobApplicationSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('JobApplication', jobApplicationSchema);
