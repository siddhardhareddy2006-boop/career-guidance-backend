import mongoose from 'mongoose';

const engagementEventSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: {
      type: String,
      required: true,
      enum: [
        'page_view',
        'resource_view',
        'career_path_view',
        'session_booked',
        'login',
        'register',
        'career_ai_generated',
        'career_insights_generated',
      ],
    },
    path: { type: String, default: '' },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const EngagementEvent = mongoose.model('EngagementEvent', engagementEventSchema);
