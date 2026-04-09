import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['student', 'counselor', 'admin'],
      default: 'student',
    },
    interests: [{ type: String, trim: true }],
    skills: [{ type: String, trim: true }],
    assignedCounselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
