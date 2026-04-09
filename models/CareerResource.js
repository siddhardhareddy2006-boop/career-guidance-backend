import mongoose from 'mongoose';

const careerResourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    summary: { type: String, required: true },
    content: { type: String, default: '' },
    tags: [{ type: String, trim: true }],
    careerPathSlug: { type: String, trim: true },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const CareerResource = mongoose.model('CareerResource', careerResourceSchema);
