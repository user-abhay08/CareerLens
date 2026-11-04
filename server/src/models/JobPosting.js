import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true },
    companyInfo: { type: String, default: '' },
    description: { type: String, default: '' },
    eligibilityCriteria: { type: [String], default: [] },
    requiredSkills: { type: [String], default: [] },
    location: { type: String, default: 'India' },
    // Restricted strictly to authorized providers LinkedIn and Remotive
    source: {
      type: String,
      enum: ['LinkedIn', 'Remotive'],
      required: true,
      index: true,
    },
    url: { type: String, required: true },
    salary: { type: String, default: '' },
    jobType: {
      type: String,
      enum: ['any', 'fulltime', 'intern', 'contractor', 'parttime'],
      default: 'fulltime',
    },
    experienceLevel: {
      type: String,
      enum: ['any', 'entry', 'senior'],
      default: 'entry',
    },
    snippet: { type: String, default: '' },
    // Embedding vector representation matching synopsis pgvector specification
    embedding: { type: [Number], default: [] },
    postedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobPostingSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('JobPosting', jobPostingSchema);
