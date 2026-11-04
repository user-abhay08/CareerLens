import mongoose from 'mongoose';

const skillDatabaseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: {
      type: String,
      enum: ['technical', 'soft', 'framework', 'database', 'cloud', 'tool', 'language'],
      default: 'technical',
    },
    domains: { type: [String], default: [] },
    description: { type: String, default: '' },
    demand: { type: String, enum: ['High', 'Very High', 'Moderate', 'Growing'], default: 'High' },
  },
  { timestamps: true }
);

skillDatabaseSchema.set('toJSON', {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('SkillDatabase', skillDatabaseSchema);
