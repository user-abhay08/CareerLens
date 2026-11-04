import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, trim: true, default: '' },
    institution: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    cgpa: { type: Number, default: null },
    percentage: { type: Number, default: null },
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    technologies: { type: [String], default: [] },
    githubUrl: { type: String, trim: true, default: '' },
    liveUrl: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: '' },
    issuer: { type: String, trim: true, default: '' },
    issueDate: { type: String, trim: true, default: '' },
    credentialUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const internshipSchema = new mongoose.Schema(
  {
    role: { type: String, trim: true, default: '' },
    company: { type: String, trim: true, default: '' },
    duration: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, default: '' },
    targetRole: { type: String, trim: true, default: '' },
    targetCareerDomain: { type: String, trim: true, default: '' },

    // Skills
    skills: { type: [String], default: [] },
    technicalSkills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    interests: { type: [String], default: [] },

    // Structured Candidate Profile per Synopsis Modules 1 & 2
    education: { type: [educationSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    experienceYears: { type: Number, default: 0, min: 0, max: 60 },
    projects: { type: [projectSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    internships: { type: [internshipSchema], default: [] },
    achievements: { type: [String], default: [] },
    extracurricularActivities: { type: [String], default: [] },
    academicPerformance: {
      cgpa: { type: Number, default: null },
      percentage: { type: Number, default: null },
    },

    links: {
      github: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true }
);

profileSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    ret.id = ret.user?.toString?.() || ret.user;
    delete ret.user;
    return ret;
  },
});

export default mongoose.model('Profile', profileSchema);
