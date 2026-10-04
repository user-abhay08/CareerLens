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

const roadmapSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetRole: { type: String, required: true },
    provider: { type: String, default: 'fallback' },
    overview: { type: String, default: '' },
    currentSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    phases: { type: [phaseSchema], default: [] },
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
