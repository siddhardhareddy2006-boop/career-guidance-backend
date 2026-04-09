import mongoose from 'mongoose';

const savedCareerPathSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    whyItFits: { type: String, default: '' },
    typicalRoles: [{ type: String, trim: true }],
    skillsToDevelop: [{ type: String, trim: true }],
    nextSteps: [{ type: String, trim: true }],
    educationPaths: { type: String, default: '' },
    introduction: { type: String, default: '' },
    aiModel: { type: String, default: '' },
    interestsSnapshot: [{ type: String, trim: true }],
    skillsSnapshot: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export const SavedCareerPath = mongoose.model('SavedCareerPath', savedCareerPathSchema);
