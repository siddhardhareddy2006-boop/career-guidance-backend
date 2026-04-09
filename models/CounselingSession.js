import mongoose from 'mongoose';

const counselingSessionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    counselor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 45 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    topic: { type: String, trim: true, default: '' },
    studentNotes: { type: String, default: '' },
    counselorNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

export const CounselingSession = mongoose.model('CounselingSession', counselingSessionSchema);
