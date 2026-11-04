import mongoose from 'mongoose';

const phaseSchema = new mongoose.Schema(
  {
    phase: String,
    title: String,
    duration: String,
    focus: String,
    skills: [String],
    resources: [String],
    milestone: String,
  },
  { _id: false }
);

const courseRecSchema = new mongoose.Schema(
  {
    title: String,
    platform: String,
    url: String,
  },
  { _id: false }
);

const certRecSchema = new mongoose.Schema(
  {
    title: String,
    provider: String,
  },
  { _id: false }
);

const projectRecSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    skills: [String],
  },
  { _id: false }
);

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true },
    provider: { type: String, default: 'fallback' },
    overview: { type: String, default: '' },
    currentSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    phases: { type: [phaseSchema], default: [] },
    // Specific recommendation categories per Synopsis Module 5
    recommendedCourses: { type: [courseRecSchema], default: [] },
    recommendedCertifications: { type: [certRecSchema], default: [] },
    recommendedProjects: { type: [projectRecSchema], default: [] },
  },
  { timestamps: true }
);

roadmapSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Roadmap', roadmapSchema);
