import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Role-based access control as specified in Synopsis (Module 1)
    role: {
      type: String,
      enum: ['student', 'recruiter', 'placement_coordinator', 'admin'],
      default: 'student',
      index: true,
    },
    department: { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: "Bharati Vidyapeeth's College of Engineering, Kolhapur" },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role || 'student',
    department: this.department || '',
    college: this.college || '',
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);
